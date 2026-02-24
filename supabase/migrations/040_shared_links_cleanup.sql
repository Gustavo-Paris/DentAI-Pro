-- ===========================================
-- Migration 040: Shared Links Cleanup
-- ===========================================
-- Delete expired shared links older than 7 days past expiry.
-- Called manually or via pg_cron if available.
--
-- NOTE: FK from shared_links.session_id → evaluations_raw.session_id
-- is intentionally omitted because session_id has no UNIQUE constraint
-- on evaluations_raw (multiple evaluations share a single session_id).

-- Cleanup expired shared links (older than 7 days past expiry)
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_links()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM shared_links
  WHERE expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Schedule via pg_cron (if available)
-- Runs every Sunday at 4 AM UTC
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-expired-shared-links',
      '0 4 * * 0',
      'SELECT cleanup_expired_shared_links()'
    );
  END IF;
END $outer$;
