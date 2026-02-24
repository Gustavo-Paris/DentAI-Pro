-- ===========================================
-- Migration 039: Draft Cleanup Function
-- ===========================================
-- Delete stale evaluation drafts older than 30 days.
-- Called manually or via pg_cron if available.

CREATE OR REPLACE FUNCTION public.cleanup_stale_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM evaluation_drafts
  WHERE updated_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Schedule via pg_cron (if extension is available)
-- Runs every Sunday at 3 AM UTC
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-stale-drafts',
      '0 3 * * 0',
      'SELECT cleanup_stale_drafts()'
    );
  END IF;
END $outer$;
