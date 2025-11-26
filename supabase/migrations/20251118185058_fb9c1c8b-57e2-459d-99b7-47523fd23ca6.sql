-- Drop previous trigger and function
DROP TRIGGER IF EXISTS trigger_notify_new_place ON public.places;
DROP FUNCTION IF EXISTS public.notify_new_place();

-- Function to send push notification when a new place is created
-- Uses Supabase anon key instead of service role
CREATE OR REPLACE FUNCTION public.notify_new_place()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  place_category_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
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

  -- Make async HTTP request to edge function using anon key
  -- The edge function will be public (no JWT verification)
  PERFORM net.http_post(
    url := 'https://pvckkprcgstyfxwyjrsv.supabase.co/functions/v1/notify-new-place-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y2trcHJjZ3N0eWZ4d3lqcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzA3ODksImV4cCI6MjA3ODkwNjc4OX0.NLwaCjXizMHdjDA6UfaGxRkpeyPEOoS4zxlwVeORduM'
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

  RETURN NEW;
END;
$$;

-- Create trigger for new places
CREATE TRIGGER trigger_notify_new_place
  AFTER INSERT ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_place();