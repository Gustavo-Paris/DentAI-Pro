-- Migration 012: Credit bonus column + credit packs for one-time purchases
-- Fixes: upgrade/downgrade duplicate subscriptions + adds credit pack purchases

-- ===========================================
-- 1. credits_bonus column on subscriptions
-- ===========================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS credits_bonus INTEGER NOT NULL DEFAULT 0;

-- ===========================================
-- 2. credit_packs table (catalog)
-- ===========================================

CREATE TABLE public.credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL,              -- centavos BRL
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit packs"
  ON public.credit_packs FOR SELECT USING (true);

-- Seed 3 packs
INSERT INTO public.credit_packs (id, name, credits, price, stripe_price_id, sort_order) VALUES
  ('pack_10', '10 Créditos',  10, 2900, 'price_1SxwRCIRLR3qK2idUNBAfej8', 1),
  ('pack_25', '25 Créditos',  25, 5900, 'price_1SxwRGIRLR3qK2id8DHad3uS', 2),
  ('pack_50', '50 Créditos',  50, 9900, 'price_1SxwRKIRLR3qK2idH6z9UxHq', 3);

-- ===========================================
-- 3. credit_pack_purchases table (audit log)
-- ===========================================

CREATE TABLE public.credit_pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pack_id TEXT NOT NULL REFERENCES credit_packs(id),
  credits INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_pack_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON public.credit_pack_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- ===========================================
-- 4. add_bonus_credits() SQL function
-- ===========================================

CREATE OR REPLACE FUNCTION public.add_bonus_credits(p_user_id UUID, p_credits INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET credits_bonus = credits_bonus + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ===========================================
-- 5. Update can_use_credits() to include credits_bonus
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
  -- Get cost for operation
  v_cost := get_credit_cost(p_operation);

  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- No subscription = use free tier
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
        FROM dsd_simulations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  -- Inactive subscription = use free tier
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
        FROM dsd_simulations
        WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days'
      );
    END IF;
    RETURN false;
  END IF;

  -- Get plan
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Calculate available credits (monthly + rollover + bonus)
  v_available := v_plan.credits_per_month
               + v_subscription.credits_rollover
               + v_subscription.credits_bonus
               - v_subscription.credits_used_this_month;

  RETURN v_available >= v_cost;
END;
$$;

-- ===========================================
-- 6. Update use_credits() to include credits_bonus in pool
-- ===========================================
-- credits_bonus is part of the total pool. credits_used_this_month counts
-- against (plan + rollover + bonus). Bonus does NOT reset monthly.

CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_can_use BOOLEAN;
  v_subscription_id UUID;
BEGIN
  -- Check if can use (already includes bonus in available calc)
  v_can_use := can_use_credits(p_user_id, p_operation);

  IF NOT v_can_use THEN
    RETURN false;
  END IF;

  -- Get cost
  v_cost := get_credit_cost(p_operation);

  -- Get subscription id for the credit_usage record
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Increment usage on subscription
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
  WHERE user_id = p_user_id;

  -- Record in credit_usage for analytics
  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription_id, p_operation, v_cost);

  RETURN true;
END;
$$;
