import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret to prevent unauthorized access
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const providedSecret = req.headers.get('X-Webhook-Secret');

    if (!webhookSecret || providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { title, body, data } = await req.json();

    console.log('Webhook triggered:', { title, body, data });

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Initialize Supabase client with service role for sending notifications
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all push subscriptions
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*');

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: any) => {
        try {
          const webpush = await import('https://esm.sh/web-push@3.6.6');
          
          webpush.setVapidDetails(
            'mailto:support@example.com',
            vapidPublicKey,
            vapidPrivateKey
          );

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );

          console.log(`Notification sent to subscription ${subscription.id}`);
          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          const err = error as any;
          console.error(`Failed to send to subscription ${subscription.id}:`, err);
          
          // If subscription is no longer valid, delete it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`Deleted invalid subscription ${subscription.id}`);
          }
          
          return { success: false, subscriptionId: subscription.id, error: err.message || 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

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
    console.error('Error in notify-new-place-webhook function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
