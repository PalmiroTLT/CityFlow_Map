-- Create a function to verify admin password using crypt
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the most recent password hash
  SELECT password_hash INTO stored_hash
  FROM admin_passwords
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no password found, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare using crypt function
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;