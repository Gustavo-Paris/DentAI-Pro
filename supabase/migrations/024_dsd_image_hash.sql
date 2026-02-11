-- Add dsd_image_hash column for cross-evaluation analysis cache
-- Same image produces same hash → reuse previous DSD analysis
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS dsd_image_hash TEXT;

-- Index for fast lookups by image hash
CREATE INDEX IF NOT EXISTS idx_evaluations_dsd_image_hash
  ON evaluations (dsd_image_hash)
  WHERE dsd_image_hash IS NOT NULL;
