-- Update subscription plans with live Stripe Price IDs
-- Replaces test mode IDs with production live mode IDs

-- Monthly prices
UPDATE public.subscription_plans
SET stripe_price_id = 'price_1T9RLjIt6r0fB4F3rcfwK6jM'
WHERE id = 'price_essencial_monthly';

UPDATE public.subscription_plans
SET stripe_price_id = 'price_1T9RLmIt6r0fB4F3Wlz40ETD'
WHERE id = 'price_pro_monthly_v2';

UPDATE public.subscription_plans
SET stripe_price_id = 'price_1T9966It6r0fB4F3KXjbkbV1'
WHERE id = 'price_elite_monthly';

-- Annual prices
UPDATE public.subscription_plans
SET stripe_price_id_yearly = 'price_1T9RLoIt6r0fB4F3hFm3Htcd'
WHERE id = 'price_essencial_monthly';

UPDATE public.subscription_plans
SET stripe_price_id_yearly = 'price_1T9RLqIt6r0fB4F31Ddy5Yef'
WHERE id = 'price_pro_monthly_v2';

UPDATE public.subscription_plans
SET stripe_price_id_yearly = 'price_1T996AIt6r0fB4F37lCmbBwA'
WHERE id = 'price_elite_monthly';

-- Credit pack prices (10 and 25 unchanged, 50 updated to R$149)
UPDATE public.credit_packs
SET stripe_price_id = 'price_1T996BIt6r0fB4F3Sm4sbqt7'
WHERE id = 'pack_10';

UPDATE public.credit_packs
SET stripe_price_id = 'price_1T996CIt6r0fB4F3oirFukX7'
WHERE id = 'pack_25';

UPDATE public.credit_packs
SET stripe_price_id = 'price_1T9RLuIt6r0fB4F3cZs9t0DY',
    price = 14900
WHERE id = 'pack_50';

-- Update plan prices to match live values
UPDATE public.subscription_plans
SET price_monthly = 5900, price_yearly = 59000
WHERE id = 'price_essencial_monthly';

UPDATE public.subscription_plans
SET price_monthly = 9900, price_yearly = 99000
WHERE id = 'price_pro_monthly_v2';

UPDATE public.subscription_plans
SET price_monthly = 24900, price_yearly = 249000
WHERE id = 'price_elite_monthly';
