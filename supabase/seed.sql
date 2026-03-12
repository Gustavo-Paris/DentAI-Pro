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

-- 4. Create test patients for richer E2E coverage
INSERT INTO public.patients (id, user_id, name, phone, email, birth_date)
VALUES
  ('e2e00000-0000-0000-0000-patient00001'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'Maria Silva', '(11) 98765-4321', 'maria@example.com', '1985-03-15'),
  ('e2e00000-0000-0000-0000-patient00002'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'João Santos', '(11) 91234-5678', 'joao@example.com', '1990-07-22'),
  ('e2e00000-0000-0000-0000-patient00003'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'Ana Oliveira', NULL, NULL, '1978-11-30')
ON CONFLICT (user_id, name) DO NOTHING;

-- 5. Create completed evaluations so Evaluations list and Result pages have data
INSERT INTO public.evaluations (
  id, user_id, patient_id, patient_name, patient_age, session_id,
  tooth, region, cavity_class, restoration_size, substrate,
  aesthetic_level, tooth_color, longevity_expectation, budget,
  treatment_type, status, recommendation_text,
  stratification_protocol, protocol_layers
) VALUES
  -- Completed resina case for tooth 11
  ('e2e00000-0000-0000-0000-eval00000001'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'e2e00000-0000-0000-0000-patient00001'::uuid,
   'Maria Silva', 39,
   'e2e00000-0000-0000-0000-session00001'::uuid,
   '11', 'anterior', 'IV', 'grande', 'esmalte e dentina',
   'alto', 'A2', 'longa', 'premium',
   'resina', 'completed',
   'Resina composta nanoparticulada indicada para restauração estética anterior.',
   '{"layers":[{"name":"Dentina","shade":"A2D","resin":"Filtek Z350 XT"},{"name":"Esmalte","shade":"A2E","resin":"Filtek Z350 XT"}]}',
   '[{"name":"Dentina","shade":"A2D"},{"name":"Esmalte","shade":"A2E"}]'),
  -- Completed resina case for tooth 21 (same session)
  ('e2e00000-0000-0000-0000-eval00000002'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'e2e00000-0000-0000-0000-patient00001'::uuid,
   'Maria Silva', 39,
   'e2e00000-0000-0000-0000-session00001'::uuid,
   '21', 'anterior', 'IV', 'grande', 'esmalte e dentina',
   'alto', 'A2', 'longa', 'premium',
   'resina', 'completed',
   'Resina composta para restauração classe IV no dente 21.',
   '{"layers":[{"name":"Dentina","shade":"A2D","resin":"Filtek Z350 XT"},{"name":"Esmalte","shade":"A2E","resin":"Filtek Z350 XT"}]}',
   '[{"name":"Dentina","shade":"A2D"},{"name":"Esmalte","shade":"A2E"}]'),
  -- Completed case for a posterior tooth (different session/patient)
  ('e2e00000-0000-0000-0000-eval00000003'::uuid,
   'e2e000000-0000-0000-0000-000000000001'::uuid,
   'e2e00000-0000-0000-0000-patient00002'::uuid,
   'João Santos', 35,
   'e2e00000-0000-0000-0000-session00002'::uuid,
   '36', 'posterior', 'II', 'media', 'dentina',
   'medio', 'A3', 'media', 'padrao',
   'resina', 'completed',
   'Resina bulk fill indicada para restauração posterior classe II.',
   '{"layers":[{"name":"Base","shade":"A3","resin":"Filtek One Bulk Fill"}]}',
   '[{"name":"Base","shade":"A3"}]')
ON CONFLICT (id) DO NOTHING;
