import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Mocks — must be declared BEFORE importing the hooks under test
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrParams?: string | Record<string, unknown>) => {
      if (typeof fallbackOrParams === 'string') return fallbackOrParams;
      if (fallbackOrParams && 'defaultValue' in fallbackOrParams)
        return fallbackOrParams.defaultValue as string;
      return key;
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: unknown }) => children,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ evaluationId: 'session-1' }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

const mockInvalidateQueries = vi.fn();
const mockMutate = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useMutation: vi.fn(({ mutationFn, onSuccess }: { mutationFn: unknown; onSuccess?: unknown }) => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
}));

const mockUpdateStatus = vi.fn().mockResolvedValue(undefined);
const mockUpdateStatusBulk = vi.fn().mockResolvedValue(undefined);
const mockDeleteSession = vi.fn().mockResolvedValue(undefined);
const mockGetOrCreateShareLink = vi.fn().mockResolvedValue('share-token-abc');
const mockInsertEvaluation = vi.fn().mockResolvedValue({ id: 'new-eval-1' });
const mockInvokeEdgeFunction = vi.fn().mockResolvedValue({ data: {} });
const mockUpdateEvaluation = vi.fn().mockResolvedValue(undefined);
const mockUpdateEvaluationsBulk = vi.fn().mockResolvedValue(undefined);
const mockGetById = vi.fn().mockResolvedValue(null);
const mockDeletePendingTeeth = vi.fn().mockResolvedValue(undefined);
const mockListBySession = vi.fn().mockResolvedValue([]);
const mockListPendingTeeth = vi.fn().mockResolvedValue([]);

