-- ===========================================
-- Migration: Weekly Digest Cron Job
-- ===========================================
-- Sends weekly digest emails to active users every Monday at 10:00 UTC (7:00 BRT).
-- Uses pg_cron + pg_net to call the send-weekly-digest edge function.
-- The CRON_SECRET is stored in vault and referenced via a wrapper function.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Wrapper function that reads the anon key from Supabase settings
-- and calls the edge function. pg_cron can only call SQL, not HTTP directly
-- with dynamic secrets, so we use this function as the bridge.
CREATE OR REPLACE FUNCTION public.trigger_weekly_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Use the Supabase anon key for auth (function has verify_jwt=false,
  -- but we add it as a convention). The function itself checks CRON_SECRET.
  -- We pass the service_role key since this runs server-side.
  v_url := 'https://xmivnwpmgpzuoxqhvkts.supabase.co/functions/v1/send-weekly-digest';

  -- Read CRON_SECRET from a custom config parameter set via:
  -- ALTER DATABASE postgres SET app.cron_secret = 'your-secret-here';
  BEGIN
    v_anon_key := current_setting('app.cron_secret', true);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'app.cron_secret not configured — skipping weekly digest';
      RETURN;
  END;

  IF v_anon_key IS NULL OR v_anon_key = '' THEN
    RAISE WARNING 'app.cron_secret is empty — skipping weekly digest';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_digest IS 'Triggers weekly digest email via edge function. Called by pg_cron.';

-- Schedule: every Monday at 10:00 UTC (7:00 BRT)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('send-weekly-digest');
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;

    PERFORM cron.schedule(
      'send-weekly-digest',
      '0 10 * * 1',
      'SELECT trigger_weekly_digest()'
    );
  END IF;
END $outer$;
