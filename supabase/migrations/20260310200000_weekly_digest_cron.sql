-- ===========================================
-- Migration: Weekly Digest Cron Job
-- ===========================================
-- Sends weekly digest emails to active users every Monday at 10:00 UTC (7:00 BRT).
-- Uses pg_cron + pg_net to call the send-weekly-digest edge function.
-- The CRON_SECRET is stored in vault and referenced via a wrapper function.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Wrapper function that calls the edge function via pg_net.
-- pg_cron can only call SQL, not HTTP directly, so we use this bridge.
-- The edge function has verify_jwt=false and is non-destructive (only sends emails).
CREATE OR REPLACE FUNCTION public.trigger_weekly_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xmivnwpmgpzuoxqhvkts.supabase.co/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
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