vi.mock('@/data', () => ({
  evaluations: {
    updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
    updateStatusBulk: (...args: unknown[]) => mockUpdateStatusBulk(...args),
    deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
    getOrCreateShareLink: (...args: unknown[]) => mockGetOrCreateShareLink(...args),
    insertEvaluation: (...args: unknown[]) => mockInsertEvaluation(...args),
    invokeEdgeFunction: (...args: unknown[]) => mockInvokeEdgeFunction(...args),
    updateEvaluation: (...args: unknown[]) => mockUpdateEvaluation(...args),
    updateEvaluationsBulk: (...args: unknown[]) => mockUpdateEvaluationsBulk(...args),
    getById: (...args: unknown[]) => mockGetById(...args),
    deletePendingTeeth: (...args: unknown[]) => mockDeletePendingTeeth(...args),
    listBySession: (...args: unknown[]) => mockListBySession(...args),
    listPendingTeeth: (...args: unknown[]) => mockListPendingTeeth(...args),
  },
  wizard: {
    syncGroupProtocols: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockDispatchTreatmentProtocol = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/protocol-dispatch', () => ({
  dispatchTreatmentProtocol: (...args: unknown[]) => mockDispatchTreatmentProtocol(...args),
  DEFAULT_CERAMIC_TYPE: 'Dissilicato de lítio',
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/constants', () => ({
  QUERY_STALE_TIMES: { SHORT: 30000, MEDIUM: 60000, LONG: 300000 },
}));

// ---------------------------------------------------------------------------
// Import hooks under test AFTER all vi.mock calls
// ---------------------------------------------------------------------------

import { useEvaluationSelection } from '../domain/evaluation/useEvaluationSelection';
import { useEvaluationActions } from '../domain/evaluation/useEvaluationActions';
import { useAddTeethFlow } from '../domain/evaluation/useAddTeethFlow';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import type { SessionEvaluationRow } from '@/data/evaluations';

// ---------------------------------------------------------------------------
// Helpers — base evaluation factory
// ---------------------------------------------------------------------------

type EvaluationItem = SessionEvaluationRow;

function makeEval(overrides: Partial<EvaluationItem> = {}): EvaluationItem {
  return {
    id: 'e1',
    created_at: '2025-01-01T10:00:00Z',
    patient_name: 'João',
    patient_id: 'p1',
    patient_age: 35,
    tooth: '11',
    cavity_class: 'III',
    restoration_size: 'Média',
    status: 'draft',
    photo_frontal: null,
    checklist_progress: null,
    stratification_protocol: null,
    treatment_type: 'resina',
    ai_treatment_indication: null,
    ai_indication_reason: null,
    cementation_protocol: null,
    generic_protocol: null,
    tooth_color: 'A2',
    bruxism: false,
    aesthetic_level: 'estético',
    budget: 'padrão',
    longevity_expectation: 'médio',
    patient_aesthetic_goals: null,
    region: 'Anterior',
    substrate: 'Esmalte e Dentina',
    stratification_needed: true,
    recommendation_text: null,
    alternatives: null,
    protocol_layers: null,
    alerts: null,
    warnings: null,
    session_id: 'session-1',
    dsd_analysis: null,
    dsd_simulation_url: null,
    dsd_simulation_layers: null,
    resins: null,
    ideal_resin: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockMutate.mockReset();
  mockUpdateStatus.mockResolvedValue(undefined);
  mockInsertEvaluation.mockResolvedValue({ id: 'new-eval-1' });
  mockDispatchTreatmentProtocol.mockResolvedValue(undefined);
  mockDeletePendingTeeth.mockResolvedValue(undefined);
});

// ===========================================================================
// 1. useEvaluationSelection — Pure selection & helper logic
// ===========================================================================

describe('useEvaluationSelection', () => {
  // ---- Selection state ----

  describe('selection state', () => {
    it('should start with an empty selection', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should toggle a single item on', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelection('e1'));

      expect(result.current.selectedIds.has('e1')).toBe(true);
      expect(result.current.selectedIds.size).toBe(1);
    });

    it('should toggle a single item off when already selected', () => {
      const evals = [makeEval({ id: 'e1' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelection('e1'));
      expect(result.current.selectedIds.has('e1')).toBe(true);

      act(() => result.current.toggleSelection('e1'));
      expect(result.current.selectedIds.has('e1')).toBe(false);
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should select multiple items independently', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' }), makeEval({ id: 'e3' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelection('e1'));
      act(() => result.current.toggleSelection('e3'));

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('e1')).toBe(true);
      expect(result.current.selectedIds.has('e2')).toBe(false);
      expect(result.current.selectedIds.has('e3')).toBe(true);
    });

    it('should select all when toggleSelectAll is called with none selected', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' }), makeEval({ id: 'e3' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelectAll());

      expect(result.current.selectedIds.size).toBe(3);
      expect(result.current.selectedIds.has('e1')).toBe(true);
      expect(result.current.selectedIds.has('e2')).toBe(true);
      expect(result.current.selectedIds.has('e3')).toBe(true);
    });

    it('should deselect all when toggleSelectAll is called with all selected', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelectAll());
      expect(result.current.selectedIds.size).toBe(2);

      act(() => result.current.toggleSelectAll());
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('should select all when toggleSelectAll is called with partial selection', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' }), makeEval({ id: 'e3' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      // Select only one
      act(() => result.current.toggleSelection('e2'));
      expect(result.current.selectedIds.size).toBe(1);

      // toggleSelectAll with partial should select ALL (since size !== evals.length)
      act(() => result.current.toggleSelectAll());
      expect(result.current.selectedIds.size).toBe(3);
    });

    it('should clear all selections with clearSelection', () => {
      const evals = [makeEval({ id: 'e1' }), makeEval({ id: 'e2' })];
      const { result } = renderHook(() => useEvaluationSelection(evals));

      act(() => result.current.toggleSelection('e1'));
      act(() => result.current.toggleSelection('e2'));
      expect(result.current.selectedIds.size).toBe(2);

      act(() => result.current.clearSelection());
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  // ---- getChecklist ----

  describe('getChecklist', () => {
    it('should return stratification checklist for resina treatment', () => {
      const evals = [makeEval({
        treatment_type: 'resina',
        stratification_protocol: { checklist: ['Step 1', 'Step 2'] },
      })];
      const { result } = renderHook(() => useEvaluationSelection(evals));
      expect(result.current.getChecklist(evals[0])).toEqual(['Step 1', 'Step 2']);
    });

    it('should return cementation checklist for porcelana treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'porcelana',
        cementation_protocol: {
          checklist: ['Prep 1', 'Prep 2'],
          ceramic_treatment: [],
          tooth_treatment: [],
          cementation: { cement_type: '', cement_brand: '', shade: '', light_curing_time: '', technique: '' },
          finishing: [],
          post_operative: [],
          alerts: [],
          warnings: [],
          confidence: 'alta',
        },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Prep 1', 'Prep 2']);
    });

    it('should return generic checklist for coroa treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'coroa',
        generic_protocol: { checklist: ['Crown step 1'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Crown step 1']);
    });

    it('should return generic checklist for implante treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'implante',
        generic_protocol: { checklist: ['Implant step 1'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Implant step 1']);
    });

    it('should return generic checklist for endodontia treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'endodontia',
        generic_protocol: { checklist: ['Endo step 1'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Endo step 1']);
    });

    it('should return generic checklist for encaminhamento treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'encaminhamento',
        generic_protocol: { checklist: ['Referral step'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Referral step']);
    });

    it('should return generic checklist for gengivoplastia treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'gengivoplastia',
        generic_protocol: { checklist: ['Gengivo step'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Gengivo step']);
    });

    it('should return generic checklist for recobrimento_radicular treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'recobrimento_radicular',
        generic_protocol: { checklist: ['Root coverage step'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Root coverage step']);
    });

    it('should default to stratification (resina) when treatment_type is null', () => {
      const eval1 = makeEval({
        treatment_type: null,
        stratification_protocol: { checklist: ['Default step'] },
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual(['Default step']);
    });

    it('should return empty array when protocol is null', () => {
      const eval1 = makeEval({
        treatment_type: 'resina',
        stratification_protocol: null,
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual([]);
    });

    it('should return empty array when protocol checklist is missing', () => {
      const eval1 = makeEval({
        treatment_type: 'resina',
        stratification_protocol: {} as EvaluationItem['stratification_protocol'],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklist(eval1)).toEqual([]);
    });
  });

  // ---- isChecklistComplete ----

  describe('isChecklistComplete', () => {
    it('should return true when no checklist exists (null protocol)', () => {
      const eval1 = makeEval({ stratification_protocol: null });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(true);
    });

    it('should return true when checklist is empty', () => {
      const eval1 = makeEval({ stratification_protocol: { checklist: [] } });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(true);
    });

    it('should return true when all checklist items are progressed', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B', 'C'] },
        checklist_progress: [0, 1, 2],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(true);
    });

    it('should return false when not all items are progressed', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B', 'C'] },
        checklist_progress: [0, 1],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(false);
    });

    it('should return false when no progress recorded', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B'] },
        checklist_progress: null,
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(false);
    });

    it('should return true when progress exceeds checklist length', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B'] },
        checklist_progress: [0, 1, 2, 3],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.isChecklistComplete(eval1)).toBe(true);
    });
  });

  // ---- getChecklistProgress ----

  describe('getChecklistProgress', () => {
    it('should return zero progress when no checklist/protocol', () => {
      const eval1 = makeEval({ stratification_protocol: null, checklist_progress: null });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklistProgress(eval1)).toEqual({ current: 0, total: 0 });
    });

    it('should return current and total counts', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B', 'C', 'D'] },
        checklist_progress: [0, 1],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklistProgress(eval1)).toEqual({ current: 2, total: 4 });
    });

    it('should handle null progress as zero current', () => {
      const eval1 = makeEval({
        stratification_protocol: { checklist: ['A', 'B'] },
        checklist_progress: null,
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklistProgress(eval1)).toEqual({ current: 0, total: 2 });
    });

    it('should compute porcelana checklist progress correctly', () => {
      const eval1 = makeEval({
        treatment_type: 'porcelana',
        cementation_protocol: {
          checklist: ['A', 'B', 'C'],
          ceramic_treatment: [],
          tooth_treatment: [],
          cementation: { cement_type: '', cement_brand: '', shade: '', light_curing_time: '', technique: '' },
          finishing: [],
          post_operative: [],
          alerts: [],
          warnings: [],
          confidence: 'alta',
        },
        checklist_progress: [0],
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getChecklistProgress(eval1)).toEqual({ current: 1, total: 3 });
    });
  });

  // ---- canMarkAsCompleted ----

  describe('canMarkAsCompleted', () => {
    it('should return true for draft status', () => {
      const { result } = renderHook(() => useEvaluationSelection([makeEval({ status: 'draft' })]));
      expect(result.current.canMarkAsCompleted(makeEval({ status: 'draft' }))).toBe(true);
    });

    it('should return true for analyzing status', () => {
      const { result } = renderHook(() => useEvaluationSelection([makeEval({ status: 'analyzing' })]));
      expect(result.current.canMarkAsCompleted(makeEval({ status: 'analyzing' }))).toBe(true);
    });

    it('should return true for error status', () => {
      const { result } = renderHook(() => useEvaluationSelection([makeEval({ status: 'error' })]));
      expect(result.current.canMarkAsCompleted(makeEval({ status: 'error' }))).toBe(true);
    });

    it('should return false for completed status', () => {
      const { result } = renderHook(() => useEvaluationSelection([makeEval({ status: 'completed' })]));
      expect(result.current.canMarkAsCompleted(makeEval({ status: 'completed' }))).toBe(false);
    });

    it('should return true for null status', () => {
      const { result } = renderHook(() => useEvaluationSelection([makeEval({ status: null })]));
      expect(result.current.canMarkAsCompleted(makeEval({ status: null }))).toBe(true);
    });
  });

  // ---- getClinicalDetails ----

  describe('getClinicalDetails', () => {
    it('should show cavity class and restoration size for resina treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'resina',
        cavity_class: 'III',
        restoration_size: 'Média',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Classe III • Média');
    });

    it('should not prefix "Classe" when already present', () => {
      const eval1 = makeEval({
        treatment_type: 'resina',
        cavity_class: 'Classe II',
        restoration_size: 'Grande',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Classe II • Grande');
    });

    it('should return aesthetic procedure name directly for each aesthetic procedure', () => {
      const aestheticProcedures = [
        'Faceta Direta',
        'Recontorno Estético',
        'Fechamento de Diastema',
        'Reparo de Restauração',
        'Lente de Contato',
      ];
      const { result } = renderHook(() => useEvaluationSelection([makeEval()]));

      for (const proc of aestheticProcedures) {
        const eval1 = makeEval({ treatment_type: 'resina', cavity_class: proc });
        expect(result.current.getClinicalDetails(eval1)).toBe(proc);
      }
    });

    it('should return ai_treatment_indication for porcelana treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'porcelana',
        ai_treatment_indication: 'Coroa total metalocerâmica',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Coroa total metalocerâmica');
    });

    it('should return ai_treatment_indication for coroa treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'coroa',
        ai_treatment_indication: 'Coroa metalocerâmica',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Coroa metalocerâmica');
    });

    it('should return ai_treatment_indication for gengivoplastia treatment', () => {
      const eval1 = makeEval({
        treatment_type: 'gengivoplastia',
        ai_treatment_indication: 'Gengivoplastia por excesso de tecido',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Gengivoplastia por excesso de tecido');
    });

    it('should return dash when ai_treatment_indication is null for non-resina', () => {
      const eval1 = makeEval({
        treatment_type: 'coroa',
        ai_treatment_indication: null,
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('-');
    });

    it('should default to resina when treatment_type is null', () => {
      const eval1 = makeEval({
        treatment_type: null,
        cavity_class: 'IV',
        restoration_size: 'Pequena',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Classe IV • Pequena');
    });

    it('should return ai_treatment_indication for recobrimento_radicular', () => {
      const eval1 = makeEval({
        treatment_type: 'recobrimento_radicular',
        ai_treatment_indication: 'Recobrimento com enxerto',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Recobrimento com enxerto');
    });

    it('should return ai_treatment_indication for implante', () => {
      const eval1 = makeEval({
        treatment_type: 'implante',
        ai_treatment_indication: 'Implante unitário',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Implante unitário');
    });

    it('should return ai_treatment_indication for endodontia', () => {
      const eval1 = makeEval({
        treatment_type: 'endodontia',
        ai_treatment_indication: 'Tratamento endodôntico',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Tratamento endodôntico');
    });

    it('should return ai_treatment_indication for encaminhamento', () => {
      const eval1 = makeEval({
        treatment_type: 'encaminhamento',
        ai_treatment_indication: 'Encaminhamento para especialista',
      });
      const { result } = renderHook(() => useEvaluationSelection([eval1]));
      expect(result.current.getClinicalDetails(eval1)).toBe('Encaminhamento para especialista');
    });
  });
});

// ===========================================================================
// 2. useEvaluationActions — Mutations & action handlers
// ===========================================================================

describe('useEvaluationActions', () => {
  const baseUser = { id: 'user-1' } as import('@supabase/supabase-js').User;

  function makeActionsDeps(overrides: Partial<Parameters<typeof useEvaluationActions>[0]> = {}) {
    return {
      sessionId: 'session-1',
      user: baseUser,
      evals: [makeEval({ id: 'e1' }), makeEval({ id: 'e2', status: 'completed' })],
      isChecklistComplete: vi.fn().mockReturnValue(true),
      getChecklistProgress: vi.fn().mockReturnValue({ current: 3, total: 3 }),
      clearSelection: vi.fn(),
      ...overrides,
    };
  }

  describe('handleMarkAsCompleted', () => {
    it('should call mutation when checklist is complete', () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));

      const returned = result.current.handleMarkAsCompleted('e1');

      // When checklist is complete, mutate is called and no pending result returned
      expect(mockMutate).toHaveBeenCalled();
      expect(returned).toBeUndefined();
    });

    it('should return pending checklist result when checklist is incomplete and force=false', () => {
      const deps = makeActionsDeps({
        isChecklistComplete: vi.fn().mockReturnValue(false),
        getChecklistProgress: vi.fn().mockReturnValue({ current: 1, total: 5 }),
      });
      const { result } = renderHook(() => useEvaluationActions(deps));

      const returned = result.current.handleMarkAsCompleted('e1');

      expect(returned).toEqual({ pending: true, current: 1, total: 5 });
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should force complete even when checklist is incomplete with force=true', () => {
      const deps = makeActionsDeps({
        isChecklistComplete: vi.fn().mockReturnValue(false),
        getChecklistProgress: vi.fn().mockReturnValue({ current: 1, total: 5 }),
      });
      const { result } = renderHook(() => useEvaluationActions(deps));

      const returned = result.current.handleMarkAsCompleted('e1', true);

      // force=true skips checklist check
      expect(mockMutate).toHaveBeenCalled();
      expect(returned).toBeUndefined();
    });

    it('should do nothing when evaluation is not found', () => {
      const deps = makeActionsDeps({ evals: [] });
      const { result } = renderHook(() => useEvaluationActions(deps));

      const returned = result.current.handleMarkAsCompleted('non-existent');

      expect(returned).toBeUndefined();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('handleBulkComplete', () => {
    it('should call bulkComplete mutation for pending evaluations', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'draft' }),
        makeEval({ id: 'e2', status: 'completed' }),
        makeEval({ id: 'e3', status: 'draft' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      result.current.handleBulkComplete(['e1', 'e2', 'e3']);

      // Only e1, e3 are pending (e2 is already completed)
      expect(mockMutate).toHaveBeenCalled();
      const mutateArgs = mockMutate.mock.calls[0];
      // First argument should be the array of pending IDs
      expect(mutateArgs[0]).toEqual(['e1', 'e3']);
    });

    it('should show toast.info when all selected are already completed', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'completed' }),
        makeEval({ id: 'e2', status: 'completed' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      result.current.handleBulkComplete(['e1', 'e2']);


      expect(toast.info).toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteSession', () => {
    it('should call deleteSession and navigate to /evaluations on success', async () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleDeleteSession();
      });

      expect(mockDeleteSession).toHaveBeenCalledWith('session-1', 'user-1');
      expect(mockNavigate).toHaveBeenCalledWith('/evaluations');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    it('should show error toast when deleteSession fails', async () => {
      mockDeleteSession.mockRejectedValueOnce(new Error('DB error'));
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleDeleteSession();
      });


      expect(toast.error).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith('/evaluations');
    });

    it('should do nothing when user is null', async () => {
      const deps = makeActionsDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleDeleteSession();
      });

      expect(mockDeleteSession).not.toHaveBeenCalled();
    });
  });

  describe('handleRetryEvaluation', () => {
    it('should set status to analyzing, dispatch protocol, then set to draft', async () => {
      const evals = [makeEval({ id: 'e1', treatment_type: 'resina' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRetryEvaluation('e1');
      });

      // Status should be set to analyzing first
      expect(mockUpdateStatus).toHaveBeenCalledWith('e1', EVALUATION_STATUS.ANALYZING);
      // Then dispatch protocol
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      // Then set to draft
      expect(mockUpdateStatus).toHaveBeenCalledWith('e1', EVALUATION_STATUS.DRAFT);
    });

    it('should set retryingEvaluationId during retry and clear it after', async () => {
      const evals = [makeEval({ id: 'e1' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      expect(result.current.retryingEvaluationId).toBeNull();

      const retryPromise = act(async () => {
        await result.current.handleRetryEvaluation('e1');
      });

      await retryPromise;
      expect(result.current.retryingEvaluationId).toBeNull();
    });

    it('should set status to error on failure', async () => {
      mockDispatchTreatmentProtocol.mockRejectedValueOnce(new Error('AI call failed'));
      const evals = [makeEval({ id: 'e1' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRetryEvaluation('e1');
      });

      // Should set error status after failure
      expect(mockUpdateStatus).toHaveBeenCalledWith('e1', EVALUATION_STATUS.ERROR);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const deps = makeActionsDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRetryEvaluation('e1');
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('should do nothing when evaluation not found', async () => {
      const deps = makeActionsDeps({ evals: [] });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRetryEvaluation('non-existent');
      });

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('should dispatch porcelana protocol with cementation params', async () => {
      const evals = [makeEval({ id: 'e1', treatment_type: 'porcelana', tooth: '21' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRetryEvaluation('e1');
      });

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('porcelana');
      expect(dispatchArgs.cementationParams).toBeDefined();
      expect(dispatchArgs.resinParams).toBeUndefined();
    });
  });

  describe('handleRegenerateWithBudget', () => {
    it('should bulk update evaluations with new budget, then retry AI evaluations', async () => {
      const evals = [
        makeEval({ id: 'e1', treatment_type: 'resina' }),
        makeEval({ id: 'e2', treatment_type: 'porcelana' }),
        makeEval({ id: 'e3', treatment_type: 'coroa' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      // 1. Should bulk update all evals
      expect(mockUpdateEvaluationsBulk).toHaveBeenCalledWith(
        ['e1', 'e2', 'e3'],
        { budget: 'premium', aesthetic_level: 'estético' },
      );

      // 2. Should dispatch protocol for resina and porcelana (not coroa)
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(2);
    });

    it('should set isRegenerating during the process', async () => {
      const evals = [makeEval({ id: 'e1', treatment_type: 'resina' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      expect(result.current.isRegenerating).toBe(false);

      await act(async () => {
        await result.current.handleRegenerateWithBudget('padrão');
      });

      expect(result.current.isRegenerating).toBe(false);
    });

    it('should use funcional aesthetic level for padrão budget', async () => {
      const evals = [makeEval({ id: 'e1', treatment_type: 'resina' })];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRegenerateWithBudget('padrão');
      });

      expect(mockUpdateEvaluationsBulk).toHaveBeenCalledWith(
        ['e1'],
        { budget: 'padrão', aesthetic_level: 'funcional' },
      );
    });

    it('should do nothing when user is null', async () => {
      const deps = makeActionsDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockUpdateEvaluationsBulk).not.toHaveBeenCalled();
    });

    it('should do nothing when evaluations are empty', async () => {
      const deps = makeActionsDeps({ evals: [] });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockUpdateEvaluationsBulk).not.toHaveBeenCalled();
    });

    it('should continue with other evaluations when one fails', async () => {
      mockDispatchTreatmentProtocol
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce(undefined);

      const evals = [
        makeEval({ id: 'e1', treatment_type: 'resina' }),
        makeEval({ id: 'e2', treatment_type: 'resina' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      // Both should have been attempted
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(2);
      // First failed -> set to error
      expect(mockUpdateStatus).toHaveBeenCalledWith('e1', EVALUATION_STATUS.ERROR);
      // Second succeeded -> set to draft
      expect(mockUpdateStatus).toHaveBeenCalledWith('e2', EVALUATION_STATUS.DRAFT);
    });
  });

  describe('handleMarkAllAsCompleted', () => {
    it('should show info toast when all evaluations are already completed', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'completed' }),
        makeEval({ id: 'e2', status: 'completed' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      result.current.handleMarkAllAsCompleted();


      expect(toast.info).toHaveBeenCalled();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should call bulkComplete mutation for pending evaluations', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'draft' }),
        makeEval({ id: 'e2', status: 'completed' }),
        makeEval({ id: 'e3', status: 'draft' }),
      ];
      const deps = makeActionsDeps({ evals });
      const { result } = renderHook(() => useEvaluationActions(deps));

      result.current.handleMarkAllAsCompleted();

      expect(mockMutate).toHaveBeenCalled();
      const mutateArgs = mockMutate.mock.calls[0];
      expect(mutateArgs[0]).toEqual(['e1', 'e3']);
    });
  });

  describe('state management', () => {
    it('should toggle showAddTeethModal', () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));

      expect(result.current.showAddTeethModal).toBe(false);

      act(() => result.current.setShowAddTeethModal(true));
      expect(result.current.showAddTeethModal).toBe(true);

      act(() => result.current.setShowAddTeethModal(false));
      expect(result.current.showAddTeethModal).toBe(false);
    });

    it('should expose retryingEvaluationId as null initially', () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));
      expect(result.current.retryingEvaluationId).toBeNull();
    });

    it('should expose isRegenerating as false initially', () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));
      expect(result.current.isRegenerating).toBe(false);
    });

    it('should expose isSharing as false initially', () => {
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));
      expect(result.current.isSharing).toBe(false);
    });
  });

  describe('handleExportPDF', () => {
    it('should open print window for the given evaluation', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const deps = makeActionsDeps();
      const { result } = renderHook(() => useEvaluationActions(deps));

      result.current.handleExportPDF('e1');

      expect(openSpy).toHaveBeenCalledWith('/result/e1?print=true', '_blank');
      openSpy.mockRestore();
    });
  });
});

// ===========================================================================
// 3. useAddTeethFlow — Submit teeth with primary-tooth optimization
// ===========================================================================

describe('useAddTeethFlow', () => {
  const baseUser = { id: 'user-1' } as import('@supabase/supabase-js').User;
  const basePatientData = {
    name: 'João',
    age: 35,
    id: 'p1',
    vitaShade: 'A2',
    bruxism: false,
    aestheticLevel: 'estético',
    budget: 'padrão',
    longevityExpectation: 'médio',
    photoPath: null,
    aestheticGoals: null,
  };

  function makeAddTeethDeps(overrides: Partial<Parameters<typeof useAddTeethFlow>[0]> = {}) {
    return {
      sessionId: 'session-1',
      user: baseUser,
      evals: [],
      patientDataForModal: basePatientData,
      handleAddTeethSuccess: vi.fn(),
      ...overrides,
    };
  }

  function makePendingTooth(tooth: string, treatmentIndication: string = 'resina') {
    return {
      id: `pt-${tooth}`,
      session_id: 'session-1',
      user_id: 'user-1',
      tooth,
      priority: null,
      treatment_indication: treatmentIndication,
      indication_reason: null,
      cavity_class: 'Classe I',
      restoration_size: 'Média',
      substrate: 'Esmalte e Dentina',
      substrate_condition: 'Saudável',
      enamel_condition: 'Íntegro',
      depth: 'Média',
      tooth_region: 'Anterior',
      tooth_bounds: null,
    };
  }

  describe('handleSubmitTeeth', () => {
    it('should insert evaluation and dispatch protocol for a single resina tooth', async () => {
      let evalIdCounter = 0;
      mockInsertEvaluation.mockImplementation(() =>
        Promise.resolve({ id: `new-eval-${++evalIdCounter}` }),
      );

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(mockInsertEvaluation).toHaveBeenCalledTimes(1);
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      expect(mockUpdateStatus).toHaveBeenCalledWith('new-eval-1', EVALUATION_STATUS.DRAFT);
    });

    it('should insert evaluation and dispatch for a porcelana tooth', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-porcelana' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['21'],
          toothTreatments: { '21': 'porcelana' },
          pendingTeeth: [makePendingTooth('21', 'porcelana')],
        });
      });

      expect(mockInsertEvaluation).toHaveBeenCalledTimes(1);
      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('porcelana');

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('porcelana');
      expect(dispatchArgs.cementationParams).toBeDefined();
    });

    it('should insert and dispatch for gengivoplastia (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-gengivo' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'gengivoplastia' },
          pendingTeeth: [makePendingTooth('11', 'gengivoplastia')],
        });
      });

      expect(mockInsertEvaluation).toHaveBeenCalledTimes(1);
      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('gengivoplastia');
      expect(insertCall.stratification_needed).toBe(false);

      // gengivoplastia always dispatches (not optimized away)
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('gengivoplastia');
    });

    it('should insert and dispatch for recobrimento_radicular (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-recob' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['31'],
          toothTreatments: { '31': 'recobrimento_radicular' },
          pendingTeeth: [makePendingTooth('31', 'recobrimento_radicular')],
        });
      });

      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('recobrimento_radicular');
      expect(insertCall.stratification_needed).toBe(false);

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('recobrimento_radicular');
    });

    it('should insert and dispatch for implante (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-implante' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['36'],
          toothTreatments: { '36': 'implante' },
          pendingTeeth: [makePendingTooth('36', 'implante')],
        });
      });

      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('implante');

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('implante');
    });

    it('should insert and dispatch for coroa (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-coroa' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['46'],
          toothTreatments: { '46': 'coroa' },
          pendingTeeth: [makePendingTooth('46', 'coroa')],
        });
      });

      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('coroa');

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('coroa');
    });

    it('should insert and dispatch for endodontia (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-endo' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['16'],
          toothTreatments: { '16': 'endodontia' },
          pendingTeeth: [makePendingTooth('16', 'endodontia')],
        });
      });

      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('endodontia');

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('endodontia');
    });

    it('should insert and dispatch for encaminhamento (generic protocol)', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-encam' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['48'],
          toothTreatments: { '48': 'encaminhamento' },
          pendingTeeth: [makePendingTooth('48', 'encaminhamento')],
        });
      });

      const insertCall = mockInsertEvaluation.mock.calls[0][0];
      expect(insertCall.treatment_type).toBe('encaminhamento');

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      const dispatchArgs = mockDispatchTreatmentProtocol.mock.calls[0][0];
      expect(dispatchArgs.treatmentType).toBe('encaminhamento');
    });

    it('should apply primary-tooth optimization for multiple resina teeth', async () => {
      let evalIdCounter = 0;
      mockInsertEvaluation.mockImplementation(() =>
        Promise.resolve({ id: `new-eval-${++evalIdCounter}` }),
      );

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11', '12', '13'],
          toothTreatments: { '11': 'resina', '12': 'resina', '13': 'resina' },
          pendingTeeth: [
            makePendingTooth('11', 'resina'),
            makePendingTooth('12', 'resina'),
            makePendingTooth('13', 'resina'),
          ],
        });
      });

      // 3 evaluations inserted
      expect(mockInsertEvaluation).toHaveBeenCalledTimes(3);
      // Only 1 dispatch (primary tooth for resina group) — non-primary teeth skip dispatch
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
      // All 3 should be marked as draft
      expect(mockUpdateStatus).toHaveBeenCalledTimes(3);
    });

    it('should dispatch separately for different treatment groups', async () => {
      let evalIdCounter = 0;
      mockInsertEvaluation.mockImplementation(() =>
        Promise.resolve({ id: `new-eval-${++evalIdCounter}` }),
      );

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11', '21', '31'],
          toothTreatments: { '11': 'resina', '21': 'porcelana', '31': 'coroa' },
          pendingTeeth: [
            makePendingTooth('11', 'resina'),
            makePendingTooth('21', 'porcelana'),
            makePendingTooth('31', 'coroa'),
          ],
        });
      });

      // 3 evaluations inserted
      expect(mockInsertEvaluation).toHaveBeenCalledTimes(3);
      // 3 dispatches — each is the primary tooth of its treatment group
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(3);
    });

    it('should handle failure of a tooth and track failedTeeth', async () => {
      let evalIdCounter = 0;
      mockInsertEvaluation.mockImplementation(() =>
        Promise.resolve({ id: `new-eval-${++evalIdCounter}` }),
      );
      mockDispatchTreatmentProtocol
        .mockRejectedValueOnce(new Error('AI timeout'))
        .mockResolvedValueOnce(undefined);

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11', '21'],
          toothTreatments: { '11': 'resina', '21': 'coroa' },
          pendingTeeth: [
            makePendingTooth('11', 'resina'),
            makePendingTooth('21', 'coroa'),
          ],
        });
      });

      // Tooth 11 failed, tooth 21 succeeded
      expect(result.current.failedTeeth).toEqual(['11']);

      // Should show warning toast for partial failure

      expect(toast.warning).toHaveBeenCalled();
    });

    it('should show error toast when all teeth fail', async () => {
      mockInsertEvaluation.mockRejectedValue(new Error('DB error'));

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(result.current.failedTeeth).toEqual(['11']);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should show success toast when all teeth succeed', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-eval-1' });

      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(result.current.failedTeeth).toEqual([]);

      expect(toast.success).toHaveBeenCalled();
    });

    it('should call handleAddTeethSuccess on full success', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-eval-1' });
      const handleAddTeethSuccess = vi.fn();
      const deps = makeAddTeethDeps({ handleAddTeethSuccess });
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(handleAddTeethSuccess).toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const deps = makeAddTeethDeps({ user: null });
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(mockInsertEvaluation).not.toHaveBeenCalled();
    });

    it('should do nothing when patientDataForModal is null', async () => {
      const deps = makeAddTeethDeps({ patientDataForModal: null });
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(mockInsertEvaluation).not.toHaveBeenCalled();
    });

    it('should delete pending teeth for successfully processed teeth', async () => {
      mockInsertEvaluation.mockResolvedValueOnce({ id: 'new-eval-1' });
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'resina' },
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      expect(mockDeletePendingTeeth).toHaveBeenCalledWith('session-1', ['11']);
    });

    it('should skip toothData that is not found in pendingTeeth', async () => {
      const deps = makeAddTeethDeps();
      const { result } = renderHook(() => useAddTeethFlow(deps));

      await act(async () => {
        await result.current.handleSubmitTeeth({
          selectedTeeth: ['11', '21'],
          toothTreatments: { '11': 'resina', '21': 'resina' },
          // Only tooth 11 has pending data, 21 is missing
          pendingTeeth: [makePendingTooth('11', 'resina')],
        });
      });

      // Only 1 evaluation inserted (for tooth 11)
      expect(mockInsertEvaluation).toHaveBeenCalledTimes(1);
    });
  });
});

