-- Insert service_role_key into Vault for cron trigger auth (idempotent)
-- NOTE: This migration was applied with the actual service_role_key.
-- The key below is a placeholder — the real value lives only in the remote DB.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') THEN
    RAISE NOTICE 'Run manually: SELECT vault.create_secret(''<SERVICE_ROLE_KEY>'', ''service_role_key'', ''Supabase service role key for internal cron auth'');';
  END IF;
END $$;
