-- Seed data for local development and CI E2E tests.
-- Applied automatically by `supabase start` after migrations.
--
-- Test user credentials:
--   Email:    e2e@test.local
--   Password: Test123456!

-- 1. Create E2E test user in auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, recovery_token,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e2e000000-0000-0000-0000-000000000001'::uuid,
  'authenticated', 'authenticated', 'e2e@test.local',
  crypt('Test123456!', gen_salt('bf')),
  now(), now(), now(), '', '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"E2E Test Dentist","cro":"CRO-E2E-001"}'
) ON CONFLICT (id) DO NOTHING;

-- Identity row (required for email login)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'e2e000000-0000-0000-0000-000000000001'::uuid,
  'e2e000000-0000-0000-0000-000000000001'::uuid,
  '{"sub":"e2e000000-0000-0000-0000-000000000001","email":"e2e@test.local"}',
  'email',
  'e2e@test.local',
  now(), now(), now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- 2. Create profile
INSERT INTO public.profiles (user_id, full_name, cro, clinic_name, phone)
VALUES (
  'e2e000000-0000-0000-0000-000000000001'::uuid,
  'E2E Test Dentist',
  'CRO-E2E-001',
  'Test Clinic',
  '(11) 99999-0000'
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Create a free subscription so the user has credits
INSERT INTO public.subscriptions (user_id, status, plan_id, credits_used_this_month)
SELECT
  'e2e000000-0000-0000-0000-000000000001'::uuid,
  'active',
  id,
  0
FROM public.subscription_plans
WHERE name = 'free'
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
