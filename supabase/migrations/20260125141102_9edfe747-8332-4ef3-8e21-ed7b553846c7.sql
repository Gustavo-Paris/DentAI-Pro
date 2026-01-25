-- Add patient preferences columns to evaluations table
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS patient_aesthetic_goals TEXT,
ADD COLUMN IF NOT EXISTS patient_desired_changes TEXT[];

-- Add index for desired_changes array
CREATE INDEX IF NOT EXISTS idx_evaluations_patient_desired_changes ON evaluations USING gin (patient_desired_changes);