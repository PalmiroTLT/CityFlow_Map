-- ============================================
-- RLS Policies: Tours and Tour Places
-- ============================================

-- Tours
CREATE POLICY "Anyone can view tours"
ON public.tours
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tours"
ON public.tours
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tour Places (junction table)
CREATE POLICY "Anyone can view tour places"
ON public.tour_places
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tour places"
ON public.tour_places
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Purchased Tours
CREATE POLICY "Users can view their own purchases"
ON public.purchased_tours
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.purchased_tours
FOR INSERT
WITH CHECK (auth.uid() = user_id);