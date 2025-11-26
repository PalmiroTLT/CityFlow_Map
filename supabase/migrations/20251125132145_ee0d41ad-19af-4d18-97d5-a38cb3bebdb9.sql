-- Configure auth hooks to call send-custom-email edge function
-- This will trigger custom email sending for verification, password recovery, and email change

-- Note: Auth hooks in Supabase need to be configured via dashboard or API
-- This migration creates a helper function that can be called manually if needed

-- Create a function to send custom emails (can be called from triggers if needed)
CREATE OR REPLACE FUNCTION public.trigger_custom_email(
  user_id UUID,
  email TEXT,
  token TEXT,
  token_hash TEXT,
  redirect_to TEXT,
  email_action_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Make HTTP request to send-custom-email edge function
  PERFORM net.http_post(
    url := 'https://pvckkprcgstyfxwyjrsv.supabase.co/functions/v1/send-custom-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user', jsonb_build_object(
        'id', user_id,
        'email', email,
        'user_metadata', jsonb_build_object(
          'language', (SELECT language FROM public.profiles WHERE id = user_id)
        )
      ),
      'email_data', jsonb_build_object(
        'token', token,
        'token_hash', token_hash,
        'redirect_to', redirect_to,
        'email_action_type', email_action_type,
        'site_url', 'https://pvckkprcgstyfxwyjrsv.supabase.co'
      )
    )
  );
END;
$$;