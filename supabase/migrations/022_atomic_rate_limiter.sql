-- Atomic rate limiter RPC function
-- Replaces the non-atomic SELECT + UPSERT pattern in rateLimit.ts
-- Uses INSERT ... ON CONFLICT DO UPDATE with conditional window reset
-- Returns updated counts in a single atomic operation

CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_minute_window TIMESTAMPTZ,
  p_hour_window TIMESTAMPTZ,
  p_day_window TIMESTAMPTZ
)
RETURNS TABLE (
  minute_count INTEGER,
  hour_count INTEGER,
  day_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO rate_limits (
    user_id,
    function_name,
    minute_count,
    minute_window,
    hour_count,
    hour_window,
    day_count,
    day_window,
    updated_at
  ) VALUES (
    p_user_id,
    p_function_name,
    1,
    p_minute_window,
    1,
    p_hour_window,
    1,
    p_day_window,
    NOW()
  )
  ON CONFLICT (user_id, function_name)
  DO UPDATE SET
    -- Reset minute count if window changed, otherwise increment
    minute_count = CASE
      WHEN rate_limits.minute_window < p_minute_window THEN 1
      ELSE rate_limits.minute_count + 1
    END,
    minute_window = GREATEST(rate_limits.minute_window, p_minute_window),

    -- Reset hour count if window changed, otherwise increment
    hour_count = CASE
      WHEN rate_limits.hour_window < p_hour_window THEN 1
      ELSE rate_limits.hour_count + 1
    END,
    hour_window = GREATEST(rate_limits.hour_window, p_hour_window),

    -- Reset day count if window changed, otherwise increment
    day_count = CASE
      WHEN rate_limits.day_window < p_day_window THEN 1
      ELSE rate_limits.day_count + 1
    END,
    day_window = GREATEST(rate_limits.day_window, p_day_window),

    updated_at = NOW()
  RETURNING
    rate_limits.minute_count,
    rate_limits.hour_count,
    rate_limits.day_count;
END;
$$;

COMMENT ON FUNCTION check_and_increment_rate_limit IS
  'Atomically increments rate limit counters with automatic window reset. '
  'Returns the post-increment counts for limit checking in the caller.';
