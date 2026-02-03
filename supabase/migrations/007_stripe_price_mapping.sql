-- Add Stripe Price ID mapping to subscription plans
-- Our internal plan IDs are readable names, Stripe has auto-generated IDs

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Update with actual Stripe Price IDs
UPDATE public.subscription_plans SET stripe_price_id = 'price_1SwidtIRLR3qK2idyJbtebKO' WHERE id = 'price_essencial_monthly';
UPDATE public.subscription_plans SET stripe_price_id = 'price_1Swie5IRLR3qK2idMSk1EMff' WHERE id = 'price_pro_monthly_v2';
UPDATE public.subscription_plans SET stripe_price_id = 'price_1SwieHIRLR3qK2idXPCVpJC5' WHERE id = 'price_elite_monthly';

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price
  ON public.subscription_plans(stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;
