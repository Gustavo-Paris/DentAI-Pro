import type { SessionEvaluationRow } from '@/data/evaluations';
import type { PendingTooth, SubmitTeethPayload } from '@/components/AddTeethModal';

import { useEvaluationData } from './evaluation/useEvaluationData';
import { useEvaluationSelection } from './evaluation/useEvaluationSelection';
import { useEvaluationActions } from './evaluation/useEvaluationActions';
import { useAddTeethFlow } from './evaluation/useAddTeethFlow';

// ---------------------------------------------------------------------------
// Re-export query key factory from sub-hook (used by useEvaluationSessions)
// ---------------------------------------------------------------------------

export { evaluationKeys } from './evaluation/useEvaluationData';

// ---------------------------------------------------------------------------
// Types (preserved for backward-compatible imports)
// ---------------------------------------------------------------------------

export type EvaluationItem = SessionEvaluationRow;

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
  failedTeeth: string[];
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
  handleShareWhatsApp: () => void;
  handleDeleteSession: () => Promise<void>;
  setShowAddTeethModal: (show: boolean) => void;
  handleAddTeethSuccess: () => void;
  handleSubmitTeeth: (payload: SubmitTeethPayload) => Promise<void>;
  handleRetryEvaluation: (evaluationId: string) => Promise<void>;
  handleRegenerateWithBudget: (newBudget: 'padrão' | 'premium') => Promise<void>;
  retryingEvaluationId: string | null;
  isRegenerating: boolean;
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
// Orchestrator hook — composes sub-hooks, returns same interface
// ---------------------------------------------------------------------------

export function useEvaluationDetail(): EvaluationDetailState & EvaluationDetailActions {
  // 1. Data layer: queries, computed values, patient data
  const data = useEvaluationData();

  // 2. Selection & helpers: selection state, checklist helpers, clinical details
  const selection = useEvaluationSelection(data.evaluations);

  // 3. Actions: mutations, status changes, sharing, deletion, retry, regeneration
  const actions = useEvaluationActions({
    sessionId: data.sessionId,
    user: data.user,
    evals: data.evaluations,
    isChecklistComplete: selection.isChecklistComplete,
    getChecklistProgress: selection.getChecklistProgress,
    clearSelection: selection.clearSelection,
  });

  // 4. Add-teeth flow: handleSubmitTeeth + failedTeeth state
  const addTeeth = useAddTeethFlow({
    sessionId: data.sessionId,
    user: data.user,
    evals: data.evaluations,
    patientDataForModal: data.patientDataForModal,
    handleAddTeethSuccess: actions.handleAddTeethSuccess,
  });

  return {
    // State — from data layer
    sessionId: data.sessionId,
    evaluations: data.evaluations,
    isLoading: data.isLoading,
    pendingTeeth: data.pendingTeeth,
    patientName: data.patientName,
    evaluationDate: data.evaluationDate,
    evaluationDateShort: data.evaluationDateShort,
    completedCount: data.completedCount,
    patientDataForModal: data.patientDataForModal,

    // State — from actions
    showAddTeethModal: actions.showAddTeethModal,
    isSharing: actions.isSharing,
    retryingEvaluationId: actions.retryingEvaluationId,
    isRegenerating: actions.isRegenerating,

    // State — from selection
    selectedIds: selection.selectedIds,

    // State — from add-teeth flow
    failedTeeth: addTeeth.failedTeeth,

    // Actions
    handleMarkAsCompleted: actions.handleMarkAsCompleted,
    handleMarkAllAsCompleted: actions.handleMarkAllAsCompleted,
    handleBulkComplete: actions.handleBulkComplete,
    handleExportPDF: actions.handleExportPDF,
    handleShareCase: actions.handleShareCase,
    handleShareWhatsApp: actions.handleShareWhatsApp,
    handleDeleteSession: actions.handleDeleteSession,
    setShowAddTeethModal: actions.setShowAddTeethModal,
    handleAddTeethSuccess: actions.handleAddTeethSuccess,
    handleSubmitTeeth: addTeeth.handleSubmitTeeth,
    handleRetryEvaluation: actions.handleRetryEvaluation,
    handleRegenerateWithBudget: actions.handleRegenerateWithBudget,

    // Selection
    toggleSelection: selection.toggleSelection,
    toggleSelectAll: selection.toggleSelectAll,
    clearSelection: selection.clearSelection,

    // Helpers
    getChecklist: selection.getChecklist,
    isChecklistComplete: selection.isChecklistComplete,
    getChecklistProgress: selection.getChecklistProgress,
    canMarkAsCompleted: selection.canMarkAsCompleted,
    getClinicalDetails: selection.getClinicalDetails,
  };
}
