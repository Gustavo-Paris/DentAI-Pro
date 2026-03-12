DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'supabase_url') THEN
    PERFORM vault.create_secret(
      'https://xmivnwpmgpzuoxqhvkts.supabase.co',
      'supabase_url',
      'Supabase project URL for internal cron functions'
    );
  END IF;
END $$;
