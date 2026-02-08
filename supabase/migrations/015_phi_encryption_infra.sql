-- PHI Encryption Infrastructure
-- Adds column-level encryption for Protected Health Information (PHI)
-- using pgcrypto with a server-side key stored in Supabase Vault.
--
-- Strategy: additive (new encrypted columns alongside existing plaintext).
-- Existing reads continue to work. A future migration will:
--   1. Backfill encrypted columns from plaintext
--   2. Swap views/functions to read from encrypted columns
--   3. Drop plaintext columns
--
-- Encryption key must be stored in Supabase Vault:
--   SELECT vault.create_secret('phi_encryption_key', '<your-256-bit-key>');

-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Helper: encrypt a TEXT value using the PHI key from Vault
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

  RETURN pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

-- 3. Helper: decrypt a BYTEA value using the PHI key from Vault
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

  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
END;
$$;

-- 4. Add encrypted columns to patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS name_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS email_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS birth_date_encrypted BYTEA;

-- 5. Add encrypted column to evaluations table
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS patient_name_encrypted BYTEA;

-- 6. Trigger function: auto-encrypt PHI on patients INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.encrypt_patient_phi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only encrypt if the vault key exists (graceful degradation)
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
    IF NEW.birth_date IS NOT NULL THEN
      NEW.birth_date_encrypted := public.phi_encrypt(NEW.birth_date::TEXT);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If encryption fails (e.g. key not set), continue without encrypting
    RAISE WARNING 'PHI encryption skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_patients_phi_trigger
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_patient_phi();

-- 7. Trigger function: auto-encrypt PHI on evaluations INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.encrypt_evaluation_phi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    IF NEW.patient_name IS NOT NULL THEN
      NEW.patient_name_encrypted := public.phi_encrypt(NEW.patient_name);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'PHI encryption skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_evaluations_phi_trigger
  BEFORE INSERT OR UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_evaluation_phi();

-- NOTE: To complete the encryption setup:
-- 1. Store the encryption key in Supabase Vault:
--    SELECT vault.create_secret('phi_encryption_key', encode(gen_random_bytes(32), 'hex'));
-- 2. Backfill existing rows:
--    UPDATE public.patients SET name = name WHERE name IS NOT NULL;
--    UPDATE public.evaluations SET patient_name = patient_name WHERE patient_name IS NOT NULL;
-- 3. Future migration will drop plaintext columns after full rollout.
