-- 029: Performance indexes for evaluations table
-- Optimizes dashboard metrics and session listing queries

-- Optimize dashboard "pending teeth" count query (getDashboardMetrics filters by status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluations_user_status
  ON public.evaluations(user_id, status);

-- Optimize session listing with user ownership
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluations_session_user
  ON public.evaluations(session_id, user_id);
