-- Rate limiting table for edge functions
-- Tracks request counts per user per function with time windows

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,

  -- Per-minute tracking
  minute_count INTEGER NOT NULL DEFAULT 0,
  minute_window TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Per-hour tracking
  hour_count INTEGER NOT NULL DEFAULT 0,
  hour_window TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Per-day tracking
  day_count INTEGER NOT NULL DEFAULT 0,
  day_window TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for upsert
  CONSTRAINT rate_limits_user_function_unique UNIQUE (user_id, function_name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function
  ON rate_limits(user_id, function_name);

-- Index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at
  ON rate_limits(updated_at);

-- RLS policies
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits"
  ON rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all records (for edge functions)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to clean up old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records not updated in the last 7 days
  DELETE FROM rate_limits
  WHERE updated_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Comment for documentation
COMMENT ON TABLE rate_limits IS 'Tracks API request counts per user for rate limiting edge functions';
COMMENT ON COLUMN rate_limits.function_name IS 'Name of the edge function being rate limited';
COMMENT ON COLUMN rate_limits.minute_count IS 'Number of requests in the current minute window';
COMMENT ON COLUMN rate_limits.hour_count IS 'Number of requests in the current hour window';
COMMENT ON COLUMN rate_limits.day_count IS 'Number of requests in the current day window';

-- TODO: Schedule periodic cleanup of stale rate_limit rows.
-- The cleanup_old_rate_limits() function above deletes rows not updated in 7 days,
-- but it needs to be called on a schedule. Options:
--   1. pg_cron (preferred): SELECT cron.schedule('cleanup-rate-limits', '0 3 * * *', $$SELECT cleanup_old_rate_limits()$$);
--      Requires pg_cron extension: CREATE EXTENSION IF NOT EXISTS pg_cron;
--   2. Supabase cron job via Dashboard > Database > Cron Jobs
--   3. External scheduler (e.g., GitHub Actions) calling supabase.rpc('cleanup_old_rate_limits')
-- Without scheduled cleanup, the rate_limits table will grow unbounded with stale rows.
