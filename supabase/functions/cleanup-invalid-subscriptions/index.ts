import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    console.log('🧹 Starting cleanup of invalid push subscriptions...');

    // Fetch all push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions found',
          deleted: 0,
          checked: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`📊 Found ${subscriptions.length} subscription(s) to check`);

    let deletedCount = 0;
    const invalidIds: string[] = [];

    // Test each subscription with a HEAD request
    for (const sub of subscriptions as PushSubscription[]) {
      try {
        const response = await fetch(sub.endpoint, {
          method: 'HEAD',
          headers: {
            'TTL': '0',
          },
        });

        // If endpoint returns 404 or 410, it's invalid
        if (response.status === 404 || response.status === 410) {
          console.log(`❌ Invalid subscription found: ${sub.id} (status: ${response.status})`);
          invalidIds.push(sub.id);
        } else if (!response.ok && response.status !== 201) {
          // Some other error, might still be invalid
          console.log(`⚠️ Suspicious subscription: ${sub.id} (status: ${response.status})`);
          invalidIds.push(sub.id);
        } else {
          console.log(`✅ Valid subscription: ${sub.id}`);
        }
      } catch (error) {
        // Network error or invalid endpoint
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Failed to check subscription ${sub.id}: ${errorMessage}`);
        invalidIds.push(sub.id);
      }
    }

    // Delete invalid subscriptions
    if (invalidIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', invalidIds);

      if (deleteError) {
        throw new Error(`Failed to delete subscriptions: ${deleteError.message}`);
      }

      deletedCount = invalidIds.length;
      console.log(`🗑️ Deleted ${deletedCount} invalid subscription(s)`);
    }

    console.log(`✅ Cleanup completed: ${deletedCount} deleted out of ${subscriptions.length} checked`);

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully',
        deleted: deletedCount,
        checked: subscriptions.length,
        invalidIds: invalidIds
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in cleanup-invalid-subscriptions function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
