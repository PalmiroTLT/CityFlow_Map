-- Add phone and website fields to places table
ALTER TABLE public.places 
ADD COLUMN phone text,
ADD COLUMN website text;