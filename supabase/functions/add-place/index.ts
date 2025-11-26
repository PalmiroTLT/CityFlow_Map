import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const placeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  name_en: z.string().max(200).optional().nullable(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  description_en: z.string().max(2000).optional().nullable(),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  address: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  city_id: z.string().uuid("Invalid city ID").optional().nullable(),
  image_url: z.string().url("Invalid image URL").max(500).optional().nullable(),
  google_maps_url: z.string().url("Invalid Google Maps URL").max(500).optional().nullable(),
  custom_button_url: z.string().url("Invalid custom button URL").max(500).optional().nullable(),
  custom_button_text: z.string().max(100).optional().nullable(),
  custom_page_content: z.record(z.any()).optional().nullable(),
  has_custom_page: z.boolean().optional().nullable(),
  is_premium: z.boolean().optional().nullable(),
});

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

    // Check if user is business owner
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type, credits')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'business') {
      throw new Error('Only business owners can add places');
    }

    if (profile.credits < 15) {
      throw new Error('Insufficient credits. You need 15 credits to add a place.');
    }

    const rawData = await req.json();
    
    // Validate input data
    const placeData = placeSchema.parse(rawData);

    // Create place
    const { data: place, error: placeError } = await supabaseClient
      .from('places')
      .insert({
        ...placeData,
        owner_id: user.id,
      })
      .select()
      .single();

    if (placeError) throw placeError;

    // Deduct credits
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 15 })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Log transaction
    await supabaseClient.from('credit_transactions').insert({
      user_id: user.id,
      amount: -15,
      type: 'place_added',
      description: `Added place: ${placeData.name}`,
    });

    return new Response(
      JSON.stringify({ place }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in add-place function:', error);
    
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