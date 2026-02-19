-- Add yearly Stripe Price ID column to support annual billing cycle
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_yearly
  ON public.subscription_plans(stripe_price_id_yearly)
  WHERE stripe_price_id_yearly IS NOT NULL;
