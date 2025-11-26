-- Add guide content field to tours table
ALTER TABLE tours ADD COLUMN IF NOT EXISTS guide_content jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN tours.guide_content IS 'Custom guide page content with header, blocks, and navigation';