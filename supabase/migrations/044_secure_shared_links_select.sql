-- ===========================================
-- Migration 044: Secure shared_links SELECT policy
-- ===========================================
--
-- Problem: The original migration 008 created a permissive SELECT policy
-- on shared_links with USING(true), allowing anonymous enumeration of
-- ALL share tokens. Migration 019 dropped it, but this migration ensures
-- it is definitively gone and replaces it with a restrictive owner-only
-- policy.
--
-- The get_shared_evaluation() and check_shared_link_status() RPCs
-- (SECURITY DEFINER) are the only public read paths and bypass RLS,
-- so this does NOT break shared link functionality for anonymous viewers.

-- 1. Drop the vulnerable "anyone can read" policy (idempotent)
DROP POLICY IF EXISTS "Anyone can read shared links by token" ON public.shared_links;

-- 2. Add restrictive owner-only SELECT policy
--    Authenticated users can only SELECT their own rows.
--    This is additive to the existing FOR ALL policy ("Users can manage own shared links"),
--    but makes the intent explicit and ensures no permissive gap.
CREATE POLICY "Owners can select own shared links"
  ON public.shared_links
  FOR SELECT
  USING (auth.uid() = user_id);
