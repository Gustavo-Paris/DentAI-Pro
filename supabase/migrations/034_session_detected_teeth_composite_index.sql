-- Composite index for the most common filter on session_detected_teeth:
-- WHERE session_id = ? AND user_id = ?
-- Used by listPendingTeeth in the evaluation detail flow.
CREATE INDEX IF NOT EXISTS idx_session_detected_teeth_session_user
  ON session_detected_teeth (session_id, user_id);
