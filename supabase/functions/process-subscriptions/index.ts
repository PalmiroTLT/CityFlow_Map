import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    console.log('Processing subscriptions at:', now.toISOString());

    // Get all active subscriptions that need billing
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        place_id,
        plan_id,
        next_billing_date,
        cancel_at_period_end,
        subscription_plans (
          price,
          billing_period,
          type
        ),
        places (
          id,
          name,
          is_premium,
          premium_expires_at
        )
      `)
      .eq('is_active', true)
      .lte('next_billing_date', now.toISOString());

    if (subsError) throw subsError;

    console.log(`Found ${subscriptions?.length || 0} subscriptions to process`);

    const results = {
      processed: 0,
      deactivated: 0,
      hidden: 0,
      premium_removed: 0,
      errors: [] as string[],
    };

    for (const sub of subscriptions || []) {
      try {
        const plan = sub.subscription_plans as any;
        const place = sub.places as any;
        
        // Get user profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('credits')
          .eq('id', sub.user_id)
          .single();

        if (!profile) {
          results.errors.push(`Profile not found for user ${sub.user_id}`);
          continue;
        }

        // Calculate costs
        const placeCost = plan.price;
        const premiumCost = place?.is_premium ? 8 : 0;
        const totalCost = placeCost + premiumCost;

        console.log(`Processing subscription ${sub.id}: place=${placeCost}, premium=${premiumCost}, available=${profile.credits}`);

        // Priority 1: Try to pay for place (required)
        // Priority 2: Try to pay for premium (optional)
        
        let newCredits = profile.credits;
        let placeUpdates: any = {};
        let deactivateSubscription = false;

        // Check if we can pay for place
        if (profile.credits >= placeCost) {
          // Can pay for place
          newCredits -= placeCost;
          
          // Log place payment
          await supabaseClient.from('credit_transactions').insert({
            user_id: sub.user_id,
            amount: -placeCost,
            type: 'subscription_renewed',
            description: `Subscription payment for place: ${place?.name || 'Unknown'}`,
          });

          // Check if we can also pay for premium
          if (place?.is_premium && !sub.cancel_at_period_end) {
            if (newCredits >= premiumCost) {
              // Can pay for premium too
              newCredits -= premiumCost;
              
              // Calculate new premium expiration
              const nextBilling = calculateNextBillingDate(plan.billing_period);
              placeUpdates.premium_expires_at = nextBilling.toISOString();
              
              await supabaseClient.from('credit_transactions').insert({
                user_id: sub.user_id,
                amount: -premiumCost,
                type: 'premium_renewed',
                description: `Premium renewed for place: ${place?.name || 'Unknown'}`,
              });
            } else {
              // Can't afford premium - remove it
              console.log(`Removing premium for place ${place?.id} - insufficient credits`);
              placeUpdates.is_premium = false;
              placeUpdates.premium_expires_at = null;
              results.premium_removed++;
            }
          } else if (place?.is_premium && sub.cancel_at_period_end) {
            // Premium was cancelled - remove it now and reset flag
            console.log(`Removing cancelled premium for place ${place?.id}`);
            placeUpdates.is_premium = false;
            placeUpdates.premium_expires_at = null;
            results.premium_removed++;
          }

          // Update credits
          await supabaseClient
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', sub.user_id);

          // Update subscription next billing date and reset cancellation flag
          const nextBilling = calculateNextBillingDate(plan.billing_period);
          await supabaseClient
            .from('user_subscriptions')
            .update({ 
              next_billing_date: nextBilling.toISOString(),
              cancel_at_period_end: false // Reset cancellation flag
            })
            .eq('id', sub.id);

          // Update place if needed
          if (Object.keys(placeUpdates).length > 0) {
            placeUpdates.is_hidden = false; // Ensure place is visible
            await supabaseClient
              .from('places')
              .update(placeUpdates)
              .eq('id', sub.place_id);
          }

          results.processed++;
        } else {
          // Can't afford place - hide it and deactivate subscription
          console.log(`Hiding place ${place?.id} - insufficient credits`);
          
          await supabaseClient
            .from('places')
            .update({ 
              is_hidden: true,
              is_premium: false,
              premium_expires_at: null
            })
            .eq('id', sub.place_id);

          await supabaseClient
            .from('user_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);

          results.hidden++;
          results.deactivated++;
        }

        // Check if premium has expired (separate from billing)
        if (place?.is_premium && place?.premium_expires_at) {
          const premiumExpires = new Date(place.premium_expires_at);
          if (premiumExpires <= now) {
            console.log(`Premium expired for place ${place.id}`);
            await supabaseClient
              .from('places')
              .update({ 
                is_premium: false,
                premium_expires_at: null
              })
              .eq('id', place.id);
            results.premium_removed++;
          }
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing subscription ${sub.id}:`, errorMsg);
        results.errors.push(`Subscription ${sub.id}: ${errorMsg}`);
      }
    }

    console.log('Processing complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: now.toISOString(),
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateNextBillingDate(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1));
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}
