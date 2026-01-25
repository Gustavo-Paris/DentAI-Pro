-- Add column for optional additional photos (45° and Face)
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS additional_photos JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN evaluations.additional_photos IS 'Optional photos: smile45 and face (base64 URLs for context analysis)';

-- Add index for faster queries on evaluations with additional photos
CREATE INDEX IF NOT EXISTS idx_evaluations_additional_photos 
ON evaluations USING gin (additional_photos) 
WHERE additional_photos != '{}'::jsonb;