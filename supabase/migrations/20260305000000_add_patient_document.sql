-- Add patient_document jsonb column to evaluations table
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS patient_document jsonb DEFAULT NULL;

COMMENT ON COLUMN evaluations.patient_document IS 'AI-generated patient-facing document (explanation, post-op, diet, TCLE)';
