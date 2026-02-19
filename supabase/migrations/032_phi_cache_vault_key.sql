-- 032: Cache vault encryption key per transaction
--
-- Problem: phi_decrypt/phi_encrypt query vault.decrypted_secrets on EVERY call.
-- For a SELECT on the evaluations view with N rows, that's N vault lookups.
-- With 50+ rows, this exceeds the 8s statement timeout → 500 errors.
--
-- Fix: Cache the key in a transaction-local session variable (set_config with
-- is_local=true). First call fetches from vault; subsequent calls in the same
-- transaction use the cached value. Key is automatically cleared when the
-- transaction ends.

-- ============================================================
-- 1. Optimized phi_decrypt with per-transaction key cache
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

  -- Try cached key first (transaction-local)
  encryption_key := current_setting('app.phi_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- Cache miss: fetch from vault
    SELECT decrypted_secret INTO encryption_key
      FROM vault.decrypted_secrets
      WHERE name = 'phi_encryption_key'
      LIMIT 1;

    IF encryption_key IS NULL THEN
      RAISE EXCEPTION 'PHI encryption key not found in vault';
    END IF;

    -- Cache for remainder of this transaction
    PERFORM set_config('app.phi_key', encryption_key, true);
  END IF;

  RETURN extensions.pgp_sym_decrypt(ciphertext, encryption_key);
END;
$$;

-- ============================================================
-- 2. Optimized phi_encrypt with per-transaction key cache
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

  -- Try cached key first (transaction-local)
  encryption_key := current_setting('app.phi_key', true);

  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- Cache miss: fetch from vault
    SELECT decrypted_secret INTO encryption_key
      FROM vault.decrypted_secrets
      WHERE name = 'phi_encryption_key'
      LIMIT 1;

    IF encryption_key IS NULL THEN
      RAISE EXCEPTION 'PHI encryption key not found in vault';
    END IF;

    -- Cache for remainder of this transaction
    PERFORM set_config('app.phi_key', encryption_key, true);
  END IF;

  RETURN extensions.pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

-- ============================================================
-- 3. Drop redundant encryption trigger on evaluations_raw
-- ============================================================
-- The INSTEAD OF trigger on the evaluations VIEW already calls
-- phi_encrypt(). The BEFORE trigger on evaluations_raw fires
-- redundantly and errors (patient_name column was dropped).

DROP TRIGGER IF EXISTS encrypt_evaluations_phi_trigger ON public.evaluations_raw;

-- Same for patients_raw: the INSTEAD OF trigger handles encryption.
DROP TRIGGER IF EXISTS encrypt_patients_phi_trigger ON public.patients_raw;
