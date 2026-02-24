-- ===========================================
-- Migration 042: Monthly credit reset with rollover (cron-scheduled)
-- ===========================================
-- Replaces the older reset_monthly_usage_with_rollover() which used
-- usage_reset_at interval checks. This version aligns with Stripe
-- billing periods via current_period_end and handles credits_bonus.

CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE subscriptions
  SET
    credits_rollover = GREATEST(0,
      (SELECT sp.credits_per_month FROM subscription_plans sp WHERE sp.id = subscriptions.plan_id)
      + credits_rollover + credits_bonus
      - credits_used_this_month
    ),
    credits_used_this_month = 0,
    cases_used_this_month = 0,
    dsd_used_this_month = 0,
    credits_bonus = 0,
    updated_at = NOW()
  WHERE status IN ('active', 'trialing')
    AND current_period_end < NOW();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.reset_monthly_credits IS 'Reset monthly credit counters with rollover, aligned to Stripe billing period';

-- Schedule via pg_cron if available (1st of every month at midnight UTC)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'reset-monthly-credits',
      '0 0 1 * *',
      'SELECT reset_monthly_credits()'
    );
  END IF;
END $outer$;
