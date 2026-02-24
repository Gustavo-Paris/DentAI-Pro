-- ===========================================
-- Migration 041: Partial Indexes for Evaluations
-- ===========================================
-- Optimize common queries that filter by non-completed status.
-- Dashboard and list views frequently query analyzing/draft evaluations.

CREATE INDEX IF NOT EXISTS idx_evaluations_raw_user_pending
  ON public.evaluations_raw(user_id, created_at DESC)
  WHERE status IN ('draft', 'analyzing');

-- NOTE: Time-based partial index (WHERE created_at > NOW() - INTERVAL '30 days')
-- is not possible because NOW() is not IMMUTABLE. The composite index on
-- (user_id, created_at DESC) already covers recent-data queries efficiently
-- via index range scan.
