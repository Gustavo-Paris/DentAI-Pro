-- ===========================================
-- DentAI Pro - Storage Buckets
-- Execute este SQL no SQL Editor do Supabase
-- ===========================================

-- Storage Buckets
-- -------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-photos', 'clinical-photos', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('dsd-simulations', 'dsd-simulations', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);


-- Storage Policies: clinical-photos
-- -------------------------------------------

CREATE POLICY "Users can view their own clinical photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own clinical photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clinical photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clinical photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Storage Policies: dsd-simulations
-- -------------------------------------------

CREATE POLICY "Users can view their own DSD simulations"
ON storage.objects FOR SELECT
USING (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own DSD simulations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own DSD simulations"
ON storage.objects FOR DELETE
USING (bucket_id = 'dsd-simulations' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Storage Policies: avatars
-- -------------------------------------------

CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
