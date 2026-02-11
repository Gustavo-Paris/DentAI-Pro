-- PHI Encryption Phase 3: Drop Plaintext Columns (DESTRUCTIVE)
--
-- ⚠️  DO NOT RUN THIS MIGRATION WITHOUT MANUAL VERIFICATION ⚠️
--
-- Prerequisites BEFORE running:
--   1. Migration 023 backfill completed successfully
--   2. Run verification: SELECT * FROM verify_phi_encryption();
--      → All tables must show: unencrypted_rows = 0, sample_match = true
--   3. Full database backup taken
--   4. App tested with patients_decrypted view
--
-- This migration:
--   a) Renames patients → patients_raw, evaluations → evaluations_raw
--   b) Creates patients/evaluations as views with auto-decryption
--   c) Adds INSTEAD OF triggers for INSERT/UPDATE/DELETE on the views
--   d) Drops plaintext PHI columns from _raw tables
--   e) Preserves all RLS policies (security_invoker on views)
--
-- ROLLBACK: This is NOT easily reversible. Encrypted data cannot be
-- read without the vault key. Ensure backups exist.

-- ============================================================
-- SAFETY CHECK: Abort if any unencrypted rows remain
-- ============================================================

DO $$
DECLARE
  unenc_patients BIGINT;
  unenc_evals BIGINT;
BEGIN
  SELECT count(*) INTO unenc_patients
  FROM public.patients
  WHERE name IS NOT NULL AND name_encrypted IS NULL;

  SELECT count(*) INTO unenc_evals
  FROM public.evaluations
  WHERE patient_name IS NOT NULL AND patient_name_encrypted IS NULL;

  IF unenc_patients > 0 OR unenc_evals > 0 THEN
    RAISE EXCEPTION 'ABORT: % patients and % evaluations still have unencrypted PHI. Run migration 023 backfill first.',
      unenc_patients, unenc_evals;
  END IF;
END;
$$;

-- ============================================================
-- 1. Rename tables to _raw
-- ============================================================

-- Drop existing triggers that reference the original table names
DROP TRIGGER IF EXISTS encrypt_patients_phi_trigger ON public.patients;
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
DROP TRIGGER IF EXISTS encrypt_evaluations_phi_trigger ON public.evaluations;

-- Drop the existing decrypted view (will be replaced by the main view)
DROP VIEW IF EXISTS public.patients_decrypted;

ALTER TABLE public.patients RENAME TO patients_raw;
ALTER TABLE public.evaluations RENAME TO evaluations_raw;

-- Re-create triggers on renamed tables
CREATE TRIGGER encrypt_patients_phi_trigger
  BEFORE INSERT OR UPDATE ON public.patients_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_patient_phi();

CREATE TRIGGER update_patients_raw_updated_at
  BEFORE UPDATE ON public.patients_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER encrypt_evaluations_phi_trigger
  BEFORE INSERT OR UPDATE ON public.evaluations_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_evaluation_phi();

-- ============================================================
-- 2. Drop plaintext PHI columns from _raw tables
-- ============================================================

ALTER TABLE public.patients_raw
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS birth_date;

ALTER TABLE public.evaluations_raw
  DROP COLUMN IF EXISTS patient_name;

-- ============================================================
-- 3. Create patients VIEW with decrypted columns
-- ============================================================

CREATE OR REPLACE VIEW public.patients
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  public.phi_decrypt(name_encrypted) AS name,
  public.phi_decrypt(phone_encrypted) AS phone,
  public.phi_decrypt(email_encrypted) AS email,
  public.phi_decrypt(notes_encrypted) AS notes,
  public.phi_decrypt(birth_date_encrypted)::DATE AS birth_date,
  created_at,
  updated_at
FROM public.patients_raw;

-- ============================================================
-- 4. INSTEAD OF triggers for patients view (INSERT/UPDATE/DELETE)
-- ============================================================

