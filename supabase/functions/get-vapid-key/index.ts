import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // VAPID public key for web push notifications
    // In production, generate this using: npx web-push generate-vapid-keys
    // and store both keys as secrets
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib27SGeRoPvzAz7UKVjBKrMWDKLqRABfVYm7_BPJIXZPvQSLGTFYw2cA5rI';

    return new Response(
      JSON.stringify({ publicKey }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Error in get-vapid-key function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
