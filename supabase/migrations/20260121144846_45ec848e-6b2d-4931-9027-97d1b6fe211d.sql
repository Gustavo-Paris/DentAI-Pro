-- Create bucket for clinical photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-photos', 'clinical-photos', false);

-- RLS: users can upload their own photos
CREATE POLICY "Users can upload clinical photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can view their own photos
CREATE POLICY "Users can view own clinical photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can delete their own photos
CREATE POLICY "Users can delete own clinical photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add photo columns to evaluations table
ALTER TABLE evaluations
ADD COLUMN photo_frontal TEXT,
ADD COLUMN photo_45 TEXT,
ADD COLUMN photo_face TEXT,
ADD COLUMN stratification_protocol JSONB;