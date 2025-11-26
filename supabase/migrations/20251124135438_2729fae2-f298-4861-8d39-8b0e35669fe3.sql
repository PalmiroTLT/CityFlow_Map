-- Create admin_passwords table for additional admin authentication
CREATE TABLE IF NOT EXISTS public.admin_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_passwords ENABLE ROW LEVEL SECURITY;

-- Only service role can read (for verification)
CREATE POLICY "Service role can read admin passwords"
  ON public.admin_passwords
  FOR SELECT
  TO service_role
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_passwords_updated_at
  BEFORE UPDATE ON public.admin_passwords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial admin password (hash of "admin123" - CHANGE THIS IN PRODUCTION!)
-- Using bcrypt hash generated with cost factor 10
INSERT INTO public.admin_passwords (password_hash) 
VALUES ('$2a$10$rZ6ixLc0qN5K8mF4pPxHOOxL5vLLJx5kG.wPqZqhK.XzZz8H7JgBG')
ON CONFLICT DO NOTHING;