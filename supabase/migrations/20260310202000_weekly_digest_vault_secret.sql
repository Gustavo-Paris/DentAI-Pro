-- ===========================================
-- Migration: Weekly Digest Auth via Vault
-- ===========================================
-- Stores CRON_SECRET in Supabase Vault and updates trigger_weekly_digest()
-- to read it and pass as Bearer token to the edge function.
-- The edge function validates this token against its own CRON_SECRET env var.

-- Store the secret in vault (idempotent — skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') THEN
    PERFORM vault.create_secret(
      'b4cd42e1ab9dd4ff206c69aef030f5b6dbaa265f44217b53cd33db6ad8e53850',
      'cron_secret',
      'Secret token for authenticating pg_cron calls to edge functions'
    );
  END IF;
END $$;

-- Update the trigger function to read from vault and pass as Bearer token
CREATE OR REPLACE FUNCTION public.trigger_weekly_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  -- Read CRON_SECRET from Supabase Vault
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'cron_secret not found in vault — skipping weekly digest';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://xmivnwpmgpzuoxqhvkts.supabase.co/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;
