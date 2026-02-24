-- ===========================================
-- Migration 037: Production Readiness — RLS, FKs, Constraints
-- ===========================================
-- P0 blockers for production launch:
--   1. Fix overly-permissive RLS on subscriptions / rate_limits
--   2. Add missing foreign keys for referential integrity
--   3. Fix existing FKs with proper ON DELETE behavior
--   4. Add CHECK constraints on evaluations_raw
--   5. Add updated_at to evaluations_raw
--   6. Add RLS policy on credit_transactions
--   7. Fix free-tier credit race condition with advisory lock

BEGIN;

-- ===========================================
-- 1. FIX RLS: subscriptions — restrict to service_role
-- ===========================================
-- Current policy uses USING(true) which lets ANY authenticated user
-- read/write ALL subscriptions. Replace with service_role check.

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- 2. FIX RLS: rate_limits — restrict to service_role
-- ===========================================
-- Same issue as subscriptions.

DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- 3. ADD FK: patients_raw.user_id → auth.users(id)
-- ===========================================
-- Original CREATE TABLE patients had user_id UUID NOT NULL with no FK.

ALTER TABLE public.patients_raw
  DROP CONSTRAINT IF EXISTS patients_raw_user_id_fkey;

ALTER TABLE public.patients_raw
  ADD CONSTRAINT patients_raw_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 4. ADD FK: evaluation_drafts.user_id → auth.users(id)
-- ===========================================

ALTER TABLE public.evaluation_drafts
  DROP CONSTRAINT IF EXISTS evaluation_drafts_user_id_fkey;

ALTER TABLE public.evaluation_drafts
  ADD CONSTRAINT evaluation_drafts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 5. ADD FK: session_detected_teeth.user_id → auth.users(id)
-- ===========================================

ALTER TABLE public.session_detected_teeth
  DROP CONSTRAINT IF EXISTS session_detected_teeth_user_id_fkey;

ALTER TABLE public.session_detected_teeth
  ADD CONSTRAINT session_detected_teeth_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 6. ADD FK: user_inventory.user_id → auth.users(id)
-- ===========================================

ALTER TABLE public.user_inventory
  DROP CONSTRAINT IF EXISTS user_inventory_user_id_fkey;

ALTER TABLE public.user_inventory
  ADD CONSTRAINT user_inventory_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 7. FIX FK: evaluations_raw.patient_id → patients_raw(id)
-- ===========================================
-- The original FK was evaluations.patient_id → patients(id) with no
-- ON DELETE behavior. Both tables were renamed in migration 026.
-- PostgreSQL auto-renames the FK constraint when the table is renamed,
-- so the constraint name could be the original or renamed.
-- Drop both possible names for safety, then recreate with ON DELETE SET NULL.

ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_patient_id_fkey;

ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_raw_patient_id_fkey;

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients_raw(id) ON DELETE SET NULL;

-- ===========================================
-- 8. ADD CASCADE: referral_conversions FKs
-- ===========================================
-- Current FKs on referrer_id and referred_id have no ON DELETE.
-- Drop auto-named constraints and recreate with CASCADE.

ALTER TABLE public.referral_conversions
  DROP CONSTRAINT IF EXISTS referral_conversions_referrer_id_fkey;

ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referrer_id_fkey
  FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referral_conversions
  DROP CONSTRAINT IF EXISTS referral_conversions_referred_id_fkey;

ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referred_id_fkey
  FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 9. ADD CASCADE: credit_pack_purchases.user_id
-- ===========================================

ALTER TABLE public.credit_pack_purchases
  DROP CONSTRAINT IF EXISTS credit_pack_purchases_user_id_fkey;

ALTER TABLE public.credit_pack_purchases
  ADD CONSTRAINT credit_pack_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- 10. ADD UNIQUE: referral_conversions.referred_id
-- ===========================================
-- A user can only be referred once (prevent double-referral abuse).

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_conversions_referred_unique
  ON public.referral_conversions (referred_id);

-- ===========================================
-- 11. ADD CHECK: evaluations_raw.status
-- ===========================================

ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_raw_status_check;

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_status_check
  CHECK (status IN ('draft', 'analyzing', 'completed', 'error'))
  NOT VALID;

