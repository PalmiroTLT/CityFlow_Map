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

-- Add subscription fields to places
ALTER TABLE public.places
ADD COLUMN subscribed_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN premium_until TIMESTAMP WITH TIME ZONE;

-- Remove is_premium column as premium_until serves the same purpose
-- ALTER TABLE public.places DROP COLUMN is_premium;
-- Note: is_premium was not added in the previous migration, so no need to drop it.
-- Let's add it now for clarity, it was mentioned in the plan.
ALTER TABLE public.places
ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT FALSE;


-- Enable RLS for transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for profiles
-- Allow users to read their own balance
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Note: An update policy for profiles should be handled by a secure database function.
-- Users should not be able to update their own balance directly.
