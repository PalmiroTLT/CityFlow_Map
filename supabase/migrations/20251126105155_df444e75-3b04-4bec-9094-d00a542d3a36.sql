-- Enable RLS on donation_content if not already enabled
ALTER TABLE public.donation_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone (including anonymous users) to read donation content
CREATE POLICY "Anyone can read donation content"
ON public.donation_content
FOR SELECT
USING (true);