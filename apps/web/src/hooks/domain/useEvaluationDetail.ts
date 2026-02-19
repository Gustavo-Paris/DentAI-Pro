import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluations, wizard } from '@/data';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { QUERY_STALE_TIMES } from '@/lib/constants';

import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';
import type { PendingTooth, TreatmentType, SubmitTeethPayload } from '@/components/AddTeethModal';

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
  handleSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
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

// Helper to determine full region format
const getFullRegion = (tooth: string): string => {
  const toothNum = parseInt(tooth);
  const isUpper = toothNum >= 10 && toothNum <= 28;
  const anteriorTeeth = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
  const isAnterior = anteriorTeeth.includes(tooth);

  if (isAnterior) {
    return isUpper ? 'anterior-superior' : 'anterior-inferior';
  }
  return isUpper ? 'posterior-superior' : 'posterior-inferior';
};

// Generate generic protocol for non-restorative treatments
const getGenericProtocol = (treatmentType: TreatmentType, tooth: string, toothData: PendingTooth) => {
  const protocols: Record<string, { summary: string; checklist: string[]; alerts: string[]; recommendations: string[] }> = {
    implante: {
      summary: `Dente ${tooth} indicado para extração e reabilitação com implante.`,
      checklist: [
        'Solicitar tomografia computadorizada cone beam',
        'Avaliar quantidade e qualidade óssea disponível',
        'Verificar espaço protético adequado',
        'Avaliar condição periodontal dos dentes adjacentes',
        'Planejar tempo de osseointegração',
        'Discutir opções de prótese provisória',
        'Encaminhar para cirurgião implantodontista',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Avaliar contraindicações sistêmicas para cirurgia',
        'Verificar uso de bifosfonatos ou anticoagulantes',
      ],
      recommendations: [
        'Manter higiene oral adequada',
        'Evitar fumar durante o tratamento',
      ],
    },
    coroa: {
      summary: `Dente ${tooth} indicado para restauração com coroa total.`,
      checklist: [
        'Realizar preparo coronário seguindo princípios biomecânicos',
        'Avaliar necessidade de núcleo/pino intrarradicular',
        'Selecionar material da coroa',
        'Moldagem de trabalho',
        'Confecção de provisório adequado',
        'Prova da infraestrutura',
        'Seleção de cor com escala VITA',
        'Cimentação definitiva',
        'Ajuste oclusal',
        'Orientações de higiene',
      ],
      alerts: [
        'Verificar saúde pulpar antes do preparo',
        'Avaliar relação coroa-raiz',
      ],
      recommendations: [
        'Proteger o provisório durante a espera',
        'Evitar alimentos duros e pegajosos',
      ],
    },
    endodontia: {
      summary: `Dente ${tooth} necessita de tratamento endodôntico antes de restauração definitiva.`,
      checklist: [
        'Confirmar diagnóstico pulpar',
        'Solicitar radiografia periapical',
        'Avaliar anatomia radicular',
        'Planejamento do acesso endodôntico',
        'Instrumentação e irrigação dos canais',
        'Medicação intracanal se necessário',
        'Obturação dos canais radiculares',
        'Radiografia de controle pós-obturação',
        'Agendar restauração definitiva',
      ],
      alerts: [
        'Avaliar necessidade de retratamento',
        'Verificar presença de lesão periapical',
      ],
      recommendations: [
        'Evitar mastigar do lado tratado até restauração definitiva',
        'Retornar imediatamente se houver dor intensa ou inchaço',
      ],
    },
    encaminhamento: {
      summary: `Dente ${tooth} requer avaliação especializada.`,
      checklist: [
        'Documentar achados clínicos',
        'Realizar radiografias necessárias',
        'Preparar relatório para o especialista',
        'Identificar especialidade adequada',
        'Orientar paciente sobre próximos passos',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Urgência do encaminhamento depende do diagnóstico',
        'Manter comunicação com especialista',
      ],
      recommendations: [
        'Levar exames e relatório ao especialista',
        'Informar sobre medicamentos em uso',
      ],
    },
  };

  const protocol = protocols[treatmentType] || protocols.encaminhamento;

  return {
    treatment_type: treatmentType,
    tooth: tooth,
    ai_reason: toothData?.indication_reason || null,
    ...protocol,
  };
};

