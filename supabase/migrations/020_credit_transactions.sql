-- Credit transaction log for idempotent consume/refund operations.
-- Prevents double-charge on retry and double-refund on crash recovery.

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id text NOT NULL,
  operation text NOT NULL,
  type text NOT NULL CHECK (type IN ('consume', 'refund')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Unique constraint: one consume and one refund per operation_id per user
CREATE UNIQUE INDEX idx_credit_transactions_idempotent
  ON credit_transactions (user_id, operation_id, type);

-- Fast lookup by user
CREATE INDEX idx_credit_transactions_user
  ON credit_transactions (user_id, created_at DESC);

-- RLS: only service role can access (edge functions use service role key)
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: delete records older than 30 days (optional, run via cron)
COMMENT ON TABLE credit_transactions IS 'Idempotency log for credit consume/refund. Safe to prune records older than 30 days.';
