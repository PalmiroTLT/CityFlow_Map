-- Drop the old function that uses crypt
DROP FUNCTION IF EXISTS public.verify_admin_password(text);

-- Create a simpler function that just returns the hash for comparison
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
  
  -- Use pgcrypto's crypt function to compare
  -- This will work if pgcrypto is enabled
  BEGIN
    RETURN stored_hash = crypt(input_password, stored_hash);
  EXCEPTION
    WHEN OTHERS THEN
      -- If crypt doesn't work, return the hash so we can verify in the edge function
      RAISE EXCEPTION 'crypt_not_available:%', stored_hash;
  END;
END;
$$;