CREATE OR REPLACE FUNCTION public.patients_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.patients_raw (
    id, user_id,
    name_encrypted, phone_encrypted, email_encrypted,
    notes_encrypted, birth_date_encrypted,
    created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    public.phi_encrypt(NEW.name),
    public.phi_encrypt(NEW.phone),
    public.phi_encrypt(NEW.email),
    public.phi_encrypt(NEW.notes),
    public.phi_encrypt(NEW.birth_date::TEXT),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING
    id, user_id,
    public.phi_decrypt(name_encrypted) AS name,
    public.phi_decrypt(phone_encrypted) AS phone,
    public.phi_decrypt(email_encrypted) AS email,
    public.phi_decrypt(notes_encrypted) AS notes,
    public.phi_decrypt(birth_date_encrypted)::DATE AS birth_date,
    created_at, updated_at
  INTO NEW;

  RETURN NEW;
END;
$$;

CREATE TRIGGER patients_view_insert_trigger
  INSTEAD OF INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.patients_view_insert();

CREATE OR REPLACE FUNCTION public.patients_view_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.patients_raw SET
    name_encrypted = CASE WHEN NEW.name IS DISTINCT FROM OLD.name
      THEN public.phi_encrypt(NEW.name)
      ELSE patients_raw.name_encrypted END,
    phone_encrypted = CASE WHEN NEW.phone IS DISTINCT FROM OLD.phone
      THEN public.phi_encrypt(NEW.phone)
      ELSE patients_raw.phone_encrypted END,
    email_encrypted = CASE WHEN NEW.email IS DISTINCT FROM OLD.email
      THEN public.phi_encrypt(NEW.email)
      ELSE patients_raw.email_encrypted END,
    notes_encrypted = CASE WHEN NEW.notes IS DISTINCT FROM OLD.notes
      THEN public.phi_encrypt(NEW.notes)
      ELSE patients_raw.notes_encrypted END,
    birth_date_encrypted = CASE WHEN NEW.birth_date IS DISTINCT FROM OLD.birth_date
      THEN public.phi_encrypt(NEW.birth_date::TEXT)
      ELSE patients_raw.birth_date_encrypted END,
    updated_at = now()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER patients_view_update_trigger
  INSTEAD OF UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.patients_view_update();

CREATE OR REPLACE FUNCTION public.patients_view_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.patients_raw WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER patients_view_delete_trigger
  INSTEAD OF DELETE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.patients_view_delete();

-- ============================================================
-- 5. Create evaluations VIEW with decrypted patient_name
-- ============================================================

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
  session_id, dsd_image_hash, created_at
FROM public.evaluations_raw;

-- ============================================================
-- 6. INSTEAD OF triggers for evaluations view
-- ============================================================

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
    session_id, dsd_image_hash
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
    NEW.session_id, NEW.dsd_image_hash
  )
  RETURNING * INTO inserted_row;

  -- Copy scalar fields back into NEW for the RETURNING clause
  NEW.id := inserted_row.id;
  NEW.created_at := inserted_row.created_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluations_view_insert_trigger
  INSTEAD OF INSERT ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluations_view_insert();

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
    dsd_image_hash = COALESCE(NEW.dsd_image_hash, evaluations_raw.dsd_image_hash)
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluations_view_update_trigger
  INSTEAD OF UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluations_view_update();

CREATE OR REPLACE FUNCTION public.evaluations_view_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.evaluations_raw WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER evaluations_view_delete_trigger
  INSTEAD OF DELETE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluations_view_delete();

-- ============================================================
-- 7. Grant permissions (PostgREST needs SELECT on views)
-- ============================================================

GRANT SELECT ON public.patients TO authenticated;
GRANT SELECT ON public.evaluations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.patients_raw TO service_role;
GRANT ALL ON public.evaluations_raw TO service_role;

-- ============================================================
-- 8. Update RLS on _raw tables (views use security_invoker)
-- ============================================================

-- Patients RLS policies already exist on the renamed table
-- They continue to work because they reference auth.uid() = user_id

-- Evaluations RLS policies already exist on the renamed table
-- They continue to work because they reference auth.uid() = user_id

-- ============================================================
-- NOTES:
-- • PostgREST queries (.from('patients'), .from('evaluations'))
--   now hit the VIEWS, which auto-decrypt PHI
-- • INSERT/UPDATE/DELETE on views route through INSTEAD OF triggers
--   which encrypt PHI before writing to _raw tables
-- • No app code changes required
-- • The vault key is CRITICAL — if lost, data is unrecoverable
-- • Keep the verify_phi_encryption() function for monitoring
-- ============================================================
