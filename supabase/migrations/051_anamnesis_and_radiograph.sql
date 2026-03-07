-- 051_anamnesis_and_radiograph.sql
-- Add anamnesis text and radiograph fields to evaluations
-- NOTE: evaluations is a VIEW over evaluations_raw with PHI decryption

-- 1. Add columns to the real table
ALTER TABLE public.evaluations_raw
  ADD COLUMN IF NOT EXISTS anamnesis TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_url TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_type TEXT;

COMMENT ON COLUMN public.evaluations_raw.anamnesis IS 'Free-form anamnesis transcription from voice recording or text input';
COMMENT ON COLUMN public.evaluations_raw.radiograph_url IS 'Supabase Storage path for uploaded radiograph (panoramic/periapical/bitewing)';
COMMENT ON COLUMN public.evaluations_raw.radiograph_type IS 'AI-detected type: panoramic, periapical, bitewing';

-- 2. Recreate the evaluations view to include new columns
CREATE OR REPLACE VIEW public.evaluations
WITH (security_invoker = true)
AS
SELECT
  id, user_id, patient_id,
  public.phi_decrypt(patient_name_encrypted) AS patient_name,
  patient_age, tooth, region, cavity_class, restoration_size,
  substrate, substrate_condition, enamel_condition, depth,
  aesthetic_level, tooth_color, stratification_needed,
  bruxism, longevity_expectation, budget, priority,
  status, treatment_type, desired_tooth_shape,
  recommended_resin_id, recommendation_text, alternatives,
  ideal_resin_id, ideal_reason, is_from_inventory,
  has_inventory_at_creation, ai_treatment_indication, ai_indication_reason,
  stratification_protocol, protocol_layers, cementation_protocol,
  generic_protocol, checklist_progress, alerts, warnings,
  photo_frontal, photo_45, photo_face, additional_photos,
  tooth_bounds, dsd_analysis, dsd_simulation_url, dsd_simulation_layers,
  simulation_url, patient_aesthetic_goals, patient_desired_changes,
  session_id, dsd_image_hash, created_at,
  patient_document,
  anamnesis,
  radiograph_url,
  radiograph_type
FROM public.evaluations_raw;

-- 3. Recreate INSTEAD OF UPDATE trigger to include new columns
CREATE OR REPLACE FUNCTION public.evaluations_view_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.evaluations_raw SET
    patient_name_encrypted = CASE WHEN NEW.patient_name IS DISTINCT FROM OLD.patient_name
      THEN public.phi_encrypt(NEW.patient_name)
      ELSE evaluations_raw.patient_name_encrypted END,
    patient_id = COALESCE(NEW.patient_id, evaluations_raw.patient_id),
    patient_age = COALESCE(NEW.patient_age, evaluations_raw.patient_age),
    status = COALESCE(NEW.status, evaluations_raw.status),
    treatment_type = COALESCE(NEW.treatment_type, evaluations_raw.treatment_type),
    recommended_resin_id = COALESCE(NEW.recommended_resin_id, evaluations_raw.recommended_resin_id),
    recommendation_text = COALESCE(NEW.recommendation_text, evaluations_raw.recommendation_text),
    alternatives = COALESCE(NEW.alternatives, evaluations_raw.alternatives),
    ideal_resin_id = COALESCE(NEW.ideal_resin_id, evaluations_raw.ideal_resin_id),
    ideal_reason = COALESCE(NEW.ideal_reason, evaluations_raw.ideal_reason),
    is_from_inventory = COALESCE(NEW.is_from_inventory, evaluations_raw.is_from_inventory),
    stratification_protocol = COALESCE(NEW.stratification_protocol, evaluations_raw.stratification_protocol),
    protocol_layers = COALESCE(NEW.protocol_layers, evaluations_raw.protocol_layers),
    cementation_protocol = COALESCE(NEW.cementation_protocol, evaluations_raw.cementation_protocol),
    generic_protocol = COALESCE(NEW.generic_protocol, evaluations_raw.generic_protocol),
    checklist_progress = COALESCE(NEW.checklist_progress, evaluations_raw.checklist_progress),
    alerts = COALESCE(NEW.alerts, evaluations_raw.alerts),
    warnings = COALESCE(NEW.warnings, evaluations_raw.warnings),
    dsd_analysis = COALESCE(NEW.dsd_analysis, evaluations_raw.dsd_analysis),
    dsd_simulation_url = COALESCE(NEW.dsd_simulation_url, evaluations_raw.dsd_simulation_url),
    dsd_simulation_layers = COALESCE(NEW.dsd_simulation_layers, evaluations_raw.dsd_simulation_layers),
    dsd_image_hash = COALESCE(NEW.dsd_image_hash, evaluations_raw.dsd_image_hash),
    patient_document = COALESCE(NEW.patient_document, evaluations_raw.patient_document),
    anamnesis = COALESCE(NEW.anamnesis, evaluations_raw.anamnesis),
    radiograph_url = COALESCE(NEW.radiograph_url, evaluations_raw.radiograph_url),
    radiograph_type = COALESCE(NEW.radiograph_type, evaluations_raw.radiograph_type)
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

