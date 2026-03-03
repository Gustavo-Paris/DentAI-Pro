-- ===========================================
-- Migration 050: PHI trigger fail-closed + stuck evaluations cleanup
-- ===========================================

-- 1a. PHI trigger fix (LGPD blocker)
-- Replace RAISE WARNING with RAISE EXCEPTION so INSERT/UPDATE is REJECTED
-- when encryption fails (fail-closed for LGPD).

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
    RAISE EXCEPTION 'PHI encryption failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- Also fix the patients trigger to fail-closed
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
    RAISE EXCEPTION 'PHI encryption failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 1b. Stuck evaluations cleanup
-- Marks evaluations stuck in 'analyzing' for >10 minutes as 'error'.

CREATE OR REPLACE FUNCTION public.cleanup_stuck_evaluations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE evaluations
  SET status = 'error',
      updated_at = NOW()
  WHERE status = 'analyzing'
    AND updated_at < now() - interval '10 minutes';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.cleanup_stuck_evaluations IS 'Mark evaluations stuck in analyzing state for >10 minutes as error';

-- Schedule via pg_cron if available (every 5 minutes)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-stuck-evaluations',
      '*/5 * * * *',
      'SELECT cleanup_stuck_evaluations()'
    );
  END IF;
END $outer$;
