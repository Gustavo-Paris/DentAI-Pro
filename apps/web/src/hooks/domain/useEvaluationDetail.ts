import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations } from '@/data';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';
import type { PendingTooth } from '@/components/AddTeethModal';

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
// Types
// ---------------------------------------------------------------------------

export interface EvaluationItem {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_id: string | null;
  patient_age: number;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  treatment_type: string | null;
  ai_treatment_indication: string | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: { checklist?: string[] } | null;
  tooth_color: string;
  bruxism: boolean;
  aesthetic_level: string;
  budget: string;
  longevity_expectation: string;
  patient_aesthetic_goals?: string | null;
  dsd_analysis?: Record<string, unknown> | null;
  dsd_simulation_url?: string | null;
  dsd_simulation_layers?: Array<{ type: string; simulation_url: string | null; includes_gengivoplasty?: boolean }> | null;
  resins?: {
    name: string;
    manufacturer: string;
  } | null;
}

export interface ChecklistProgress {
  current: number;
  total: number;
}

export interface PatientDataForModal {
  name: string | null;
  age: number;
  id: string | null;
  vitaShade: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  photoPath: string | null;
  aestheticGoals: string | null;
}

export interface EvaluationDetailState {
  sessionId: string;
  evaluations: EvaluationItem[];
  isLoading: boolean;
  pendingTeeth: PendingTooth[];
  showAddTeethModal: boolean;
  isSharing: boolean;
  patientName: string;
  evaluationDate: string;
  evaluationDateShort: string;
  completedCount: number;
  patientDataForModal: PatientDataForModal | null;
  selectedIds: Set<string>;
}

export interface PendingChecklistResult {
  pending: true;
  current: number;
  total: number;
}

