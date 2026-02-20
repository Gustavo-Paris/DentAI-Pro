-- Populate yearly Stripe Price IDs for annual billing
UPDATE public.subscription_plans SET stripe_price_id_yearly = 'price_1T2uefIRLR3qK2idOiyj4DPT' WHERE id = 'price_essencial_monthly';
UPDATE public.subscription_plans SET stripe_price_id_yearly = 'price_1T2uehIRLR3qK2id7n5Ye3I9' WHERE id = 'price_pro_monthly_v2';
UPDATE public.subscription_plans SET stripe_price_id_yearly = 'price_1T2uejIRLR3qK2idbSLjDrhU' WHERE id = 'price_elite_monthly';
