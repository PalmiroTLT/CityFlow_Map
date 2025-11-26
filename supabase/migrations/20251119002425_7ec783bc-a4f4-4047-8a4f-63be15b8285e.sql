-- Update the notify_new_place trigger to include webhook secret header
CREATE OR REPLACE FUNCTION public.notify_new_place()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  place_category_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  webhook_secret TEXT;
BEGIN
  -- Get category name
  SELECT name INTO place_category_name
  FROM public.categories
  WHERE id = NEW.category_id;

  -- Prepare notification content
  notification_title := 'Novo mesto / Новое место / New place';
  notification_body := NEW.name;
  
  IF place_category_name IS NOT NULL THEN
    notification_body := notification_body || ' (' || place_category_name || ')';
  END IF;

  -- Get webhook secret from vault (fallback to env if vault not available)
  BEGIN
    SELECT decrypted_secret INTO webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'WEBHOOK_SECRET'
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- If vault is not available or secret not found, we can't proceed securely
      RAISE WARNING 'Could not retrieve WEBHOOK_SECRET from vault: %', SQLERRM;
      RETURN NEW;
  END;

  -- Only make the request if we have the secret
  IF webhook_secret IS NOT NULL THEN
    -- Make async HTTP request to edge function with webhook secret
    PERFORM net.http_post(
      url := 'https://pvckkprcgstyfxwyjrsv.supabase.co/functions/v1/notify-new-place-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y2trcHJjZ3N0eWZ4d3lqcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzA3ODksImV4cCI6MjA3ODkwNjc4OX0.NLwaCjXizMHdjDA6UfaGxRkpeyPEOoS4zxlwVeORduM',
        'X-Webhook-Secret', webhook_secret
      ),
      body := jsonb_build_object(
        'title', notification_title,
        'body', notification_body,
        'data', jsonb_build_object(
          'place_id', NEW.id,
          'place_name', NEW.name,
          'category_id', NEW.category_id,
          'type', 'new_place'
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;