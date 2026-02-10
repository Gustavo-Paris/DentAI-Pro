-- Migration: Add DSD data to shared evaluation view
--
-- Adds a secure RPC that returns DSD analysis and simulation paths
-- for shared links. No PHI is exposed (no patient_name, patient_age, etc.)
-- Only clinical analysis metrics and storage paths.

CREATE OR REPLACE FUNCTION public.get_shared_dsd(p_token TEXT)
RETURNS TABLE (
  dsd_analysis JSONB,
  dsd_simulation_url TEXT,
  dsd_simulation_layers JSONB,
  photo_frontal TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.dsd_analysis,
    e.dsd_simulation_url::TEXT,
    e.dsd_simulation_layers,
    e.photo_frontal::TEXT
  FROM shared_links sl
  JOIN evaluations e ON e.session_id = sl.session_id
  WHERE sl.token = p_token
    AND sl.expires_at > NOW()
    AND e.dsd_analysis IS NOT NULL
  LIMIT 1;
END;
$$;

-- Grant execute to anon (shared link viewers are unauthenticated)
GRANT EXECUTE ON FUNCTION public.get_shared_dsd(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_dsd(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_shared_dsd(TEXT) IS
  'Returns DSD analysis and simulation data for a shared token. No PHI exposed.';
