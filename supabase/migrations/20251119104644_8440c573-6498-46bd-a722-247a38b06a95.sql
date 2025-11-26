-- Add RLS policies for admins to manage countries
CREATE POLICY "Admins can manage countries"
ON public.countries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));