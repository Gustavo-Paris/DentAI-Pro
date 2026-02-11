-- Confirm the E2E test user's email and set up required data
-- This is a one-time setup for automated testing

-- Confirm email
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  raw_app_meta_data = raw_app_meta_data || '{"email_verified": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
WHERE email = 'e2etest.auria@gmail.com'
  AND email_confirmed_at IS NULL;

-- Create profile if missing (user_id = auth.users.id)
INSERT INTO public.profiles (user_id, full_name, cro)
SELECT id, 'E2E Test User', 'CRO-TEST-00000'
FROM auth.users
WHERE email = 'e2etest.auria@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create subscription on the free plan so the user has credits
INSERT INTO public.subscriptions (user_id, plan_id, status, credits_used_this_month, credits_rollover)
SELECT id, 'free', 'active', 0, 0
FROM auth.users
WHERE email = 'e2etest.auria@gmail.com'
ON CONFLICT ON CONSTRAINT subscriptions_user_unique DO UPDATE
  SET credits_used_this_month = 0, status = 'active';
