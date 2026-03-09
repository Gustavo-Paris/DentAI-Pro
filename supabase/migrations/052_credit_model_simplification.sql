-- Credit model simplification: 1 credit per case operation
--
-- Changes:
-- 1. dsd_simulation: 2 → 1 credit (DSD is part of the case workflow, not a premium add-on)
-- 2. Remove resin_recommendation and cementation_recommendation costs
--    (protocols are the deliverable of the case, not separate billable operations)
--
-- New model: case_analysis = 1 credit, dsd_simulation = 1 credit
-- Full case = 2 credits (analysis + DSD simulation)
-- Protocols (resin/cementation) = 0 credits (included)

-- Update DSD simulation cost from 2 to 1
UPDATE public.credit_costs
SET credits = 1,
    description = 'Simulação DSD com geração de imagem (1 crédito por sessão)'
WHERE operation = 'dsd_simulation';

-- Remove protocol costs if they were accidentally inserted
DELETE FROM public.credit_costs
WHERE operation IN ('resin_recommendation', 'cementation_recommendation');
