-- ===========================================
-- Migration 043: Production Audit Fixes
-- ===========================================
-- Three fixes from the production audit:
--   C1. Expand treatment_type CHECK to include gengivoplastia, recobrimento_radicular
--   H3. PHI encryption must fail closed (LGPD Art. 46) — RAISE EXCEPTION instead of WARNING
--   H5. Missing INSERT/UPDATE RLS policies on credit_pack_purchases for service_role

-- ===========================================
-- FIX C1: treatment_type CHECK constraint
-- ===========================================
-- The CHECK from 037_production_readiness.sql only allows 6 values.
-- Add gengivoplastia and recobrimento_radicular.

ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_raw_treatment_type_check;

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_treatment_type_check
  CHECK (treatment_type IN (
    'resina', 'porcelana', 'implante', 'coroa', 'endodontia', 'encaminhamento',
    'gengivoplastia', 'recobrimento_radicular'
  ))
  NOT VALID;

-- ===========================================
-- FIX H3: PHI encryption must fail closed (LGPD Art. 46)
-- ===========================================
-- Current encrypt_patient_phi() from 023_phi_backfill_and_views.sql
-- catches exceptions with RAISE WARNING and continues the INSERT,
-- storing plaintext without encryption. This violates LGPD Art. 46
-- (security safeguards). Change to RAISE EXCEPTION to reject the INSERT.

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
    RAISE EXCEPTION 'PHI encryption failed — refusing INSERT (LGPD Art. 46): %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ===========================================
-- FIX H5: credit_pack_purchases missing INSERT/UPDATE policy for service_role
-- ===========================================
-- Edge functions (Stripe webhook) need to INSERT and UPDATE rows
-- in credit_pack_purchases using service_role. RLS is enabled but
-- only a SELECT policy exists.

CREATE POLICY "Service role can insert purchases"
  ON public.credit_pack_purchases
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
  ON public.credit_pack_purchases
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