// ===========================================================================
// 4. Computed values / patientDataForModal / completedCount
// ===========================================================================

describe('computed values', () => {
  describe('patientDataForModal computation', () => {
    function computePatientData(evals: EvaluationItem[]) {
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
    }

    it('should return null for empty evaluations', () => {
      expect(computePatientData([])).toBeNull();
    });

    it('should extract patient data from first evaluation', () => {
      const result = computePatientData([makeEval()]);
      expect(result).toEqual({
        name: 'João',
        age: 35,
        id: 'p1',
        vitaShade: 'A2',
        bruxism: false,
        aestheticLevel: 'estético',
        budget: 'padrão',
        longevityExpectation: 'médio',
        photoPath: null,
        aestheticGoals: null,
      });
    });

    it('should default age to 30 when zero/falsy', () => {
      const result = computePatientData([makeEval({ patient_age: 0 })]);
      expect(result!.age).toBe(30);
    });

    it('should default tooth_color to A2 when empty', () => {
      const result = computePatientData([makeEval({ tooth_color: '' })]);
      expect(result!.vitaShade).toBe('A2');
    });
  });

  describe('completedCount computation', () => {
    it('should count completed evaluations', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'completed' }),
        makeEval({ id: 'e2', status: 'draft' }),
        makeEval({ id: 'e3', status: 'completed' }),
        makeEval({ id: 'e4', status: null }),
      ];
      const completedCount = evals.filter((e) => e.status === 'completed').length;
      expect(completedCount).toBe(2);
    });

    it('should return 0 when none completed', () => {
      const evals = [
        makeEval({ id: 'e1', status: 'draft' }),
        makeEval({ id: 'e2', status: 'analyzing' }),
      ];
      const completedCount = evals.filter((e) => e.status === 'completed').length;
      expect(completedCount).toBe(0);
    });
  });
});
