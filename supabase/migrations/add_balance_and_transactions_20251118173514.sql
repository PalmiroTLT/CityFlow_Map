-- Add balance to profiles
ALTER TABLE public.profiles
ADD COLUMN balance NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'tour_purchase', 'place_subscription', 'premium_subscription');

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type public.transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Update profiles RLS to allow users to read their own profile
-- First, drop the existing policy if it exists, to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- Create a new policy that allows users to view their own profile data
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());