export interface EvaluationDetailActions {
  handleMarkAsCompleted: (id: string, force?: boolean) => PendingChecklistResult | void;
  handleMarkAllAsCompleted: () => void;
  handleBulkComplete: (ids: string[]) => void;
  handleExportPDF: (id: string) => void;
  handleShareCase: () => void;
  setShowAddTeethModal: (show: boolean) => void;
  handleAddTeethSuccess: () => void;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  getChecklist: (evaluation: EvaluationItem) => string[];
  isChecklistComplete: (evaluation: EvaluationItem) => boolean;
  getChecklistProgress: (evaluation: EvaluationItem) => ChecklistProgress;
  canMarkAsCompleted: (evaluation: EvaluationItem) => boolean;
  getClinicalDetails: (evaluation: EvaluationItem) => string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AESTHETIC_PROCEDURES = [
  'Faceta Direta',
  'Recontorno Estético',
  'Fechamento de Diastema',
  'Reparo de Restauração',
  'Lente de Contato',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationDetail(): EvaluationDetailState & EvaluationDetailActions {
  const { evaluationId: sessionId = '' } = useParams<{ evaluationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---- Queries ----
  const {
    data: rawEvaluations,
    isLoading: loadingEvaluations,
    isError: evaluationsError,
  } = useQuery({
    queryKey: evaluationKeys.session(sessionId),
    queryFn: () => evaluations.listBySession(sessionId, user!.id),
    enabled: !!user && !!sessionId,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const evals = useMemo(
    () => (rawEvaluations as unknown as EvaluationItem[]) || [],
    [rawEvaluations],
  );

  // Redirect if error or empty data after loading (matches original behavior)
  useEffect(() => {
    if (loadingEvaluations || !sessionId) return;
    if (evaluationsError) {
      toast.error('Erro ao carregar avaliação');
      navigate('/dashboard');
    } else if (rawEvaluations && rawEvaluations.length === 0) {
      toast.error('Avaliação não encontrada');
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
    staleTime: 30 * 1000,
  });

  // ---- Mutations ----
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await evaluations.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
    },
  });

  const bulkCompleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await evaluations.updateStatusBulk(ids, 'completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: evaluationKeys.lists() });
    },
  });

  // ---- Local state ----
  const [showAddTeethModal, setShowAddTeethModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ---- Computed ----
  const patientName = evals[0]?.patient_name || 'Paciente sem nome';
  const evaluationDate = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';
  const evaluationDateShort = evals[0]?.created_at
    ? format(new Date(evals[0].created_at), 'dd/MM/yyyy', { locale: ptBR })
    : '';
  const completedCount = evals.filter((e) => e.status === 'completed').length;

  const patientDataForModal = useMemo<PatientDataForModal | null>(() => {
    if (evals.length === 0) return null;
    const first = evals[0];
    return {
      name: first.patient_name,
      age: first.patient_age || 30,
      id: first.patient_id,
      vitaShade: first.tooth_color || 'A2',
      bruxism: first.bruxism || false,
      aestheticLevel: first.aesthetic_level || 'alto',
      budget: first.budget || 'padrão',
      longevityExpectation: first.longevity_expectation || 'médio',
      photoPath: first.photo_frontal,
      aestheticGoals: first.patient_aesthetic_goals ?? null,
    };
  }, [evals]);

  const isLoading = loadingEvaluations || loadingPendingTeeth;

  // ---- Helpers ----
  const getChecklist = useCallback((evaluation: EvaluationItem): string[] => {
    const treatmentType = evaluation.treatment_type || 'resina';
    switch (treatmentType) {
      case 'porcelana':
        return (evaluation.cementation_protocol as CementationProtocol)?.checklist || [];
      case 'coroa':
      case 'implante':
      case 'endodontia':
      case 'encaminhamento':
        return evaluation.generic_protocol?.checklist || [];
      default:
        return evaluation.stratification_protocol?.checklist || [];
    }
  }, []);

  const isChecklistComplete = useCallback(
    (evaluation: EvaluationItem): boolean => {
      const checklist = getChecklist(evaluation);
      const progress = evaluation.checklist_progress || [];
      if (checklist.length === 0) return true;
      return progress.length >= checklist.length;
    },
    [getChecklist],
  );

  const getChecklistProgressFn = useCallback(
    (evaluation: EvaluationItem): ChecklistProgress => {
      const checklist = getChecklist(evaluation);
      const progress = evaluation.checklist_progress || [];
      return { current: progress.length, total: checklist.length };
    },
    [getChecklist],
  );

  const canMarkAsCompleted = useCallback(
    (evaluation: EvaluationItem): boolean => {
      return evaluation.status !== 'completed';
    },
    [],
  );

  const getClinicalDetails = useCallback((evaluation: EvaluationItem): string => {
    const treatmentType = evaluation.treatment_type || 'resina';
    const showCavityInfo = treatmentType === 'resina';

    if (showCavityInfo) {
      if (AESTHETIC_PROCEDURES.includes(evaluation.cavity_class)) {
        return evaluation.cavity_class;
      }
      const cavityLabel = evaluation.cavity_class.startsWith('Classe ')
        ? evaluation.cavity_class
        : `Classe ${evaluation.cavity_class}`;
      return `${cavityLabel} • ${evaluation.restoration_size}`;
    }

    return evaluation.ai_treatment_indication || '-';
  }, []);

  // ---- Actions ----
  const handleMarkAsCompleted = useCallback(
    (id: string, force?: boolean): PendingChecklistResult | void => {
      const evaluation = evals.find((e) => e.id === id);
      if (!evaluation) return;

      if (!force && !isChecklistComplete(evaluation)) {
        const progress = getChecklistProgressFn(evaluation);
        return { pending: true, current: progress.current, total: progress.total };
      }

      updateStatusMutation.mutate(
        { id, status: 'completed' },
        {
          onSuccess: () => {
            toast.success('Caso marcado como finalizado');
          },
          onError: () => {
            toast.error('Erro ao atualizar status');
          },
        },
      );
    },
    [evals, isChecklistComplete, getChecklistProgressFn, updateStatusMutation],
  );

  const handleMarkAllAsCompleted = useCallback(() => {
    const pending = evals.filter((e) => e.status !== 'completed');

    if (pending.length === 0) {
      toast.info('Todos os casos já estão finalizados');
      return;
    }

    const withIncompleteChecklist = pending.filter((e) => !isChecklistComplete(e)).length;

    bulkCompleteMutation.mutate(pending.map((e) => e.id), {
      onSuccess: () => {
        if (withIncompleteChecklist > 0) {
          toast.success(
            `${pending.length} caso(s) finalizado(s). ${withIncompleteChecklist} tinham checklist incompleto.`,
          );
        } else {
          toast.success(`${pending.length} caso(s) marcado(s) como finalizado(s)`);
        }
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      },
      onError: () => {
        toast.error('Erro ao atualizar status');
      },
    });
  }, [evals, isChecklistComplete, bulkCompleteMutation, queryClient, sessionId]);

  const handleExportPDF = useCallback((id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info('Abrindo página para impressão...');
  }, []);

  const handleShareCase = useCallback(async () => {
    if (!user || !sessionId) return;
    setIsSharing(true);

    try {
      const token = await evaluations.getOrCreateShareLink(sessionId, user.id);
      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!', {
        description: 'O link expira em 7 dias.',
      });
    } catch (error) {
      logger.error('Error sharing case:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    }

    setIsSharing(false);
  }, [user, sessionId]);

  const handleAddTeethSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
    queryClient.invalidateQueries({ queryKey: ['pendingTeeth', sessionId] });
  }, [queryClient, sessionId]);

  // ---- Selection ----
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === evals.length) return new Set();
      return new Set(evals.map((e) => e.id));
    });
  }, [evals]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkComplete = useCallback((ids: string[]) => {
    const pending = ids.filter((id) => {
      const e = evals.find((ev) => ev.id === id);
      return e && e.status !== 'completed';
    });

    if (pending.length === 0) {
      toast.info('Todos os casos selecionados já estão finalizados');
      return;
    }

    bulkCompleteMutation.mutate(pending, {
      onSuccess: () => {
        toast.success(`${pending.length} caso(s) marcado(s) como finalizado(s)`);
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
        setSelectedIds(new Set());
      },
      onError: () => {
        toast.error('Erro ao atualizar status');
      },
    });
  }, [evals, bulkCompleteMutation, queryClient, sessionId]);

  return {
    // State
    sessionId,
    evaluations: evals,
    isLoading,
    pendingTeeth: pendingTeeth as PendingTooth[],
    showAddTeethModal,
    isSharing,
    patientName,
    evaluationDate,
    evaluationDateShort,
    completedCount,
    patientDataForModal,
    selectedIds,

    // Actions
    handleMarkAsCompleted,
    handleMarkAllAsCompleted,
    handleBulkComplete,
    handleExportPDF,
    handleShareCase,
    setShowAddTeethModal,
    handleAddTeethSuccess,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    getChecklist,
    isChecklistComplete,
    getChecklistProgress: getChecklistProgressFn,
    canMarkAsCompleted,
    getClinicalDetails,
  };
}
