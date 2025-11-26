-- Add promotions field to places table
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS promotions jsonb DEFAULT NULL;