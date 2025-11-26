import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const placeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  name_en: z.string().max(200).optional().nullable(),
  name_sr: z.string().max(200).optional().nullable(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  description_en: z.string().max(2000).optional().nullable(),
  description_sr: z.string().max(2000).optional().nullable(),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  city_id: z.string().uuid("Invalid city ID").optional().nullable(),
  plan_id: z.string().uuid("Plan ID is required"),
});

// Calculate next billing date based on billing period
function calculateNextBillingDate(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1); // Default to monthly
  }
  
  return now;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Processing place addition with subscription for user:', user.id);

    // Check if user is business owner
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type, credits')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'business') {
      throw new Error('Only business owners can add places');
    }

    const rawData = await req.json();
    const placeData = placeSchema.parse(rawData);

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', placeData.plan_id)
      .eq('is_active', true)
      .eq('type', 'place_listing')
      .single();

    if (planError || !plan) {
      throw new Error('Invalid or inactive subscription plan');
    }

    console.log('Selected plan:', plan.name, 'Price:', plan.price, 'Period:', plan.billing_period);

    // Check if user has enough credits for first payment
    if (profile.credits < plan.price) {
      throw new Error(`Insufficient credits. You need ${plan.price} credits for the first payment.`);
    }

    // Create place
    const { data: place, error: placeError } = await supabaseClient
      .from('places')
      .insert({
        name: placeData.name,
        name_en: placeData.name_en,
        name_sr: placeData.name_sr,
        description: placeData.description,
        description_en: placeData.description_en,
        description_sr: placeData.description_sr,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        address: placeData.address,
        phone: placeData.phone,
        website: placeData.website,
        category_id: placeData.category_id,
        city_id: placeData.city_id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (placeError) {
      console.error('Error creating place:', placeError);
      throw placeError;
    }

    console.log('Place created successfully:', place.id);

    // Calculate next billing date
    const nextBillingDate = calculateNextBillingDate(plan.billing_period);

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        place_id: place.id,
        plan_id: plan.id,
        next_billing_date: nextBillingDate.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      // Rollback: delete the place
      await supabaseClient.from('places').delete().eq('id', place.id);
      throw subscriptionError;
    }

    console.log('Subscription created:', subscription.id, 'Next billing:', nextBillingDate);

    // Deduct credits for first payment
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - plan.price })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      // Rollback: delete subscription and place
      await supabaseClient.from('user_subscriptions').delete().eq('id', subscription.id);
      await supabaseClient.from('places').delete().eq('id', place.id);
      throw updateError;
    }

    // Log transaction
    await supabaseClient.from('credit_transactions').insert({
      user_id: user.id,
      amount: -plan.price,
      type: 'subscription_payment',
      description: `Place listing subscription: ${placeData.name} (${plan.billing_period})`,
    });

    console.log('Credits deducted and transaction logged');

    return new Response(
      JSON.stringify({ 
        place,
        subscription,
        nextBillingDate: nextBillingDate.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in add-place-with-subscription function:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
