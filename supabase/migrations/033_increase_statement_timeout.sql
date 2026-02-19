-- 033: Increase statement timeout for authenticated role
--
-- Problem: Evaluation INSERTs go through VIEW → INSTEAD OF trigger → phi_encrypt → vault.
-- With large payloads (base64 photos, DSD analysis JSON), the INSERT can exceed
-- the default 8s statement timeout.
--
-- Fix: Increase to 30s for authenticated role. This is safe because:
-- 1. PostgREST cancels any statement exceeding this limit
-- 2. Edge functions (service_role) already have their own 60s timeout
-- 3. 30s is generous enough for large inserts without enabling abuse

ALTER ROLE authenticated SET statement_timeout = '30s';

-- Also set for anon role (used by shared evaluation views)
ALTER ROLE anon SET statement_timeout = '15s';
