-- Fix SF-S1: Rate limit RLS policy uses USING(true) WITH CHECK(true) — too permissive.
-- Replace with explicit auth.role() = 'service_role' check.

DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
