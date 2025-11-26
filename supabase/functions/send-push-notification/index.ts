import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode as base64urlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Convert base64url string to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Normalize VAPID private key input (supports base64url raw or PEM)
function parseVapidPrivateKey(vapidPrivateKey: string): Uint8Array {
  try {
    // If it's a PEM string, strip header/footer and all whitespace
    if (vapidPrivateKey.includes('BEGIN PRIVATE KEY') || vapidPrivateKey.includes('BEGIN EC PRIVATE KEY')) {
      console.log('🔑 Parsing PEM-formatted private key');
      const pemBody = vapidPrivateKey
        .replace(/-----BEGIN (EC )?PRIVATE KEY-----/g, '')
        .replace(/-----END (EC )?PRIVATE KEY-----/g, '')
        .replace(/\s+/g, '')
        .trim();
      
      console.log('🔑 PEM body length:', pemBody.length);
      const raw = atob(pemBody);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
      }
      console.log('✅ PEM key parsed, bytes length:', bytes.length);
      return bytes;
    }

    // Otherwise assume base64url-encoded PKCS#8
    console.log('🔑 Parsing base64url-encoded private key');
    const result = base64urlToUint8Array(vapidPrivateKey.trim());
    console.log('✅ Base64url key parsed, bytes length:', result.length);
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Failed to parse VAPID private key:', err);
    throw new Error(`Failed to decode VAPID private key: ${err.message}`);
  }
}

// Generate VAPID JWT token
async function generateVapidJWT(
  audience: string,
  subject: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(JSON.stringify(header));
  const headerEncoded = base64urlEncode(headerBytes.buffer);
  const payloadBytes = encoder.encode(JSON.stringify(jwtPayload));
  const payloadEncoded = base64urlEncode(payloadBytes.buffer);
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  let cryptoKey: CryptoKey;

  // Case 1: PEM (PKCS#8 or EC PRIVATE KEY)
  if (
    vapidPrivateKey.includes('BEGIN PRIVATE KEY') ||
    vapidPrivateKey.includes('BEGIN EC PRIVATE KEY')
  ) {
    const privateKeyBytes = parseVapidPrivateKey(vapidPrivateKey);
    cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes as BufferSource,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign'],
    );
  } else {
    // Case 2: base64url "d" + base64url public key (uncompressed EC point)
    const publicKeyBytes = base64urlToUint8Array(vapidPublicKey.trim());
    if (publicKeyBytes[0] !== 4 || publicKeyBytes.length !== 65) {
      throw new Error('Invalid VAPID public key format');
    }

    const xBytes = publicKeyBytes.slice(1, 33);
    const yBytes = publicKeyBytes.slice(33, 65);

    const x = base64urlEncode(xBytes as unknown as ArrayBuffer);
    const y = base64urlEncode(yBytes as unknown as ArrayBuffer);
    const d = vapidPrivateKey.trim();

    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d,
      ext: false,
      key_ops: ['sign'],
    } as JsonWebKey;

    cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign'],
    );
  }

  const signatureBytes = encoder.encode(unsignedToken);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signatureBytes.buffer,
  );

  const signatureEncoded = base64urlEncode(signature);
  return `${unsignedToken}.${signatureEncoded}`;
}

// HKDF key derivation
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // Import IKM
  const key = await crypto.subtle.importKey(
    'raw',
    ikm as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Extract
  const prk = await crypto.subtle.sign('HMAC', key, salt as BufferSource);

  // Expand
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const okm = new Uint8Array(length);
  let previousT = new Uint8Array(0);
  const iterations = Math.ceil(length / 32);

  for (let i = 0; i < iterations; i++) {
    const input = new Uint8Array(previousT.length + info.length + 1);
    input.set(previousT);
    input.set(info, previousT.length);
    input[previousT.length + info.length] = i + 1;

    const t = await crypto.subtle.sign('HMAC', prkKey, input);
    const tArray = new Uint8Array(t);
    const copyLength = Math.min(tArray.length, length - i * 32);
    okm.set(tArray.slice(0, copyLength), i * 32);
    previousT = tArray;
  }

  return okm;
}

