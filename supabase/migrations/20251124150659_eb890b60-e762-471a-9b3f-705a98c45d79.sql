-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.verify_admin_password(text);

-- Recreate the function to use pgcrypto's crypt
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
  
  -- Compare using crypt function from pgcrypto
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Test the setup by recreating the password hash
DELETE FROM admin_passwords;
INSERT INTO admin_passwords (password_hash)
VALUES (crypt('VeloPug73', gen_salt('bf')));