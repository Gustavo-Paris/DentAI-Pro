import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddTeethFlow } from '../useAddTeethFlow';
import type { UseAddTeethFlowDeps } from '../useAddTeethFlow';
import type { SubmitTeethPayload } from '@/types/evaluation';

// ---- Mocks ----
const mockInsertEvaluation = vi.fn();
const mockUpdateStatus = vi.fn();
const mockGetById = vi.fn();
const mockDeletePendingTeeth = vi.fn();
const mockSyncGroupProtocols = vi.fn();
const mockWarmupEdgeFunctions = vi.fn();
const mockDispatchTreatmentProtocol = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@/data', () => ({
  evaluations: {
    insertEvaluation: (...a: any[]) => mockInsertEvaluation(...a),
    updateStatus: (...a: any[]) => mockUpdateStatus(...a),
    getById: (...a: any[]) => mockGetById(...a),
    deletePendingTeeth: (...a: any[]) => mockDeletePendingTeeth(...a),
  },
  wizard: {
    warmupEdgeFunctions: () => mockWarmupEdgeFunctions(),
    syncGroupProtocols: (...a: any[]) => mockSyncGroupProtocols(...a),
  },
}));

vi.mock('../../wizard/helpers', () => ({
  getFullRegion: (tooth: string) => `region-${tooth}`,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, d?: any) => (typeof d === 'string' ? d : k) }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/lib/protocol-dispatch', () => ({
  dispatchTreatmentProtocol: (...a: any[]) => mockDispatchTreatmentProtocol(...a),
  DEFAULT_CERAMIC_TYPE: 'Dissilicato de lítio',
  evaluationClients: {},
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/evaluation-status', () => ({
  EVALUATION_STATUS: { ANALYZING: 'analyzing', DRAFT: 'draft', COMPLETED: 'completed', ERROR: 'error' },
}));

vi.mock('@/lib/query-keys', () => ({
  evaluationKeys: {
    all: ['evaluations'],
    detail: (id: string) => ['evaluations', id],
    session: (id: string) => ['evaluations', 'session', id],
    lists: () => ['evaluations', 'lists'],
    sessions: () => ['evaluations', 'sessions'],
  },
}));

