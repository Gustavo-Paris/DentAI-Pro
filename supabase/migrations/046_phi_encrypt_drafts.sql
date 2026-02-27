-- PHI Encryption: evaluation_drafts.draft_data
--
-- Follows the same pattern as migration 026 (patients/evaluations):
--   1. Add encrypted BYTEA column
--   2. Backfill encrypted data
--   3. Rename table to _raw
--   4. Create view with auto-decryption
--   5. Add INSTEAD OF triggers for INSERT/UPDATE/DELETE
--   6. Drop plaintext column
--
-- Prerequisites:
--   - phi_encrypt / phi_decrypt functions exist (migration 032)
--   - Vault key 'phi_encryption_key' configured
--   - Full database backup taken
--
-- App code requires ZERO changes (Supabase client queries the view).

-- ============================================================
-- 1. Add encrypted column and backfill
-- ============================================================

ALTER TABLE public.evaluation_drafts
  ADD COLUMN IF NOT EXISTS draft_data_encrypted BYTEA;

-- Backfill: encrypt all existing draft_data
UPDATE public.evaluation_drafts
SET draft_data_encrypted = public.phi_encrypt(draft_data::TEXT)
WHERE draft_data IS NOT NULL
  AND draft_data_encrypted IS NULL;

-- ============================================================
-- 2. Safety check: verify all rows are encrypted
-- ============================================================

DO $$
DECLARE
  unenc BIGINT;
BEGIN
  SELECT count(*) INTO unenc
  FROM public.evaluation_drafts
  WHERE draft_data IS NOT NULL AND draft_data_encrypted IS NULL;

  IF unenc > 0 THEN
    RAISE EXCEPTION 'ABORT: % evaluation_drafts rows still have unencrypted draft_data.', unenc;
  END IF;
END;
$$;

-- ============================================================
-- 3. Rename table to _raw, drop existing triggers
-- ============================================================

DROP TRIGGER IF EXISTS update_evaluation_drafts_updated_at ON public.evaluation_drafts;

ALTER TABLE public.evaluation_drafts RENAME TO evaluation_drafts_raw;

-- Re-create updated_at trigger on renamed table
CREATE TRIGGER update_evaluation_drafts_raw_updated_at
  BEFORE UPDATE ON public.evaluation_drafts_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Move index to _raw table (rename is automatic, but be explicit)
ALTER INDEX IF EXISTS idx_evaluation_drafts_user_id
  RENAME TO idx_evaluation_drafts_raw_user_id;

-- ============================================================
-- 4. Drop plaintext column from _raw table
-- ============================================================

ALTER TABLE public.evaluation_drafts_raw
  DROP COLUMN IF EXISTS draft_data;

-- ============================================================
-- 5. Create evaluation_drafts VIEW with auto-decryption
-- ============================================================

CREATE OR REPLACE VIEW public.evaluation_drafts
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  public.phi_decrypt(draft_data_encrypted)::JSONB AS draft_data,
  created_at,
  updated_at
FROM public.evaluation_drafts_raw;

-- ============================================================
-- 6. INSTEAD OF triggers for the view
-- ============================================================

-- INSERT
CREATE OR REPLACE FUNCTION public.evaluation_drafts_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.evaluation_drafts_raw (
    id, user_id, draft_data_encrypted, created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    public.phi_encrypt(NEW.draft_data::TEXT),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    draft_data_encrypted = public.phi_encrypt(EXCLUDED.draft_data::TEXT),
    updated_at = COALESCE(EXCLUDED.updated_at, now())
  RETURNING
    id, user_id,
    public.phi_decrypt(draft_data_encrypted)::JSONB AS draft_data,
    created_at, updated_at
  INTO NEW;

  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluation_drafts_view_insert_trigger
  INSTEAD OF INSERT ON public.evaluation_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluation_drafts_view_insert();

-- UPDATE
CREATE OR REPLACE FUNCTION public.evaluation_drafts_view_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.evaluation_drafts_raw SET
    draft_data_encrypted = CASE
      WHEN NEW.draft_data IS DISTINCT FROM OLD.draft_data
      THEN public.phi_encrypt(NEW.draft_data::TEXT)
      ELSE evaluation_drafts_raw.draft_data_encrypted
    END,
    updated_at = COALESCE(NEW.updated_at, now())
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER evaluation_drafts_view_update_trigger
  INSTEAD OF UPDATE ON public.evaluation_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluation_drafts_view_update();

-- DELETE
CREATE OR REPLACE FUNCTION public.evaluation_drafts_view_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.evaluation_drafts_raw WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER evaluation_drafts_view_delete_trigger
  INSTEAD OF DELETE ON public.evaluation_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluation_drafts_view_delete();

-- ============================================================
-- 7. Update stale draft cleanup to use _raw table
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_stale_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.evaluation_drafts_raw
  WHERE updated_at < now() - INTERVAL '30 days';
END;
$$;
