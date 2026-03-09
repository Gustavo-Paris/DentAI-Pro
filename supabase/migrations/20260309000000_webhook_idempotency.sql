-- ===========================================
-- WEBHOOK IDEMPOTENCY
-- ===========================================

-- 1. Add stripe_event_id to payment_history for traceability
ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT UNIQUE;

-- 2. Create webhook_events audit table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processing',
  payload JSONB
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert/select webhook_events
CREATE POLICY "Service role full access on webhook_events"
  ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for fast lookups by stripe_event_id
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id
  ON public.webhook_events(stripe_event_id);

COMMENT ON TABLE public.webhook_events IS 'Audit trail for Stripe webhook events — ensures idempotent processing';
