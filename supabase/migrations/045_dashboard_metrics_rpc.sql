-- ===========================================
-- Migration 045: Dashboard Metrics RPC
-- ===========================================
-- Replaces client-side session grouping (5000 row fetch + JS aggregation)
-- with a single server-side query returning 1 JSON row.
-- Queries evaluations_raw directly to avoid phi_decrypt() overhead from the view.

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce tenant isolation: caller can only query their own metrics.
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH session_stats AS (
      SELECT
        session_id,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM evaluations_raw
      WHERE user_id = p_user_id
      GROUP BY session_id
    ),
    weekly AS (
      SELECT COUNT(DISTINCT session_id) AS cnt
      FROM evaluations_raw
      WHERE user_id = p_user_id
        AND created_at >= date_trunc('week', now())
    ),
    pending_teeth AS (
      SELECT COUNT(*) AS cnt
      FROM evaluations_raw
      WHERE user_id = p_user_id
        AND status != 'completed'
    ),
    total_patients AS (
      SELECT COUNT(*) AS cnt
      FROM patients
      WHERE user_id = p_user_id
    )
    SELECT json_build_object(
      'total_evaluations', (SELECT COALESCE(SUM(total), 0) FROM session_stats),
      'total_patients', (SELECT cnt FROM total_patients),
      'pending_sessions', (SELECT COUNT(*) FROM session_stats WHERE completed < total),
      'weekly_sessions', (SELECT cnt FROM weekly),
      'completion_rate', (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(COUNT(*) FILTER (WHERE completed = total) * 100.0 / COUNT(*))
        END
        FROM session_stats
      ),
      'pending_teeth', (SELECT cnt FROM pending_teeth)
    )
  );
END;
$$;

-- Revoke default public access, grant only to authenticated users.
REVOKE EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_dashboard_metrics IS
  'Server-side dashboard metrics: pending sessions, weekly sessions, completion rate, pending teeth. Replaces 5000-row client fetch.';
