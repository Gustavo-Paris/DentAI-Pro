-- Shared links for public case viewing
-- Allows dentists to share evaluation results with patients via a temporary link

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own shared links
CREATE POLICY "Users can manage own shared links"
  ON public.shared_links
  FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can read by token (for public access)
CREATE POLICY "Anyone can read shared links by token"
  ON public.shared_links
  FOR SELECT
  USING (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_shared_links_token
  ON public.shared_links(token);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id
  ON public.shared_links(user_id);

COMMENT ON TABLE public.shared_links IS 'Temporary public links for sharing evaluation results with patients';

-- Allow anonymous users to read evaluations that have a valid (non-expired) shared link
CREATE POLICY "Anyone can view evaluations via shared link"
  ON public.evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_links sl
      WHERE sl.session_id = evaluations.session_id
        AND sl.expires_at > NOW()
    )
  );
