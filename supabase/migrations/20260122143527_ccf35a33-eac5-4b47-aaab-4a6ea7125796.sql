-- Add RLS policies for clinical-photos storage bucket
-- This ensures users can only access their own uploaded photos

-- Policy: Users can view their own photos (folder structure: user_id/filename)
CREATE POLICY "Users can view their own clinical photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'clinical-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload photos to their own folder
CREATE POLICY "Users can upload their own clinical photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clinical-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own clinical photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'clinical-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own clinical photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'clinical-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);