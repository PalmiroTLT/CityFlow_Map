-- ============================================
-- RLS Policies: Countries and Cities
-- ============================================

-- Countries: Public read access
CREATE POLICY "Anyone can view countries"
ON public.countries
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage countries"
ON public.countries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Cities: Public read access
CREATE POLICY "Anyone can view cities"
ON public.cities
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cities"
ON public.cities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));