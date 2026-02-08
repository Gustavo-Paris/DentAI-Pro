-- C1: Enable RLS on prompt_executions table
-- This table stores AI execution metadata (models, tokens, costs, latency, errors).
-- Without RLS, any authenticated user could read all rows via PostgREST.
-- Only the service role (used by edge functions via metrics-adapter.ts) needs access.

ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions write metrics via service role key)
CREATE POLICY "Service role full access"
  ON prompt_executions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
