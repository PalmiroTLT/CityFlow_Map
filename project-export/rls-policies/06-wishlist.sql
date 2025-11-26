-- ============================================
-- RLS Policies: User Places (Wishlist)
-- ============================================

CREATE POLICY "Users can view own wishlist"
ON public.user_places
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wishlists"
ON public.user_places
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can add to wishlist"
ON public.user_places
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
ON public.user_places
FOR DELETE
USING (auth.uid() = user_id);