// Encrypt payload using ECDH + AES-GCM
async function encryptPayload(
  payload: string,
  userPublicKey: string,
  userAuth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

  // Import user's public key
  const userPublicKeyBytes = base64urlToUint8Array(userPublicKey);
  const userPublicKeyCrypto = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret using ECDH
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKeyCrypto },
    localKeyPair.privateKey,
    256
  );

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Decode auth secret
  const authSecret = base64urlToUint8Array(userAuth);

  // Build key info
  const keyInfoEncoder = new TextEncoder();
  const keyInfo = keyInfoEncoder.encode('Content-Encoding: aes128gcm\0');

  // Derive encryption key using HKDF
  const ikm = new Uint8Array(authSecret.length + sharedSecret.byteLength);
  ikm.set(authSecret);
  ikm.set(new Uint8Array(sharedSecret), authSecret.length);

  const contentEncryptionKey = await hkdf(salt, ikm, keyInfo, 16);

  // Build nonce info
  const nonceInfo = keyInfoEncoder.encode('Content-Encoding: nonce\0');
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Pad payload
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  const paddingLength = 2;
  const paddedPayload = new Uint8Array(paddingLength + payloadBytes.length);
  paddedPayload.set(payloadBytes, paddingLength);

  // Import content encryption key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as BufferSource, tagLength: 128 },
    aesKey,
    paddedPayload as BufferSource
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    publicKey: localPublicKeyBytes,
  };
}

// Send push notification using Web Push Protocol with encryption
async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<void> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // Generate VAPID auth
  const jwt = await generateVapidJWT(audience, 'mailto:support@example.com', vapidPrivateKey, vapidPublicKey);
  
  // Encrypt payload
  const { ciphertext, salt, publicKey } = await encryptPayload(
    payload,
    subscription.p256dh,
    subscription.auth
  );

  // Send encrypted notification
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Content-Length': ciphertext.length.toString(),
      'TTL': '86400', // 24 hours
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      'Crypto-Key': `dh=${base64urlEncode(publicKey as unknown as ArrayBuffer)}`,
      'Encryption': `salt=${base64urlEncode(salt as unknown as ArrayBuffer)}`,
    },
    body: ciphertext as unknown as BodyInit,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Push notification failed: ${response.status} ${response.statusText} - ${responseText}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { title, body, data, isTest = false, testUserId = null } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get push subscriptions - either all or just test user's
    let query = supabaseClient.from('push_subscriptions').select('*');
    
    if (isTest && testUserId) {
      query = query.eq('user_id', testUserId);
    }
    
    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error('VAPID keys not configured');
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });

    console.log(`🔐 Sending encrypted notifications to ${subscriptions.length} subscription(s)`);

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: PushSubscription) => {
        try {
          await sendPushNotification(subscription, payload, vapidPublicKey, vapidPrivateKey);
          console.log(`✅ Encrypted notification sent to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          const err = error as any;
          console.error(`❌ Failed to send to subscription ${subscription.id}:`, err.message);
          
          // If subscription is no longer valid (410 Gone or 404 Not Found), delete it
          if (err.message?.includes('410') || err.message?.includes('404')) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`🗑️ Deleted invalid subscription ${subscription.id}`);
          }
          
          return { success: false, subscriptionId: subscription.id, error: err.message || 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📊 Results: ${successful} successful, ${failed} failed out of ${results.length} total`);

    // Save statistics
    await supabaseClient
      .from('notification_statistics')
      .insert({
        title,
        body,
        successful_count: successful,
        failed_count: failed,
        total_recipients: results.length,
        sent_by: user.id,
        is_test: isTest,
      });

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        successful,
        failed,
        total: results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error in send-push-notification function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
