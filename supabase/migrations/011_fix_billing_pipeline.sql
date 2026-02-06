-- Fix billing pipeline bugs:
-- BUG 1: payment_history missing UNIQUE constraint on stripe_invoice_id
-- BUG 3: use_credits() does not INSERT into credit_usage

-- ===========================================
-- BUG 1 FIX: UNIQUE constraint on stripe_invoice_id
-- ===========================================

-- Dedup existing rows (keep newest per stripe_invoice_id)
DELETE FROM public.payment_history a
USING public.payment_history b
WHERE a.stripe_invoice_id IS NOT NULL
  AND a.stripe_invoice_id = b.stripe_invoice_id
  AND a.created_at < b.created_at;

-- Add the UNIQUE constraint (the webhook handler already uses onConflict: "stripe_invoice_id")
ALTER TABLE public.payment_history
ADD CONSTRAINT payment_history_stripe_invoice_id_unique UNIQUE (stripe_invoice_id);

-- ===========================================
-- BUG 3 FIX: use_credits() must INSERT into credit_usage
-- ===========================================

CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_can_use BOOLEAN;
  v_subscription_id UUID;
BEGIN
  -- Check if can use
  v_can_use := can_use_credits(p_user_id, p_operation);

  IF NOT v_can_use THEN
    RETURN false;
  END IF;

  -- Get cost
  v_cost := get_credit_cost(p_operation);

  -- Get subscription id for the credit_usage record
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- Increment usage on subscription
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
  WHERE user_id = p_user_id;

  -- Record in credit_usage for analytics
  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription_id, p_operation, v_cost);

  RETURN true;
END;
$$;

-- ===========================================
-- INSERT policy on credit_usage (service role needs it for the SECURITY DEFINER function)
-- ===========================================

-- Allow inserts via the SECURITY DEFINER function (runs as owner, but explicit policy is good practice)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_usage'
      AND policyname = 'Service role can insert credit usage'
  ) THEN
    CREATE POLICY "Service role can insert credit usage"
      ON public.credit_usage
      FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$;
