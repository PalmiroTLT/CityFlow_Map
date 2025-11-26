-- ============================================
-- RLS Policies: Credit Transactions
-- ============================================

CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (false); -- Only edge functions with service role can insert

CREATE POLICY "Admins can insert credit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));