-- 4. Recreate INSTEAD OF INSERT trigger to include new columns
CREATE OR REPLACE FUNCTION public.evaluations_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_row public.evaluations_raw;
BEGIN
  INSERT INTO public.evaluations_raw (
    id, user_id, patient_id, patient_name_encrypted,
    patient_age, tooth, region, cavity_class, restoration_size,
    substrate, substrate_condition, enamel_condition, depth,
    aesthetic_level, tooth_color, stratification_needed,
    bruxism, longevity_expectation, budget, priority,
    status, treatment_type, desired_tooth_shape,
    recommended_resin_id, recommendation_text, alternatives,
    ideal_resin_id, ideal_reason, is_from_inventory,
    has_inventory_at_creation, ai_treatment_indication, ai_indication_reason,
    stratification_protocol, protocol_layers, cementation_protocol,
    generic_protocol, checklist_progress, alerts, warnings,
    photo_frontal, photo_45, photo_face, additional_photos,
    tooth_bounds, dsd_analysis, dsd_simulation_url, dsd_simulation_layers,
    simulation_url, patient_aesthetic_goals, patient_desired_changes,
    session_id, dsd_image_hash, patient_document,
    anamnesis, radiograph_url, radiograph_type
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id, NEW.patient_id,
    public.phi_encrypt(NEW.patient_name),
    NEW.patient_age, NEW.tooth, NEW.region, NEW.cavity_class, NEW.restoration_size,
    NEW.substrate, NEW.substrate_condition, NEW.enamel_condition, NEW.depth,
    NEW.aesthetic_level, NEW.tooth_color, NEW.stratification_needed,
    NEW.bruxism, NEW.longevity_expectation, NEW.budget, NEW.priority,
    NEW.status, NEW.treatment_type, NEW.desired_tooth_shape,
    NEW.recommended_resin_id, NEW.recommendation_text, NEW.alternatives,
    NEW.ideal_resin_id, NEW.ideal_reason, NEW.is_from_inventory,
    NEW.has_inventory_at_creation, NEW.ai_treatment_indication, NEW.ai_indication_reason,
    NEW.stratification_protocol, NEW.protocol_layers, NEW.cementation_protocol,
    NEW.generic_protocol, NEW.checklist_progress, NEW.alerts, NEW.warnings,
    NEW.photo_frontal, NEW.photo_45, NEW.photo_face, NEW.additional_photos,
    NEW.tooth_bounds, NEW.dsd_analysis, NEW.dsd_simulation_url, NEW.dsd_simulation_layers,
    NEW.simulation_url, NEW.patient_aesthetic_goals, NEW.patient_desired_changes,
    NEW.session_id, NEW.dsd_image_hash, NEW.patient_document,
    NEW.anamnesis, NEW.radiograph_url, NEW.radiograph_type
  )
  RETURNING * INTO inserted_row;

  NEW.id := inserted_row.id;
  NEW.created_at := inserted_row.created_at;
  RETURN NEW;
END;
$$;
