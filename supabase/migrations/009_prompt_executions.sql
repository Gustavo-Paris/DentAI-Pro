CREATE TABLE IF NOT EXISTS prompt_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text NOT NULL,
  prompt_version text NOT NULL,
  model text NOT NULL,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  estimated_cost numeric(10,6) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL,
  success boolean NOT NULL,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_prompt_executions_prompt_id ON prompt_executions(prompt_id);
CREATE INDEX idx_prompt_executions_created_at ON prompt_executions(created_at);
