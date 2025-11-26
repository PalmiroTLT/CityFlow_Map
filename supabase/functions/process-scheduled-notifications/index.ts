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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all scheduled notifications that are due and not yet sent
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabaseClient
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now);

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled notifications to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Processing ${scheduledNotifications.length} scheduled notifications`);

    // Process each scheduled notification
    for (const notification of scheduledNotifications) {
      try {
        // Get all push subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
          .from('push_subscriptions')
          .select('*');

        if (subError) {
          console.error('Error fetching subscriptions:', subError);
          continue;
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log('No subscriptions found');
          continue;
        }

        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

        if (!vapidPrivateKey || !vapidPublicKey) {
          throw new Error('VAPID keys not configured');
        }

        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          data: {},
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
              
              return { success: false, subscriptionId: subscription.id };
            }
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        // Mark notification as sent and save statistics
        await supabaseClient
          .from('scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notification.id);

        await supabaseClient
          .from('notification_statistics')
          .insert({
            title: notification.title,
            body: notification.body,
            successful_count: successful,
            failed_count: failed,
            total_recipients: results.length,
            sent_by: notification.created_by,
            is_test: false,
          });

        console.log(`Scheduled notification ${notification.id} processed: ${successful} successful, ${failed} failed`);
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Scheduled notifications processed',
        processed: scheduledNotifications.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Error in process-scheduled-notifications function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
