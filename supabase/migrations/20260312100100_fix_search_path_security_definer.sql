-- Fix SF-S2: SECURITY DEFINER functions in migration 046 are missing SET search_path = public.
-- Without a fixed search_path, a malicious user could create a schema earlier in the search path
-- and hijack table/function references inside these functions.
--
-- Functions: evaluation_drafts_view_insert, evaluation_drafts_view_update,
--            evaluation_drafts_view_delete, cleanup_stale_drafts

ALTER FUNCTION public.evaluation_drafts_view_insert()
  SET search_path = public;

ALTER FUNCTION public.evaluation_drafts_view_update()
  SET search_path = public;

ALTER FUNCTION public.evaluation_drafts_view_delete()
  SET search_path = public;

ALTER FUNCTION public.cleanup_stale_drafts()
  SET search_path = public;
