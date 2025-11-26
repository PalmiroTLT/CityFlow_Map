-- ============================================
-- RLS Policies: Places
-- ============================================

CREATE POLICY "Anyone can view places"
ON public.places
FOR SELECT
USING (true);

CREATE POLICY "Business owners can insert their places"
ON public.places
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'business'::user_type
  )
);

CREATE POLICY "Business owners can update their places"
ON public.places
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete their places"
ON public.places
FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage places"
ON public.places
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));