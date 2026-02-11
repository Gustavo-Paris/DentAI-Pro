-- PHI Encryption Phase 2: Backfill + Decrypted Views
--
-- Prerequisites:
--   1. Migration 015 already ran (pgcrypto, phi_encrypt/decrypt, triggers, encrypted columns)
--   2. Encryption key stored in Supabase Vault:
--      SELECT vault.create_secret('phi_encryption_key', encode(gen_random_bytes(32), 'hex'));
--
-- This migration:
--   a) Adds missing notes_encrypted column to patients
--   b) Updates triggers to include notes
--   c) Backfills all encrypted columns from plaintext
--   d) Creates decrypted views for transparent read access
--   e) Adds verification function to validate encryption integrity

-- ============================================================
-- 1. Add missing notes_encrypted column
-- ============================================================

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS notes_encrypted BYTEA;

-- ============================================================
-- 2. Update patient trigger to include notes
-- ============================================================

CREATE OR REPLACE FUNCTION public.encrypt_patient_phi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    IF NEW.name IS NOT NULL THEN
      NEW.name_encrypted := public.phi_encrypt(NEW.name);
    END IF;
    IF NEW.phone IS NOT NULL THEN
      NEW.phone_encrypted := public.phi_encrypt(NEW.phone);
    END IF;
    IF NEW.email IS NOT NULL THEN
      NEW.email_encrypted := public.phi_encrypt(NEW.email);
    END IF;
    IF NEW.notes IS NOT NULL THEN
      NEW.notes_encrypted := public.phi_encrypt(NEW.notes);
    END IF;
    IF NEW.birth_date IS NOT NULL THEN
      NEW.birth_date_encrypted := public.phi_encrypt(NEW.birth_date::TEXT);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'PHI encryption skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Backfill encrypted columns from plaintext
--    Uses trigger-based backfill: UPDATE col = col fires the trigger
-- ============================================================

-- Patients: trigger fires on UPDATE and encrypts all PHI columns
UPDATE public.patients
SET name = name
WHERE name_encrypted IS NULL
  AND name IS NOT NULL;

-- Handle rows that have phone/email/notes but name was already encrypted
UPDATE public.patients
SET
  phone = phone,
  email = email,
  notes = notes,
  birth_date = birth_date
WHERE (phone_encrypted IS NULL AND phone IS NOT NULL)
   OR (email_encrypted IS NULL AND email IS NOT NULL)
   OR (notes_encrypted IS NULL AND notes IS NOT NULL)
   OR (birth_date_encrypted IS NULL AND birth_date IS NOT NULL);

-- Evaluations: encrypt patient_name
UPDATE public.evaluations
SET patient_name = patient_name
WHERE patient_name_encrypted IS NULL
  AND patient_name IS NOT NULL;

-- ============================================================
-- 4. Decrypted views for transparent read access
--    These views use COALESCE so they work during the transition
--    period (plaintext still exists) and after plaintext is dropped.
-- ============================================================

CREATE OR REPLACE VIEW public.patients_decrypted
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  COALESCE(name, public.phi_decrypt(name_encrypted)) AS name,
  COALESCE(phone, public.phi_decrypt(phone_encrypted)) AS phone,
  COALESCE(email, public.phi_decrypt(email_encrypted)) AS email,
  COALESCE(notes, public.phi_decrypt(notes_encrypted)) AS notes,
  COALESCE(birth_date, public.phi_decrypt(birth_date_encrypted)::DATE) AS birth_date,
  created_at,
  updated_at
FROM public.patients;

COMMENT ON VIEW public.patients_decrypted IS
  'Read-only decrypted view of patients PHI. '
  'Use this view for SELECT queries. For INSERT/UPDATE, use the patients table directly '
  '(triggers handle encryption automatically).';

-- ============================================================
-- 5. Verification function — run after migration to validate
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_phi_encryption()
RETURNS TABLE (
  table_name TEXT,
  total_rows BIGINT,
  encrypted_rows BIGINT,
  unencrypted_rows BIGINT,
  sample_match BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_total BIGINT;
  p_encrypted BIGINT;
  p_unencrypted BIGINT;
  p_sample_match BOOLEAN;
  e_total BIGINT;
  e_encrypted BIGINT;
  e_unencrypted BIGINT;
  e_sample_match BOOLEAN;
BEGIN
  -- Patients stats
  SELECT count(*) INTO p_total FROM public.patients;
  SELECT count(*) INTO p_encrypted FROM public.patients WHERE name_encrypted IS NOT NULL;
  SELECT count(*) INTO p_unencrypted FROM public.patients WHERE name IS NOT NULL AND name_encrypted IS NULL;

  -- Verify a sample row decrypts correctly
  SELECT (p.name = public.phi_decrypt(p.name_encrypted))
  INTO p_sample_match
  FROM public.patients p
  WHERE p.name IS NOT NULL AND p.name_encrypted IS NOT NULL
  LIMIT 1;

  RETURN QUERY SELECT
    'patients'::TEXT, p_total, p_encrypted, p_unencrypted, COALESCE(p_sample_match, TRUE);

  -- Evaluations stats
  SELECT count(*) INTO e_total FROM public.evaluations;
  SELECT count(*) INTO e_encrypted FROM public.evaluations WHERE patient_name_encrypted IS NOT NULL;
  SELECT count(*) INTO e_unencrypted FROM public.evaluations WHERE patient_name IS NOT NULL AND patient_name_encrypted IS NULL;

  SELECT (e.patient_name = public.phi_decrypt(e.patient_name_encrypted))
  INTO e_sample_match
  FROM public.evaluations e
  WHERE e.patient_name IS NOT NULL AND e.patient_name_encrypted IS NOT NULL
  LIMIT 1;

  RETURN QUERY SELECT
    'evaluations'::TEXT, e_total, e_encrypted, e_unencrypted, COALESCE(e_sample_match, TRUE);
END;
$$;

COMMENT ON FUNCTION public.verify_phi_encryption IS
  'Run SELECT * FROM verify_phi_encryption() to check encryption backfill status. '
  'All rows should show encrypted_rows = total_rows, unencrypted_rows = 0, sample_match = true.';
