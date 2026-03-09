-- Credit pack price adjustment: align avulso pricing to incentivize subscriptions
--
-- Principle: credit packs should cost ~30-40% more per credit than equivalent plans.
-- This creates a clear upgrade incentive: commitment = savings.
--
-- Old pricing (per credit): pack_10 R$2.90, pack_25 R$2.36, pack_50 R$1.98
-- Problem: pack_25 was CHEAPER than Essencial plan (R$2.36 vs R$2.95/credit)
--          pack_50 MATCHED Pro plan (R$1.98 vs R$1.98/credit)
--
-- New pricing (per credit): pack_10 R$3.90, pack_25 R$3.16, pack_50 R$2.58
-- All packs now cost more per credit than ALL subscription plans.
--
-- Price scale: Elite R$1.25 < Pro R$1.98 < Essencial R$2.95 < pack_50 R$2.58 < pack_25 R$3.16 < pack_10 R$3.90

-- Update pack_10: R$29 → R$39 (3900 centavos)
UPDATE public.credit_packs
SET price = 3900,
    stripe_price_id = 'price_1T98EUIRLR3qK2idpmEPOpaA'
WHERE id = 'pack_10';

-- Update pack_25: R$59 → R$79 (7900 centavos)
UPDATE public.credit_packs
SET price = 7900,
    stripe_price_id = 'price_1T98EZIRLR3qK2idKpGbkf4v'
WHERE id = 'pack_25';

-- Update pack_50: R$99 → R$129 (12900 centavos)
UPDATE public.credit_packs
SET price = 12900,
    stripe_price_id = 'price_1T98EeIRLR3qK2idmPeWfJaG'
WHERE id = 'pack_50';
