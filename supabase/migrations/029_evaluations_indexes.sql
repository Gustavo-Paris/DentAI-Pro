-- 029: Performance indexes for evaluations table
-- Optimizes dashboard metrics and session listing queries
-- NOTE: evaluations is now a VIEW (since migration 026). Indexes go on evaluations_raw.

-- Optimize dashboard "pending teeth" count query (getDashboardMetrics filters by status)
CREATE INDEX IF NOT EXISTS idx_evaluations_raw_user_status
  ON public.evaluations_raw(user_id, status);

-- Optimize session listing with user ownership
CREATE INDEX IF NOT EXISTS idx_evaluations_raw_session_user
  ON public.evaluations_raw(session_id, user_id);
