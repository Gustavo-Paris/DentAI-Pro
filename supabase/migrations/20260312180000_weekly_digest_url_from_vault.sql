-- ===========================================
-- Migration: Weekly Digest — Read Supabase URL from Vault
-- ===========================================
-- Updates trigger_weekly_digest to read the Supabase project URL from Vault
-- instead of hardcoding it. Falls back to the hardcoded URL if the vault
-- entry does not exist (backward compatibility).
--
-- To populate the vault entry run once in the SQL editor:
--   SELECT vault.create_secret('https://xmivnwpmgpzuoxqhvkts.supabase.co', 'supabase_url', 'Supabase project URL for internal cron functions');
-- Or apply migration 20260312180100_vault_supabase_url.sql.

CREATE OR REPLACE FUNCTION public.trigger_weekly_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_service_role_key TEXT;
  v_supabase_url     TEXT;
  v_endpoint         TEXT;
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

  -- Read the Supabase project URL from Vault.
  -- Falls back to the hardcoded URL when the vault entry is absent so that
  -- existing deployments continue to work before the vault is populated.
  SELECT decrypted_secret INTO v_supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url'
  LIMIT 1;

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://xmivnwpmgpzuoxqhvkts.supabase.co';
  END IF;

  v_endpoint := v_supabase_url || '/functions/v1/send-weekly-digest';

  PERFORM net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_digest IS
  'Triggers weekly digest email via edge function. Called by pg_cron. Authenticates with service_role_key from Vault. Supabase URL read from Vault (supabase_url), falls back to hardcoded value.';