-- ===========================================
-- 12. ADD CHECK: evaluations_raw.treatment_type
-- ===========================================

ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_raw_treatment_type_check;

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_treatment_type_check
  CHECK (treatment_type IN ('resina', 'porcelana', 'implante', 'coroa', 'endodontia', 'encaminhamento'))
  NOT VALID;

-- ===========================================
-- 13. ADD updated_at to evaluations_raw + trigger
-- ===========================================
-- evaluations_raw was originally "evaluations" which never had updated_at.
-- Migration 026 did NOT add it.

ALTER TABLE public.evaluations_raw
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill: set updated_at = created_at for existing rows
UPDATE public.evaluations_raw
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.evaluations_raw
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.evaluations_raw
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create trigger (drop first for idempotency)
DROP TRIGGER IF EXISTS update_evaluations_raw_updated_at ON public.evaluations_raw;

CREATE TRIGGER update_evaluations_raw_updated_at
  BEFORE UPDATE ON public.evaluations_raw
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 14. ADD RLS policy: credit_transactions — service_role only
-- ===========================================
-- RLS is enabled (migration 020) but no policies exist,
-- meaning nobody can access the table (not even service_role via RLS bypass).
-- Edge functions use service_role which bypasses RLS, but add an explicit
-- policy for defense-in-depth.

DROP POLICY IF EXISTS "Service role can manage credit transactions" ON public.credit_transactions;

CREATE POLICY "Service role can manage credit transactions"
  ON public.credit_transactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- 15. FIX credit race for free-tier users
-- ===========================================
-- Problem: use_credits() locks the subscription row via SELECT FOR UPDATE,
-- but free-tier users (no subscription OR inactive subscription) have no
-- row to lock. Two concurrent requests can both pass the COUNT(*) < 3 check.
--
-- Fix: Use pg_advisory_xact_lock on the user's UUID to serialize concurrent
-- calls for the same user. The lock auto-releases at transaction end.
-- For subscribed users, we keep the SELECT FOR UPDATE approach as it's
-- more granular and proven.

CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_available INTEGER;
  v_free_tier_ok BOOLEAN;
BEGIN
  -- Get cost for operation
  v_cost := get_credit_cost(p_operation);

  -- Lock the subscription row atomically — prevents concurrent consumption
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- -------------------------------------------------------
  -- FREE-TIER PATH: no subscription or inactive subscription
  -- -------------------------------------------------------
  IF v_subscription IS NULL
     OR v_subscription.status NOT IN ('active', 'trialing')
  THEN
    -- Advisory lock on user UUID to prevent race condition.
    -- hashtext() converts the UUID to a stable int4 for pg_advisory_xact_lock.
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

    IF p_operation = 'case_analysis' THEN
      SELECT COUNT(*) < 3 INTO v_free_tier_ok
      FROM evaluations
      WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days';
    ELSIF p_operation = 'dsd_simulation' THEN
      SELECT COUNT(*) < 2 INTO v_free_tier_ok
      FROM credit_usage
      WHERE user_id = p_user_id
        AND operation = 'dsd_simulation'
        AND created_at > NOW() - INTERVAL '30 days';
    ELSE
      v_free_tier_ok := false;
    END IF;

    RETURN COALESCE(v_free_tier_ok, false);
  END IF;

  -- -------------------------------------------------------
  -- SUBSCRIBED PATH: row is locked via FOR UPDATE
  -- -------------------------------------------------------

  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Calculate available credits atomically (row is locked)
  v_available := v_plan.credits_per_month
               + v_subscription.credits_rollover
               + v_subscription.credits_bonus
               - v_subscription.credits_used_this_month;

  -- Not enough credits
  IF v_available < v_cost THEN
    RETURN false;
  END IF;

  -- Atomically consume credits (row is still locked)
  UPDATE subscriptions
  SET
    credits_used_this_month = credits_used_this_month + v_cost,
    cases_used_this_month = CASE
      WHEN p_operation = 'case_analysis' THEN cases_used_this_month + 1
      ELSE cases_used_this_month
    END,
    dsd_used_this_month = CASE
      WHEN p_operation = 'dsd_simulation' THEN dsd_used_this_month + 1
      ELSE dsd_used_this_month
    END,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  -- Record usage for analytics
  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription.id, p_operation, v_cost);

  RETURN true;
END;
$$;

COMMIT;
