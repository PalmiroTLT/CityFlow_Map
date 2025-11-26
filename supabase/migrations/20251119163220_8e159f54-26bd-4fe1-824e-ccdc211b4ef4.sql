-- Add Serbian language fields to places table
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS name_sr text,
ADD COLUMN IF NOT EXISTS description_sr text;

-- Add Serbian language fields to tours table
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS name_sr text,
ADD COLUMN IF NOT EXISTS description_sr text;