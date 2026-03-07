-- 051_anamnesis_and_radiograph.sql
-- Add anamnesis text and radiograph fields to evaluations

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS anamnesis TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_url TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_type TEXT;

COMMENT ON COLUMN public.evaluations.anamnesis IS 'Free-form anamnesis transcription from voice recording or text input';
COMMENT ON COLUMN public.evaluations.radiograph_url IS 'Supabase Storage path for uploaded radiograph (panoramic/periapical/bitewing)';
COMMENT ON COLUMN public.evaluations.radiograph_type IS 'AI-detected type: panoramic, periapical, bitewing';
