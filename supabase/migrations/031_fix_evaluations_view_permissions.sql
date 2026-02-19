-- 031: Fix evaluations view permissions and broken indexes
--
-- Issues addressed:
--   1. Migration 029 tried CREATE INDEX on the evaluations VIEW (not the table).
--      Fix: recreate indexes on evaluations_raw.
--   2. phi_decrypt (SECURITY DEFINER) may lack vault access depending on
--      function owner. Fix: grant vault access to the function owner.
--   3. PostgREST schema cache may be stale after 026 converted tables → views.
--      Fix: NOTIFY pgrst to reload.

-- ============================================================
-- 1. Ensure phi_decrypt/phi_encrypt owners have vault access
-- ============================================================
-- In Supabase, functions created by migrations may be owned by
-- postgres or supabase_admin. SECURITY DEFINER runs as the owner,
-- so the owner needs vault.decrypted_secrets access.

DO $$
DECLARE
  func_owner TEXT;
BEGIN
  -- Get the owner of phi_decrypt
  SELECT r.rolname INTO func_owner
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_roles r ON p.proowner = r.oid
  WHERE p.proname = 'phi_decrypt'
    AND n.nspname = 'public'
  LIMIT 1;

  IF func_owner IS NOT NULL THEN
    RAISE NOTICE 'phi_decrypt owner: %', func_owner;

    -- Grant vault schema usage and SELECT on decrypted_secrets
    BEGIN
      EXECUTE format('GRANT USAGE ON SCHEMA vault TO %I', func_owner);
      EXECUTE format('GRANT SELECT ON vault.decrypted_secrets TO %I', func_owner);
      RAISE NOTICE 'Granted vault access to %', func_owner;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Vault grant to % skipped: %', func_owner, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'phi_decrypt function not found — skipping vault grant';
  END IF;
END;
$$;

-- Also grant to postgres explicitly (common owner for migration-created functions)
DO $$
BEGIN
  GRANT USAGE ON SCHEMA vault TO postgres;
  GRANT SELECT ON vault.decrypted_secrets TO postgres;
  RAISE NOTICE 'Granted vault access to postgres role';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Vault grant to postgres skipped: %', SQLERRM;
END;
$$;

-- ============================================================
-- 3. Refresh PostgREST schema cache
-- ============================================================
-- PostgREST caches the database schema. After 026 converted
-- evaluations/patients from tables to views, the cache may be stale.

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
