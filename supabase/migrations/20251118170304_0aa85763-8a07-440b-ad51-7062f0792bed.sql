-- Add credits column to profiles
ALTER TABLE public.profiles 
ADD COLUMN credits integer NOT NULL DEFAULT 0;

-- Create credit transactions table
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert transactions (we'll use service role for this)
CREATE POLICY "Service can insert transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (true);