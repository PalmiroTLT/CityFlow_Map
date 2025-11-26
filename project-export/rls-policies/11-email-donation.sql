-- ============================================
-- RLS Policies: Email Templates and Donation Content
-- ============================================

-- Email Templates
CREATE POLICY "Anyone can view email templates"
ON public.email_templates
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Donation Content
CREATE POLICY "Anyone can read donation content"
ON public.donation_content
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view donation content"
ON public.donation_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage donation content"
ON public.donation_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));