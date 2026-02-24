-- Lightweight RPC to distinguish "link expired" from "link not found"
--
-- get_shared_evaluation returns empty rows for both cases.
-- This function returns a status string without exposing any PHI:
--   'valid'     — token exists and is not expired
--   'expired'   — token exists but has expired
--   'not_found' — token does not exist
--
-- No sensitive data is returned — only a status enum.

CREATE OR REPLACE FUNCTION public.check_shared_link_status(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT sl.expires_at INTO v_expires_at
  FROM shared_links sl
  WHERE sl.token = p_token;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_expires_at <= NOW() THEN
    RETURN 'expired';
  END IF;

  RETURN 'valid';
END;
$$;

-- Grant execute to anon (shared link viewers are unauthenticated)
GRANT EXECUTE ON FUNCTION public.check_shared_link_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_shared_link_status(TEXT) TO authenticated;

COMMENT ON FUNCTION public.check_shared_link_status(TEXT) IS
  'Returns shared link status (valid/expired/not_found) without exposing any PHI.';
