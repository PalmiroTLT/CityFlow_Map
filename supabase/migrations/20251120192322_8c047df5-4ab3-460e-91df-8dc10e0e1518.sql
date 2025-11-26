-- Add policy for admins to view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));