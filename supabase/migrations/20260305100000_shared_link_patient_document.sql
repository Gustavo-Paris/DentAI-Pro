-- Add patient_document to the get_shared_evaluation RPC return type
-- so the shared link page can display patient-facing orientations.
--
-- Must DROP first because PostgreSQL cannot change return type with CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_shared_evaluation(TEXT);

CREATE FUNCTION public.get_shared_evaluation(p_token TEXT)
RETURNS TABLE (
  tooth TEXT,
  treatment_type TEXT,
  cavity_class TEXT,
  status TEXT,
  ai_treatment_indication TEXT,
  created_at TIMESTAMPTZ,
  clinic_name TEXT,
  patient_document JSONB
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
    p.clinic_name::TEXT,
    e.patient_document
  FROM shared_links sl
  JOIN evaluations e ON e.session_id = sl.session_id
  LEFT JOIN profiles p ON p.id = sl.user_id
  WHERE sl.token = p_token
    AND sl.expires_at > NOW()
  ORDER BY e.tooth ASC;
END;
$$;

-- Re-grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_shared_evaluation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_evaluation(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_shared_evaluation(TEXT) IS
  'Secure shared evaluation lookup. Validates token + expiry, returns only whitelisted fields including patient document. No PHI exposed.';
