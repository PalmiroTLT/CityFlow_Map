-- ============================================
-- RLS Policies: Page Views and Share Statistics
-- ============================================

-- Page Views
CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Place owners can view their place statistics"
ON public.page_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.places
    WHERE id = place_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true); -- Allows anonymous page views

-- Share Statistics
CREATE POLICY "Admins can view all share statistics"
ON public.share_statistics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Business owners can view own place share statistics"
ON public.share_statistics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.places
    WHERE id = place_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert share statistics"
ON public.share_statistics
FOR INSERT
WITH CHECK (true);