-- Fix: Shared Links PHI Exposure (LGPD Security)
--
-- Problem: Two public RLS policies expose ALL evaluations columns and allow
-- full enumeration of shared_links. An attacker can query the REST API
-- directly to extract patient_name, patient_age, photo_frontal, budget,
-- dsd_analysis, and all treatment protocols.
--
-- Solution: Replace vulnerable policies with a SECURITY DEFINER RPC function
-- that validates the token, checks expiration, and returns ONLY safe fields.

-- 1. Create secure RPC function
CREATE OR REPLACE FUNCTION public.get_shared_evaluation(p_token TEXT)
RETURNS TABLE (
  tooth TEXT,
  treatment_type TEXT,
  cavity_class TEXT,
  status TEXT,
  ai_treatment_indication TEXT,
  created_at TIMESTAMPTZ,
  clinic_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.tooth::TEXT,
    e.treatment_type::TEXT,
    e.cavity_class::TEXT,
    e.status::TEXT,
    e.ai_treatment_indication::TEXT,
    e.created_at,
    p.clinic_name::TEXT
  FROM shared_links sl
  JOIN evaluations e ON e.session_id = sl.session_id
  LEFT JOIN profiles p ON p.id = sl.user_id
  WHERE sl.token = p_token
    AND sl.expires_at > NOW()
  ORDER BY e.tooth ASC;
END;
$$;

-- 2. Drop vulnerable public RLS policies
DROP POLICY IF EXISTS "Anyone can view evaluations via shared link" ON public.evaluations;
DROP POLICY IF EXISTS "Anyone can read shared links by token" ON public.shared_links;

-- 3. Grant execute to anon (shared link viewers are unauthenticated)
GRANT EXECUTE ON FUNCTION public.get_shared_evaluation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_evaluation(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_shared_evaluation(TEXT) IS
  'Secure shared evaluation lookup. Validates token + expiry, returns only whitelisted fields. No PHI exposed.';
