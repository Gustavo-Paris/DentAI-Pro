import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { evaluations } from '@/data';
import type { SessionEvaluationRow } from '@/data/evaluations';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import type { PendingTooth } from '@/types/evaluation';

import type { EvaluationItem, PatientDataForModal } from '../useEvaluationDetail';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  sessions: () => [...evaluationKeys.all, 'sessions'] as const,
  session: (id: string) => [...evaluationKeys.sessions(), id] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (id: string) => [...evaluationKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseEvaluationDataReturn {
  sessionId: string;
  user: ReturnType<typeof useAuth>['user'];
  evaluations: EvaluationItem[];
  isLoading: boolean;
  pendingTeeth: PendingTooth[];
  patientName: string;
  evaluationDate: string;
  evaluationDateShort: string;
  completedCount: number;
  patientDataForModal: PatientDataForModal | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationData(): UseEvaluationDataReturn {
  const { evaluationId: sessionId = '' } = useParams<{ evaluationId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ---- Queries ----
  const {
    data: rawEvaluations,
    isLoading: loadingEvaluations,
    isError: evaluationsError,
  } = useQuery({
    queryKey: evaluationKeys.session(sessionId),
    queryFn: () => evaluations.listBySession(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
    retry: 1,
  });

  const evals = useMemo(
    () => rawEvaluations || [],
    [rawEvaluations],
  );

  // Redirect if error or empty data after loading (matches original behavior)
  useEffect(() => {
    if (loadingEvaluations || !sessionId) return;
    if (evaluationsError) {
      toast.error(t('toasts.evaluationDetail.loadError'));
      navigate('/dashboard');
    } else if (rawEvaluations && rawEvaluations.length === 0) {
      toast.error(t('toasts.evaluationDetail.notFound'));
      navigate('/dashboard');
    }
  }, [loadingEvaluations, evaluationsError, rawEvaluations, sessionId, navigate]);

  const {
    data: pendingTeeth = [],
    isLoading: loadingPendingTeeth,
  } = useQuery({
    queryKey: ['pendingTeeth', sessionId],
    queryFn: () => evaluations.listPendingTeeth(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: QUERY_STALE_TIMES.SHORT,
  });

  // ---- Computed ----
  const patientName = evals[0]?.patient_name || t('evaluation.patientNoName', { defaultValue: 'Paciente sem nome' });
  const evaluationDate = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';
  const evaluationDateShort = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), 'dd/MM/yyyy', { locale: ptBR })
    : '';
  const completedCount = evals.filter((e) => e.status === EVALUATION_STATUS.COMPLETED).length;

  const patientDataForModal = useMemo<PatientDataForModal | null>(() => {
    if (evals.length === 0) return null;
    const first = evals[0];
    return {
      name: first.patient_name,
      age: first.patient_age || 30,
      id: first.patient_id,
      vitaShade: first.tooth_color || 'A2',
      bruxism: first.bruxism || false,
      aestheticLevel: first.aesthetic_level || 'estético',
      budget: first.budget || 'padrão',
      longevityExpectation: first.longevity_expectation || 'médio',
      photoPath: first.photo_frontal,
      aestheticGoals: first.patient_aesthetic_goals ?? null,
    };
  }, [evals]);

  const isLoading = loadingEvaluations || loadingPendingTeeth;

  return {
    sessionId,
    user,
    evaluations: evals,
    isLoading,
    pendingTeeth,
    patientName,
    evaluationDate,
    evaluationDateShort,
    completedCount,
    patientDataForModal,
  };
}
