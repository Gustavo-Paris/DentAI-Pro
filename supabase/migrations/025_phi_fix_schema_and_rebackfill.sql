-- PHI Encryption Fix: Schema-qualify pgcrypto functions + Re-backfill
--
-- In Supabase hosted, pgcrypto is installed in the 'extensions' schema.
-- The phi_encrypt/phi_decrypt functions created in migration 015 used
-- unqualified pgp_sym_encrypt/pgp_sym_decrypt which failed silently.
-- This migration fixes the functions and re-runs the backfill.

-- ============================================================
-- 1. Fix phi_encrypt to use extensions.pgp_sym_encrypt
-- ============================================================

CREATE OR REPLACE FUNCTION public.phi_encrypt(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO encryption_key
    FROM vault.decrypted_secrets
    WHERE name = 'phi_encryption_key'
    LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'PHI encryption key not found in vault';
  END IF;

  RETURN extensions.pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

-- ============================================================
-- 2. Fix phi_decrypt to use extensions.pgp_sym_decrypt
-- ============================================================

CREATE OR REPLACE FUNCTION public.phi_decrypt(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO encryption_key
    FROM vault.decrypted_secrets
    WHERE name = 'phi_encryption_key'
    LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'PHI encryption key not found in vault';
  END IF;

  RETURN extensions.pgp_sym_decrypt(ciphertext, encryption_key);
END;
$$;

-- ============================================================
-- 3. Re-backfill: trigger-based UPDATE fires encrypt_patient_phi
--    which calls the now-fixed phi_encrypt function
-- ============================================================

-- Force re-encrypt all patients (trigger fires on UPDATE)
UPDATE public.patients
SET name = name
WHERE name IS NOT NULL;

-- Force re-encrypt all evaluations
UPDATE public.evaluations
SET patient_name = patient_name
WHERE patient_name IS NOT NULL;

-- ============================================================
-- 4. Verify the backfill worked
-- ============================================================

DO $$
DECLARE
  unenc_patients BIGINT;
  unenc_evals BIGINT;
  sample_ok BOOLEAN;
BEGIN
  SELECT count(*) INTO unenc_patients
  FROM public.patients
  WHERE name IS NOT NULL AND name_encrypted IS NULL;

  SELECT count(*) INTO unenc_evals
  FROM public.evaluations
  WHERE patient_name IS NOT NULL AND patient_name_encrypted IS NULL;

  -- Test decryption on a sample row
  SELECT (p.name = public.phi_decrypt(p.name_encrypted))
  INTO sample_ok
  FROM public.patients p
  WHERE p.name IS NOT NULL AND p.name_encrypted IS NOT NULL
  LIMIT 1;

  RAISE NOTICE 'PHI Backfill Results:';
  RAISE NOTICE '  Patients unencrypted: % (should be 0)', unenc_patients;
  RAISE NOTICE '  Evaluations unencrypted: % (should be 0)', unenc_evals;
  RAISE NOTICE '  Sample decrypt match: % (should be true)', COALESCE(sample_ok, true);

  IF unenc_patients > 0 OR unenc_evals > 0 THEN
    RAISE WARNING 'Some rows were not encrypted! Check trigger functions.';
  END IF;
END;
$$;