const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
};

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
  const { t } = useTranslation();
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
    staleTime: QUERY_STALE_TIMES.SHORT,
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
  const patientName = evals[0]?.patient_name || t('evaluation.patientNoName', { defaultValue: 'Paciente sem nome' });
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
      aestheticLevel: first.aesthetic_level || 'estético',
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
            toast.success(t('toasts.evaluationDetail.caseCompleted'));
          },
          onError: () => {
            toast.error(t('toasts.evaluationDetail.statusError'));
          },
        },
      );
    },
    [evals, isChecklistComplete, getChecklistProgressFn, updateStatusMutation],
  );

  const handleMarkAllAsCompleted = useCallback(() => {
    const pending = evals.filter((e) => e.status !== 'completed');

    if (pending.length === 0) {
      toast.info(t('toasts.evaluationDetail.allCompleted'));
      return;
    }

    const withIncompleteChecklist = pending.filter((e) => !isChecklistComplete(e)).length;

    bulkCompleteMutation.mutate(pending.map((e) => e.id), {
      onSuccess: () => {
        if (withIncompleteChecklist > 0) {
          toast.success(
            t('toasts.evaluationDetail.completedWithIncomplete', { count: pending.length, incomplete: withIncompleteChecklist }),
          );
        } else {
          toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        }
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, isChecklistComplete, bulkCompleteMutation, queryClient, sessionId]);

  const handleExportPDF = useCallback((id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info(t('toasts.evaluationDetail.openingPrint'));
  }, []);

  const handleShareCase = useCallback(async () => {
    if (!user || !sessionId) return;
    setIsSharing(true);

    try {
      const token = await evaluations.getOrCreateShareLink(sessionId, user.id);
      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      trackEvent('evaluation_shared', { method: 'clipboard_link' });
      toast.success(t('toasts.evaluationDetail.linkCopied'), {
        description: t('toasts.evaluationDetail.linkExpiry'),
      });
    } catch (error) {
      logger.error('Error sharing case:', error);
      toast.error(t('toasts.evaluationDetail.shareError'));
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
      toast.info(t('toasts.evaluationDetail.allSelectedCompleted'));
      return;
    }

    bulkCompleteMutation.mutate(pending, {
      onSuccess: () => {
        toast.success(t('toasts.evaluationDetail.bulkCompleted', { count: pending.length }));
        queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
        setSelectedIds(new Set());
      },
      onError: () => {
        toast.error(t('toasts.evaluationDetail.statusError'));
      },
    });
  }, [evals, bulkCompleteMutation, queryClient, sessionId]);

  // ---- Submit Teeth (AddTeethModal) ----
  const handleSubmitTeeth = useCallback(async (payload: SubmitTeethPayload) => {
    if (!user || !patientDataForModal) return;

    const treatmentCounts: Record<string, number> = {};
    const newEvalIds: string[] = [];

    try {
      for (const toothNumber of payload.selectedTeeth) {
        const toothData = payload.pendingTeeth.find(t => t.tooth === toothNumber);
        if (!toothData) continue;

        const treatmentType = (payload.toothTreatments[toothNumber] || toothData.treatment_indication || 'resina') as TreatmentType;
        treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;

        // Create evaluation record
        const insertData = {
          user_id: user.id,
          session_id: sessionId,
          patient_id: patientDataForModal.id || null,
          patient_name: patientDataForModal.name || null,
          patient_age: patientDataForModal.age,
          tooth: toothNumber,
          region: toothData.tooth_region || getFullRegion(toothNumber),
          cavity_class: toothData.cavity_class || 'Classe I',
          restoration_size: toothData.restoration_size || 'Média',
          substrate: toothData.substrate || 'Esmalte e Dentina',
          tooth_color: patientDataForModal.vitaShade,
          depth: toothData.depth || 'Média',
          substrate_condition: toothData.substrate_condition || 'Saudável',
          enamel_condition: toothData.enamel_condition || 'Íntegro',
          bruxism: patientDataForModal.bruxism,
          aesthetic_level: patientDataForModal.aestheticLevel,
          budget: patientDataForModal.budget,
          longevity_expectation: patientDataForModal.longevityExpectation,
          photo_frontal: patientDataForModal.photoPath,
          status: 'analyzing',
          treatment_type: treatmentType,
          desired_tooth_shape: 'natural',
          ai_treatment_indication: toothData.treatment_indication,
          ai_indication_reason: toothData.indication_reason,
          tooth_bounds: toothData.tooth_bounds,
          stratification_needed: treatmentType !== 'gengivoplastia',
        };

        const evaluation = await evaluations.insertEvaluation(insertData);
        newEvalIds.push(evaluation.id);

        // Call appropriate edge function based on treatment type
        switch (treatmentType) {
          case 'porcelana':
            await evaluations.invokeEdgeFunction('recommend-cementation', {
              evaluationId: evaluation.id,
              teeth: [toothNumber],
              shade: patientDataForModal.vitaShade,
              ceramicType: 'Dissilicato de lítio',
              substrate: toothData.substrate || 'Esmalte e Dentina',
              substrateCondition: toothData.substrate_condition || 'Saudável',
              aestheticGoals: patientDataForModal.aestheticGoals || undefined,
            });
            break;

          case 'resina':
            await evaluations.invokeEdgeFunction('recommend-resin', {
              evaluationId: evaluation.id,
              userId: user.id,
              patientAge: String(patientDataForModal.age),
              tooth: toothNumber,
              region: getFullRegion(toothNumber),
              cavityClass: toothData.cavity_class || 'Classe I',
              restorationSize: toothData.restoration_size || 'Média',
              substrate: toothData.substrate || 'Esmalte e Dentina',
              bruxism: patientDataForModal.bruxism,
              aestheticLevel: patientDataForModal.aestheticLevel,
              toothColor: patientDataForModal.vitaShade,
              stratificationNeeded: true,
              budget: patientDataForModal.budget,
              longevityExpectation: patientDataForModal.longevityExpectation,
            });
            break;

          case 'implante':
          case 'coroa':
          case 'endodontia':
          case 'encaminhamento': {
            const genericProtocol = getGenericProtocol(treatmentType, toothNumber, toothData);
            await evaluations.updateEvaluation(evaluation.id, {
              generic_protocol: genericProtocol,
              recommendation_text: genericProtocol.summary,
            });
            break;
          }
        }

        // Update status to draft
        await evaluations.updateStatus(evaluation.id, 'draft');
      }

      // Re-sync protocols across ALL evaluations in this session (P1-34)
      // Combines existing + newly added IDs so late additions get same protocol.
      try {
        const existingEvalIds = (evals || []).map(e => e.id);
        const allEvalIds = [...new Set([...existingEvalIds, ...newEvalIds])];
        if (allEvalIds.length >= 2) {
          await wizard.syncGroupProtocols(sessionId, allEvalIds);
        }
      } catch (syncError) {
        logger.warn('Post-add protocol sync failed (non-critical):', syncError);
      }

      // Build success message
      const treatmentMessages = Object.entries(treatmentCounts)
        .map(([type, count]) => `${count} ${TREATMENT_LABEL_KEYS[type as TreatmentType] ? t(TREATMENT_LABEL_KEYS[type as TreatmentType]) : type}`)
        .join(', ');

      toast.success(t('components.addTeeth.casesAdded', { details: treatmentMessages }));
      handleAddTeethSuccess();
    } catch (error) {
      logger.error('Error in handleSubmitTeeth:', error);
      // Only mark evaluations still in 'analyzing' status as error
      // Evaluations already set to 'draft' completed successfully and should not be rolled back
      for (const evalId of newEvalIds) {
        try {
          const evalData = await evaluations.getById(evalId);
          if (evalData?.status === 'analyzing') {
            await evaluations.updateStatus(evalId, 'error');
          }
        } catch (statusError) {
          logger.error(`Failed to mark evaluation ${evalId} as error:`, statusError);
        }
      }
      toast.error(t('toasts.evaluationDetail.addTeethError', 'Erro ao adicionar dentes. Tente novamente.'));
    } finally {
      // Always clean up pending teeth that were processed
      try {
        await evaluations.deletePendingTeeth(sessionId, payload.selectedTeeth);
      } catch (deleteError) {
        logger.error('Error deleting pending teeth:', deleteError);
      }
    }
  }, [user, sessionId, patientDataForModal, evals, handleAddTeethSuccess, t]);

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
    handleSubmitTeeth,
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
