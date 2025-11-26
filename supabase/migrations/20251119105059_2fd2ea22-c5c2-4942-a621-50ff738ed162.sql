-- Add RLS policies for admins to manage cities
CREATE POLICY "Admins can manage cities"
ON public.cities
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));