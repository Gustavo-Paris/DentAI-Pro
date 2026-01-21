-- Add new fields to evaluations table for enhanced wizard flow
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS depth text,
  ADD COLUMN IF NOT EXISTS substrate_condition text,
  ADD COLUMN IF NOT EXISTS enamel_condition text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS protocol_layers jsonb,
  ADD COLUMN IF NOT EXISTS alerts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS warnings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS simulation_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Add comments for documentation
COMMENT ON COLUMN evaluations.patient_name IS 'Optional patient identifier';
COMMENT ON COLUMN evaluations.depth IS 'Cavity depth: superficial, medium, deep';
COMMENT ON COLUMN evaluations.substrate_condition IS 'Substrate condition: healthy, sclerotic, stained, carious';
COMMENT ON COLUMN evaluations.enamel_condition IS 'Enamel condition: intact, fractured, hypoplastic, fluorosis';
COMMENT ON COLUMN evaluations.priority IS 'Case priority: low, normal, high, urgent';
COMMENT ON COLUMN evaluations.protocol_layers IS 'Detailed stratification layers with materials and thicknesses';
COMMENT ON COLUMN evaluations.alerts IS 'Critical alerts for the case (array of strings)';
COMMENT ON COLUMN evaluations.warnings IS 'Non-critical warnings (array of strings)';
COMMENT ON COLUMN evaluations.simulation_url IS 'URL to visual simulation image';
COMMENT ON COLUMN evaluations.status IS 'Workflow status: draft, analyzing, review, completed';