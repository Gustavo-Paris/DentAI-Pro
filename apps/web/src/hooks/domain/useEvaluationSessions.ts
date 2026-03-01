import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { evaluations } from '@/data';
import { evaluationKeys } from '@/hooks/domain/useEvaluationDetail';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluationSession {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  treatmentTypes: string[];
  /** Computed: 'completed' when all evals done, 'pending' otherwise */
  status: 'completed' | 'pending';
}

interface RawEvaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  session_id: string | null;
  treatment_type: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupBySession(data: RawEvaluation[]): EvaluationSession[] {
  const sessionMap = new Map<string, RawEvaluation[]>();

  data.forEach((evaluation) => {
    const sessionKey = evaluation.session_id || evaluation.id;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(evaluation);
  });

  return Array.from(sessionMap.entries()).map(([sessionId, evals]) => {
    const completedCount = evals.filter((e) => e.status === EVALUATION_STATUS.COMPLETED).length;
    const evaluationCount = evals.length;
    return {
      session_id: sessionId,
      patient_name: evals[0].patient_name,
      created_at: evals[0].created_at,
      teeth: evals.map((e) => e.tooth),
      evaluationCount,
      completedCount,
      treatmentTypes: [...new Set(evals.map((e) => e.treatment_type).filter(Boolean))] as string[],
      status: completedCount >= evaluationCount ? 'completed' as const : 'pending' as const,
    };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationSessions() {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as {
    newSessionId?: string;
    patientName?: string;
    teethCount?: number;
  } | null;

  // Fetch ALL evaluations (lightweight query — only 8 small columns) and group
  // by session client-side. ListPage handles pagination of the grouped sessions.
  // Previous approach fetched 20 evaluations server-side, which produced only
  // ~5 sessions when each session had ~4 teeth.
  const query = useQuery({
    queryKey: [...evaluationKeys.sessions(), user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { rows } = await evaluations.list({
        userId: user.id,
        page: 0,
        pageSize: 1000,
      });
      return {
        sessions: groupBySession(rows as RawEvaluation[]),
      };
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.SHORT,
    placeholderData: keepPreviousData,
  });

  return {
    sessions: query.data?.sessions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    newSessionId: locationState?.newSessionId ?? null,
    newTeethCount: locationState?.teethCount ?? 0,
  };
}
