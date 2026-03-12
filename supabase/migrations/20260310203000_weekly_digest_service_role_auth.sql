-- ===========================================
-- Migration: Weekly Digest Auth via Service Role Key
-- ===========================================
-- Replaces the ad-hoc CRON_SECRET with the project's service_role_key stored
-- in Supabase Vault (vault.secrets name = 'service_role_key').
--
-- The trigger function reads the key from vault at call time and passes it as
-- a Bearer token. The edge function verifies it against SUPABASE_SERVICE_ROLE_KEY,
-- which is automatically available to all edge functions — no extra secret needed.
--
-- To populate the vault entry run once in the SQL editor (replace <SERVICE_ROLE_KEY>):
--   SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key', 'Supabase service role key for internal cron auth');
-- Or if it already exists under a different name, adjust the WHERE clause below.

CREATE OR REPLACE FUNCTION public.trigger_weekly_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_service_role_key TEXT;
BEGIN
  -- Read the service role key from Supabase Vault.
  -- Vault entry must exist with name = 'service_role_key'.
  SELECT decrypted_secret INTO v_service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'service_role_key not found in vault — skipping weekly digest';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://xmivnwpmgpzuoxqhvkts.supabase.co/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_digest IS
  'Triggers weekly digest email via edge function. Called by pg_cron. Authenticates with service_role_key from Vault.';
