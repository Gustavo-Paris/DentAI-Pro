import { useState, useCallback } from 'react';

import type { EvaluationItem, ChecklistProgress } from '../useEvaluationDetail';
import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';

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
// Return type
// ---------------------------------------------------------------------------

export interface UseEvaluationSelectionReturn {
  selectedIds: Set<string>;
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
// Hook
// ---------------------------------------------------------------------------

export function useEvaluationSelection(
  evals: EvaluationItem[],
): UseEvaluationSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      case 'gengivoplastia':
      case 'recobrimento_radicular':
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
      return evaluation.status !== EVALUATION_STATUS.COMPLETED;
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

  return {
    selectedIds,
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
