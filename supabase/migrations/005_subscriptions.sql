-- Subscription system for DentAI Pro
-- Integrates with Stripe for payment processing

-- ===========================================
-- SUBSCRIPTION PLANS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- Stripe Price ID
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents (BRL)
  price_yearly INTEGER, -- in cents (BRL), null if no yearly option
  currency TEXT NOT NULL DEFAULT 'brl',

  -- Plan limits
  cases_per_month INTEGER NOT NULL DEFAULT 10,
  dsd_simulations_per_month INTEGER NOT NULL DEFAULT 5,
  priority_support BOOLEAN NOT NULL DEFAULT false,

  -- Features
  features JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- ===========================================
-- USER SUBSCRIPTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,

  -- Plan info
  plan_id TEXT REFERENCES public.subscription_plans(id),

  -- Status (mirrors Stripe status)
  status TEXT NOT NULL DEFAULT 'inactive',
  -- Possible values: 'active', 'inactive', 'past_due', 'canceled', 'trialing', 'unpaid'

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Usage tracking (reset monthly)
  cases_used_this_month INTEGER NOT NULL DEFAULT 0,
  dsd_used_this_month INTEGER NOT NULL DEFAULT 0,
  usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One subscription per user
  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

-- ===========================================
-- PAYMENT HISTORY
-- ===========================================

CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  -- Stripe IDs
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,

  -- Amount
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'brl',

  -- Status
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'

  -- Invoice details
  invoice_url TEXT,
  invoice_pdf TEXT,

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own payments"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id
  ON public.payment_history(user_id);

-- ===========================================
-- DEFAULT PLANS
-- ===========================================

INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, cases_per_month, dsd_simulations_per_month, priority_support, features, sort_order)
VALUES
  ('free', 'Gratuito', 'Ideal para experimentar a plataforma', 0, NULL, 5, 3, false,
   '["5 casos por mês", "3 simulações DSD", "Recomendações de resina", "Suporte por email"]'::jsonb, 0),

  ('price_pro_monthly', 'Profissional', 'Para dentistas que buscam produtividade', 9900, 99900, 50, 30, false,
   '["50 casos por mês", "30 simulações DSD", "Protocolos de estratificação", "Protocolos de cimentação", "Exportação PDF", "Suporte prioritário"]'::jsonb, 1),

  ('price_clinic_monthly', 'Clínica', 'Para clínicas com alta demanda', 24900, 249900, -1, -1, true,
   '["Casos ilimitados", "Simulações ilimitadas", "Todos os recursos Pro", "Múltiplos dentistas", "API access", "Suporte dedicado"]'::jsonb, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  cases_per_month = EXCLUDED.cases_per_month,
  dsd_simulations_per_month = EXCLUDED.dsd_simulations_per_month,
  priority_support = EXCLUDED.priority_support,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to check if user can create a case
CREATE OR REPLACE FUNCTION public.can_create_case(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- No subscription = use free tier
  IF v_subscription IS NULL THEN
    -- Check free tier limit (5 cases per month)
    RETURN (
      SELECT COUNT(*) < 5
      FROM evaluations
      WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days'
    );
  END IF;

  -- Inactive subscription = use free tier
  IF v_subscription.status NOT IN ('active', 'trialing') THEN
    RETURN (
      SELECT COUNT(*) < 5
      FROM evaluations
      WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days'
    );
  END IF;

  -- Get plan limits
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Unlimited (-1) or within limit
  IF v_plan.cases_per_month = -1 THEN
    RETURN true;
  END IF;

  RETURN v_subscription.cases_used_this_month < v_plan.cases_per_month;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_case_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET
    cases_used_this_month = cases_used_this_month + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to reset monthly usage (call via cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET
    cases_used_this_month = 0,
    dsd_used_this_month = 0,
    usage_reset_at = NOW(),
    updated_at = NOW()
  WHERE usage_reset_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ===========================================
-- TRIGGERS
-- ===========================================

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans with pricing and limits';
COMMENT ON TABLE public.subscriptions IS 'User subscription status and usage tracking';
COMMENT ON TABLE public.payment_history IS 'Record of all payments for invoicing';
COMMENT ON FUNCTION public.can_create_case IS 'Check if user has remaining cases in their plan';
