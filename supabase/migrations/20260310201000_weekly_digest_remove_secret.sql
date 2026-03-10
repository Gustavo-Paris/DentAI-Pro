-- ===========================================
-- Migration: Simplify Weekly Digest Cron Auth
-- ===========================================
-- Removes the CRON_SECRET requirement from trigger_weekly_digest().
-- The edge function has verify_jwt=false and is non-destructive (only sends emails).
-- This eliminates the need for manual ALTER DATABASE or vault configuration.

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
