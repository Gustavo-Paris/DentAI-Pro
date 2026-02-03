-- Credit-based pricing system for DentAI Pro
-- Hybrid model: Plans have monthly credits that can be used for any operation

-- ===========================================
-- ADD CREDIT COLUMNS TO PLANS
-- ===========================================

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS credits_per_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS allows_rollover BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS rollover_max INTEGER; -- Max credits that can roll over (null = no limit)

-- ===========================================
-- ADD CREDIT TRACKING TO SUBSCRIPTIONS
-- ===========================================

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_rollover INTEGER NOT NULL DEFAULT 0;

-- ===========================================
-- CREDIT COSTS PER OPERATION
-- ===========================================

-- Create table for operation costs (allows flexibility)
CREATE TABLE IF NOT EXISTS public.credit_costs (
  operation TEXT PRIMARY KEY,
  credits INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;

-- Anyone can view costs (needed for UI)
CREATE POLICY "Anyone can view credit costs"
  ON public.credit_costs
  FOR SELECT
  USING (true);

-- Insert default costs
INSERT INTO public.credit_costs (operation, credits, description)
VALUES
  ('case_analysis', 1, 'Análise de caso com IA'),
  ('dsd_simulation', 2, 'Simulação DSD com geração de imagem')
ON CONFLICT (operation) DO UPDATE SET
  credits = EXCLUDED.credits,
  description = EXCLUDED.description;

-- ===========================================
-- UPDATE DEFAULT PLANS
-- ===========================================

-- First, deactivate old plans
UPDATE public.subscription_plans
SET is_active = false
WHERE id IN ('free', 'price_pro_monthly', 'price_clinic_monthly');

-- Insert new credit-based plans
INSERT INTO public.subscription_plans (
  id, name, description, price_monthly, price_yearly, currency,
  cases_per_month, dsd_simulations_per_month, credits_per_month,
  max_users, allows_rollover, rollover_max,
  priority_support, features, sort_order, is_active
)
VALUES
  -- Starter (Free)
  ('starter', 'Starter', 'Experimente gratuitamente', 0, NULL, 'brl',
   3, 2, 5, -- 3 cases + 2 DSD = 5 credits worth
   1, false, NULL,
   false,
   '["3 análises de caso", "2 simulações DSD", "Recomendações de resina", "Suporte por email"]'::jsonb,
   0, true),

  -- Essencial
  ('price_essencial_monthly', 'Essencial', 'Para dentistas que buscam produtividade', 5900, 59900, 'brl',
   20, 10, 20, -- ~20 analyses OR 10 DSD OR mix
   1, false, NULL,
   false,
   '["20 créditos/mês", "~20 análises OU ~10 simulações", "Protocolos de estratificação", "Protocolos de cimentação", "Exportação PDF", "Suporte por email"]'::jsonb,
   1, true),

  -- Pro
  ('price_pro_monthly_v2', 'Pro', 'Para dentistas de alta performance', 11900, 119900, 'brl',
   60, 30, 60,
   1, true, 30, -- Can rollover up to 30 credits
   true,
   '["60 créditos/mês", "~60 análises OU ~30 simulações", "Rollover de até 30 créditos", "Todos os recursos Essencial", "Suporte prioritário", "Acesso antecipado a novidades"]'::jsonb,
   2, true),

  -- Elite
  ('price_elite_monthly', 'Elite', 'Para clínicas e alta demanda', 24900, 249900, 'brl',
   200, 100, 200,
   3, true, 100, -- Can rollover up to 100 credits
   true,
   '["200 créditos/mês", "~200 análises OU ~100 simulações", "Até 3 usuários", "Rollover de até 100 créditos", "Todos os recursos Pro", "Suporte dedicado", "Onboarding personalizado"]'::jsonb,
   3, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  cases_per_month = EXCLUDED.cases_per_month,
  dsd_simulations_per_month = EXCLUDED.dsd_simulations_per_month,
  credits_per_month = EXCLUDED.credits_per_month,
  max_users = EXCLUDED.max_users,
  allows_rollover = EXCLUDED.allows_rollover,
  rollover_max = EXCLUDED.rollover_max,
  priority_support = EXCLUDED.priority_support,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ===========================================
-- HELPER FUNCTIONS FOR CREDITS
-- ===========================================

-- Function to get credit cost for an operation
CREATE OR REPLACE FUNCTION public.get_credit_cost(p_operation TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
BEGIN
  SELECT credits INTO v_cost
  FROM credit_costs
  WHERE operation = p_operation;

  RETURN COALESCE(v_cost, 1); -- Default to 1 credit if not found
END;
$$;

-- Function to check if user has enough credits
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
    -- Check free tier limit based on evaluations created
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

  -- Calculate available credits (monthly + rollover)
  v_available := v_plan.credits_per_month + v_subscription.credits_rollover - v_subscription.credits_used_this_month;

  RETURN v_available >= v_cost;
END;
$$;

-- Function to use credits
CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_can_use BOOLEAN;
BEGIN
  -- Check if can use
  v_can_use := can_use_credits(p_user_id, p_operation);

  IF NOT v_can_use THEN
    RETURN false;
  END IF;

  -- Get cost
  v_cost := get_credit_cost(p_operation);

  -- Increment usage
  UPDATE subscriptions
  SET
    credits_used_this_month = credits_used_this_month + v_cost,
    -- Also update legacy counters for backwards compatibility
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

  RETURN true;
END;
$$;

-- Function to reset monthly usage with rollover
CREATE OR REPLACE FUNCTION public.reset_monthly_usage_with_rollover()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_sub RECORD;
  v_plan subscription_plans%ROWTYPE;
  v_unused INTEGER;
  v_rollover INTEGER;
BEGIN
  FOR v_sub IN
    SELECT * FROM subscriptions
    WHERE usage_reset_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Get the plan
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE id = v_sub.plan_id;

    -- Calculate unused credits
    v_unused := GREATEST(0, v_plan.credits_per_month - v_sub.credits_used_this_month);

    -- Calculate new rollover (capped at rollover_max if set)
    IF v_plan.allows_rollover THEN
      v_rollover := v_sub.credits_rollover + v_unused;
      IF v_plan.rollover_max IS NOT NULL THEN
        v_rollover := LEAST(v_rollover, v_plan.rollover_max);
      END IF;
    ELSE
      v_rollover := 0;
    END IF;

    -- Update subscription
    UPDATE subscriptions
    SET
      credits_used_this_month = 0,
      credits_rollover = v_rollover,
      cases_used_this_month = 0,
      dsd_used_this_month = 0,
      usage_reset_at = NOW(),
      updated_at = NOW()
    WHERE id = v_sub.id;
  END LOOP;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ===========================================
-- CREDIT USAGE HISTORY (for analytics)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  reference_id UUID, -- ID of the evaluation or DSD simulation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own credit usage"
  ON public.credit_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id
  ON public.credit_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at
  ON public.credit_usage(created_at);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.credit_costs IS 'Cost in credits for each operation type';
COMMENT ON TABLE public.credit_usage IS 'History of credit usage for analytics';
COMMENT ON FUNCTION public.can_use_credits IS 'Check if user has enough credits for an operation';
COMMENT ON FUNCTION public.use_credits IS 'Deduct credits for an operation';
COMMENT ON FUNCTION public.reset_monthly_usage_with_rollover IS 'Reset monthly usage with rollover calculation';
