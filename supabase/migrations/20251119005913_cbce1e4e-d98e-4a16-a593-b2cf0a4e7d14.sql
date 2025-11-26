-- Add image_url and tour_content fields to tours table
ALTER TABLE public.tours 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS tour_content JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tours.image_url IS 'URL of the tour cover image';
COMMENT ON COLUMN public.tours.tour_content IS 'JSON content for tour popup (description, includes, etc.)';