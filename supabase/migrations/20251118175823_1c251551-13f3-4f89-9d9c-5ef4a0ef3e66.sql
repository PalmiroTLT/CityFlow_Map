-- Fix RLS policies for security issues

-- 1. Fix profiles table - users can only see their own profile, admins see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix user_roles table - users can only see their own roles, admins see all
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix credit_transactions INSERT policy - only service role can insert
DROP POLICY IF EXISTS "Service can insert transactions" ON public.credit_transactions;

CREATE POLICY "Only service role can insert transactions"
  ON public.credit_transactions
  FOR INSERT
  WITH CHECK (false); -- No one through API, only edge functions with service role

-- 4. Fix functions search_path (recreate with proper settings)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, country_id, city_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'business' THEN 'business'::user_type
      ELSE 'individual'::user_type
    END,
    (NEW.raw_user_meta_data->>'country_id')::uuid,
    (NEW.raw_user_meta_data->>'city_id')::uuid
  );
  
  -- Check if this is the admin user
  IF NEW.email = 'qwe@qwe.qwe' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;