vi.mock('@/lib/aesthetic-goals', () => ({
  resolveAestheticGoalsForAI: (v: any) => v ?? undefined,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// ---- Helpers ----
function makeDeps(overrides?: Partial<UseAddTeethFlowDeps>): UseAddTeethFlowDeps {
  return {
    sessionId: 'session-1',
    user: { id: 'user-1' } as any,
    evals: [],
    patientDataForModal: {
      id: 'patient-1',
      name: 'Test Patient',
      age: 30,
      vitaShade: 'A2',
      bruxism: false,
      aestheticLevel: 'funcional',
      budget: 'padrão',
      longevityExpectation: 'Média',
      photoPath: '/photo.jpg',
      anamnesis: null,
      aestheticGoals: null,
    } as any,
    handleAddTeethSuccess: vi.fn(),
    ...overrides,
  };
}

function makePayload(overrides?: Partial<SubmitTeethPayload>): SubmitTeethPayload {
  return {
    selectedTeeth: ['11'],
    toothTreatments: { '11': 'resina' },
    pendingTeeth: [
      {
        id: 'pt-1',
        session_id: 'session-1',
        user_id: 'user-1',
        tooth: '11',
        priority: 'alta',
        treatment_indication: 'resina',
        indication_reason: 'cárie',
        cavity_class: 'Classe II',
        restoration_size: 'Grande',
        substrate: 'Esmalte e Dentina',
        substrate_condition: 'Saudável',
        enamel_condition: 'Íntegro',
        depth: 'Rasa',
        tooth_region: 'Anterior Superior',
        tooth_bounds: null,
      },
    ],
    ...overrides,
  };
}

describe('useAddTeethFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-1' });
    mockUpdateStatus.mockResolvedValue(undefined);
    mockDeletePendingTeeth.mockResolvedValue(undefined);
    mockSyncGroupProtocols.mockResolvedValue(undefined);
    mockDispatchTreatmentProtocol.mockResolvedValue(undefined);
  });

  it('returns failedTeeth and handleSubmitTeeth', () => {
    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    expect(result.current.failedTeeth).toEqual([]);
    expect(typeof result.current.handleSubmitTeeth).toBe('function');
  });

  it('early-returns when user is null', async () => {
    const { result } = renderHook(() => useAddTeethFlow(makeDeps({ user: null })));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });
    expect(mockInsertEvaluation).not.toHaveBeenCalled();
  });

  it('early-returns when patientDataForModal is null', async () => {
    const { result } = renderHook(() => useAddTeethFlow(makeDeps({ patientDataForModal: null })));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });
    expect(mockInsertEvaluation).not.toHaveBeenCalled();
  });

  it('processes a single resina tooth successfully', async () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useAddTeethFlow(deps));

    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(mockWarmupEdgeFunctions).toHaveBeenCalled();
    expect(mockInsertEvaluation).toHaveBeenCalledTimes(1);
    expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
    expect(mockUpdateStatus).toHaveBeenCalledWith('eval-1', 'draft');
    expect(mockDeletePendingTeeth).toHaveBeenCalledWith('session-1', ['11']);
    expect(deps.handleAddTeethSuccess).toHaveBeenCalled();
  });

  it('skips tooth when toothData not found in pendingTeeth', async () => {
    const payload = makePayload({
      selectedTeeth: ['99'],
      toothTreatments: { '99': 'resina' },
      pendingTeeth: [], // no matching tooth
    });
    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));

    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).not.toHaveBeenCalled();
  });

  it('skips duplicate gengivoplastia when GENGIVO already exists', async () => {
    const deps = makeDeps({
      evals: [{ id: 'existing', tooth: 'GENGIVO', treatment_type: 'gengivoplastia' }] as any,
    });
    const payload = makePayload({
      selectedTeeth: ['GENGIVO'],
      toothTreatments: { GENGIVO: 'gengivoplastia' },
      pendingTeeth: [{
        id: 'pt-g', session_id: 'session-1', user_id: 'user-1',
        tooth: 'GENGIVO', priority: null, treatment_indication: 'gengivoplastia',
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: null, substrate_condition: null, enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).not.toHaveBeenCalled();
  });

  it('dispatches porcelana with cementationParams', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-p' });
    const payload = makePayload({
      selectedTeeth: ['21'],
      toothTreatments: { '21': 'porcelana' },
      pendingTeeth: [{
        id: 'pt-p', session_id: 'session-1', user_id: 'user-1',
        tooth: '21', priority: null, treatment_indication: 'porcelana',
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: 'Esmalte', substrate_condition: 'Saudável', enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockDispatchTreatmentProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        treatmentType: 'porcelana',
        cementationParams: expect.objectContaining({
          teeth: ['21'],
          ceramicType: 'Dissilicato de lítio',
        }),
      }),
      expect.anything(),
    );
  });

  it('dispatches generic treatment (endodontia) — always dispatches even if not primary', async () => {
    mockInsertEvaluation
      .mockResolvedValueOnce({ id: 'eval-e1' })
      .mockResolvedValueOnce({ id: 'eval-e2' });
    const payload = makePayload({
      selectedTeeth: ['11', '12'],
      toothTreatments: { '11': 'endodontia', '12': 'endodontia' },
      pendingTeeth: [
        { id: 'pt-1', session_id: 'session-1', user_id: 'user-1', tooth: '11', priority: null, treatment_indication: 'endodontia', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
        { id: 'pt-2', session_id: 'session-1', user_id: 'user-1', tooth: '12', priority: null, treatment_indication: 'endodontia', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
      ],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    // Both teeth dispatched (endodontia is generic, not resina/porcelana)
    expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(2);
  });

  it('primary-tooth optimization: only primary resina tooth dispatches', async () => {
    mockInsertEvaluation
      .mockResolvedValueOnce({ id: 'eval-r1' })
      .mockResolvedValueOnce({ id: 'eval-r2' });
    const payload = makePayload({
      selectedTeeth: ['11', '12'],
      toothTreatments: { '11': 'resina', '12': 'resina' },
      pendingTeeth: [
        { id: 'pt-1', session_id: 'session-1', user_id: 'user-1', tooth: '11', priority: null, treatment_indication: 'resina', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
        { id: 'pt-2', session_id: 'session-1', user_id: 'user-1', tooth: '12', priority: null, treatment_indication: 'resina', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
      ],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    // Only primary tooth (11) dispatches
    expect(mockDispatchTreatmentProtocol).toHaveBeenCalledTimes(1);
    expect(mockDispatchTreatmentProtocol).toHaveBeenCalledWith(
      expect.objectContaining({ tooth: '11' }),
      expect.anything(),
    );
  });

  it('handles total failure — all teeth fail', async () => {
    const { toast } = await import('sonner');
    mockInsertEvaluation.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.failedTeeth).toEqual(['11']);
  });

  it('handles partial failure — some teeth succeed, some fail', async () => {
    const { toast } = await import('sonner');
    mockInsertEvaluation
      .mockResolvedValueOnce({ id: 'eval-ok' })
      .mockRejectedValueOnce(new Error('DB error'));

    const payload = makePayload({
      selectedTeeth: ['11', '12'],
      toothTreatments: { '11': 'endodontia', '12': 'endodontia' },
      pendingTeeth: [
        { id: 'pt-1', session_id: 'session-1', user_id: 'user-1', tooth: '11', priority: null, treatment_indication: 'endodontia', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
        { id: 'pt-2', session_id: 'session-1', user_id: 'user-1', tooth: '12', priority: null, treatment_indication: 'endodontia', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
      ],
    });

    const deps = makeDeps();
    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(toast.warning).toHaveBeenCalled();
    expect(deps.handleAddTeethSuccess).toHaveBeenCalled();
    expect(result.current.failedTeeth).toEqual(['12']);
  });

  it('marks evaluation as error when processing fails', async () => {
    mockInsertEvaluation.mockResolvedValueOnce({ id: 'eval-fail' });
    mockDispatchTreatmentProtocol.mockRejectedValue(new Error('AI timeout'));
    mockGetById.mockResolvedValue({ tooth: '11', status: 'analyzing' });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(mockGetById).toHaveBeenCalledWith('eval-fail');
    expect(mockUpdateStatus).toHaveBeenCalledWith('eval-fail', 'error');
  });

  it('handles error during error marking (inner catch)', async () => {
    mockInsertEvaluation.mockResolvedValueOnce({ id: 'eval-fail' });
    mockDispatchTreatmentProtocol.mockRejectedValue(new Error('AI error'));
    mockGetById.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    // Should not throw — inner catch handles the error
    expect(result.current.failedTeeth).toEqual(['11']);
  });

  it('syncs protocols when succeeded teeth exist and has existing evals', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-new' });
    const deps = makeDeps({
      evals: [{ id: 'eval-existing' }] as any,
    });

    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(mockSyncGroupProtocols).toHaveBeenCalledWith(
      'session-1',
      expect.arrayContaining(['eval-existing', 'eval-new']),
    );
  });

  it('skips sync when only 1 eval total', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-only' });
    const deps = makeDeps({ evals: [] });

    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(mockSyncGroupProtocols).not.toHaveBeenCalled();
  });

  it('handles sync error gracefully', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-new' });
    mockSyncGroupProtocols.mockRejectedValue(new Error('sync failed'));
    const deps = makeDeps({
      evals: [{ id: 'eval-existing' }] as any,
    });

    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    // Should not throw
    expect(deps.handleAddTeethSuccess).toHaveBeenCalled();
  });

  it('handles deletePendingTeeth error gracefully', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-1' });
    mockDeletePendingTeeth.mockRejectedValue(new Error('delete error'));

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    // Should not throw
    expect(mockDeletePendingTeeth).toHaveBeenCalled();
  });

  it('uses treatment_indication fallback when toothTreatments is empty', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-1' });
    const payload = makePayload({
      selectedTeeth: ['11'],
      toothTreatments: {},
      pendingTeeth: [{
        id: 'pt-1', session_id: 'session-1', user_id: 'user-1',
        tooth: '11', priority: null, treatment_indication: 'porcelana',
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: null, substrate_condition: null, enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ treatment_type: 'porcelana' }),
    );
  });

  it('defaults to resina when no treatment specified', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-1' });
    const payload = makePayload({
      selectedTeeth: ['11'],
      toothTreatments: {},
      pendingTeeth: [{
        id: 'pt-1', session_id: 'session-1', user_id: 'user-1',
        tooth: '11', priority: null, treatment_indication: null,
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: null, substrate_condition: null, enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ treatment_type: 'resina' }),
    );
  });

  it('builds treatment success message with multiple treatment types', async () => {
    const { toast } = await import('sonner');
    mockInsertEvaluation
      .mockResolvedValueOnce({ id: 'eval-1' })
      .mockResolvedValueOnce({ id: 'eval-2' });

    const payload = makePayload({
      selectedTeeth: ['11', '21'],
      toothTreatments: { '11': 'resina', '21': 'endodontia' },
      pendingTeeth: [
        { id: 'pt-1', session_id: 'session-1', user_id: 'user-1', tooth: '11', priority: null, treatment_indication: 'resina', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
        { id: 'pt-2', session_id: 'session-1', user_id: 'user-1', tooth: '21', priority: null, treatment_indication: 'endodontia', indication_reason: null, cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, tooth_region: null, tooth_bounds: null },
      ],
    });

    const deps = makeDeps({
      evals: [{ id: 'eval-existing' }] as any,
    });
    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(toast.success).toHaveBeenCalled();
    expect(deps.handleAddTeethSuccess).toHaveBeenCalled();
  });

  it('sets stratification_needed false for gengivoplastia', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-g' });
    const payload = makePayload({
      selectedTeeth: ['GENGIVO'],
      toothTreatments: { GENGIVO: 'gengivoplastia' },
      pendingTeeth: [{
        id: 'pt-g', session_id: 'session-1', user_id: 'user-1',
        tooth: 'GENGIVO', priority: null, treatment_indication: 'gengivoplastia',
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: null, substrate_condition: null, enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const deps = makeDeps({ evals: [] }); // no existing GENGIVO
    const { result } = renderHook(() => useAddTeethFlow(deps));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        treatment_type: 'gengivoplastia',
        stratification_needed: false,
      }),
    );
  });

  it('sets stratification_needed false for recobrimento_radicular', async () => {
    mockInsertEvaluation.mockResolvedValue({ id: 'eval-r' });
    const payload = makePayload({
      selectedTeeth: ['31'],
      toothTreatments: { '31': 'recobrimento_radicular' },
      pendingTeeth: [{
        id: 'pt-r', session_id: 'session-1', user_id: 'user-1',
        tooth: '31', priority: null, treatment_indication: 'recobrimento_radicular',
        indication_reason: null, cavity_class: null, restoration_size: null,
        substrate: null, substrate_condition: null, enamel_condition: null,
        depth: null, tooth_region: null, tooth_bounds: null,
      }],
    });

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(payload);
    });

    expect(mockInsertEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        stratification_needed: false,
      }),
    );
  });

  it('does not delete pending teeth when none succeeded', async () => {
    mockInsertEvaluation.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAddTeethFlow(makeDeps()));
    await act(async () => {
      await result.current.handleSubmitTeeth(makePayload());
    });

    expect(mockDeletePendingTeeth).not.toHaveBeenCalled();
  });
});
