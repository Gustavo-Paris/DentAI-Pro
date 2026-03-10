-- Align Pro plan credits and features with live pricing (R$99, 50 credits)
-- Also update features JSON to match current values

UPDATE public.subscription_plans
SET
  credits_per_month = 50,
  cases_per_month = 50,
  dsd_simulations_per_month = 25,
  features = '["50 créditos/mês", "~50 análises OU ~25 simulações", "Rollover de até 30 créditos", "Todos os recursos Essencial", "Suporte prioritário", "Acesso antecipado a novidades"]'::jsonb
WHERE id = 'price_pro_monthly_v2';

-- Update Essencial features JSON to be consistent
UPDATE public.subscription_plans
SET
  features = '["20 créditos/mês", "~20 análises OU ~10 simulações", "Protocolos de estratificação", "Protocolos de cimentação", "Exportação PDF", "Suporte por email"]'::jsonb
WHERE id = 'price_essencial_monthly';
