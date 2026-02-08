-- ===========================================
-- Migration 014: Fix race condition in credit system
-- ===========================================
-- Problem: use_credits() calls can_use_credits() then UPDATE separately.
-- Concurrent requests can both pass the check before either updates.
-- Fix: Atomic check-and-consume with row locking (SELECT FOR UPDATE).

-- Also adds refund_credits() for refunding on AI errors (P0 item).
-- Also fixes: dsd_simulations table doesn't exist — use credit_usage instead.

-- ===========================================
-- 0. Fix can_use_credits() — replace dsd_simulations with credit_usage
-- ===========================================
CREATE OR REPLACE FUNCTION public.can_use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_cost INTEGER;
  v_available INTEGER;
BEGIN
  v_cost := get_credit_cost(p_operation);

  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  IF v_subscription IS NULL THEN
    IF p_operation = 'case_analysis' THEN
      RETURN (
        SELECT COUNT(*) < 3
        FROM evaluations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    ELSIF p_operation = 'dsd_simulation' THEN
      RETURN (
        SELECT COUNT(*) < 2
        FROM credit_usage
        WHERE user_id = p_user_id
          AND operation = 'dsd_simulation'
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  IF v_subscription.status NOT IN ('active', 'trialing') THEN
    IF p_operation = 'case_analysis' THEN
      RETURN (
        SELECT COUNT(*) < 3
        FROM evaluations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    ELSIF p_operation = 'dsd_simulation' THEN
      RETURN (
        SELECT COUNT(*) < 2
        FROM credit_usage
        WHERE user_id = p_user_id
          AND operation = 'dsd_simulation'
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  v_available := v_plan.credits_per_month
               + v_subscription.credits_rollover
               + v_subscription.credits_bonus
               - v_subscription.credits_used_this_month;

  RETURN v_available >= v_cost;
END;
$$;

-- ===========================================
-- 1. Atomic use_credits() with row locking
-- ===========================================
CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_available INTEGER;
BEGIN
  -- Get cost for operation
  v_cost := get_credit_cost(p_operation);

  -- Lock the subscription row atomically — prevents concurrent consumption
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No subscription: check free tier limits (no credits to lock)
  IF v_subscription IS NULL THEN
    IF p_operation = 'case_analysis' THEN
      RETURN (
        SELECT COUNT(*) < 3
        FROM evaluations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    ELSIF p_operation = 'dsd_simulation' THEN
      RETURN (
        SELECT COUNT(*) < 2
        FROM credit_usage
        WHERE user_id = p_user_id
          AND operation = 'dsd_simulation'
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  -- Inactive subscription: check free tier
  IF v_subscription.status NOT IN ('active', 'trialing') THEN
    IF p_operation = 'case_analysis' THEN
      RETURN (
        SELECT COUNT(*) < 3
        FROM evaluations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    ELSIF p_operation = 'dsd_simulation' THEN
      RETURN (
        SELECT COUNT(*) < 2
        FROM credit_usage
        WHERE user_id = p_user_id
          AND operation = 'dsd_simulation'
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Calculate available credits atomically (row is locked)
  v_available := v_plan.credits_per_month
               + v_subscription.credits_rollover
               + v_subscription.credits_bonus
               - v_subscription.credits_used_this_month;

  -- Not enough credits
  IF v_available < v_cost THEN
    RETURN false;
  END IF;

  -- Atomically consume credits (row is still locked)
  UPDATE subscriptions
  SET
    credits_used_this_month = credits_used_this_month + v_cost,
    cases_used_this_month = CASE
      WHEN p_operation = 'case_analysis' THEN cases_used_this_month + 1
      ELSE cases_used_this_month
    END,
    dsd_used_this_month = CASE
      WHEN p_operation = 'dsd_simulation' THEN dsd_used_this_month + 1
      ELSE dsd_used_this_month
    END,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  -- Record usage for analytics
  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription.id, p_operation, v_cost);

  RETURN true;
END;
$$;

-- ===========================================
-- 2. New refund_credits() function for error recovery
-- ===========================================
CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_subscription_id UUID;
BEGIN
  -- Get cost for operation
  v_cost := get_credit_cost(p_operation);

  -- Get subscription
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_subscription_id IS NULL THEN
    RETURN false;
  END IF;

  -- Refund credits (prevent going below 0)
  UPDATE subscriptions
  SET
    credits_used_this_month = GREATEST(0, credits_used_this_month - v_cost),
    cases_used_this_month = CASE
      WHEN p_operation = 'case_analysis' THEN GREATEST(0, cases_used_this_month - 1)
      ELSE cases_used_this_month
    END,
    dsd_used_this_month = CASE
      WHEN p_operation = 'dsd_simulation' THEN GREATEST(0, dsd_used_this_month - 1)
      ELSE dsd_used_this_month
    END,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  -- Record refund in credit_usage (negative credits_used)
  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription_id, p_operation || '_refund', -v_cost);

  RETURN true;
END;
$$;
