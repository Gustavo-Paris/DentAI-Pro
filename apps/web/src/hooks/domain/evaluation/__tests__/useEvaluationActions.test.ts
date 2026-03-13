import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEvaluationActions } from '../useEvaluationActions';
import type { UseEvaluationActionsDeps } from '../useEvaluationActions';

// ---- Mocks ----
const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockMutate = vi.fn();
const mockUpdateStatus = vi.fn();
const mockUpdateStatusBulk = vi.fn();
const mockGetOrCreateShareLink = vi.fn();
const mockDeleteSession = vi.fn();
const mockUpdateEvaluationsBulk = vi.fn();
const mockDispatchTreatmentProtocol = vi.fn();
const mockSyncGroupProtocols = vi.fn();
const mockWithRetry = vi.fn();
const mockTrackEvent = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, d?: any) => (typeof d === 'string' ? d : k) }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useMutation: ({ mutationFn, onSuccess, onError }: any) => ({
    mutate: (args: any, callbacks?: any) => {
      mockMutate(args, callbacks);
      // Store for later invocation in tests
      (mockMutate as any)._lastCallbacks = { ...callbacks, onSuccess, onError };
      (mockMutate as any)._lastMutationFn = mutationFn;
      (mockMutate as any)._lastArgs = args;
    },
  }),
}));

vi.mock('@/data', () => ({
  evaluations: {
    updateStatus: (...a: any[]) => mockUpdateStatus(...a),
    updateStatusBulk: (...a: any[]) => mockUpdateStatusBulk(...a),
    getOrCreateShareLink: (...a: any[]) => mockGetOrCreateShareLink(...a),
    deleteSession: (...a: any[]) => mockDeleteSession(...a),
    updateEvaluationsBulk: (...a: any[]) => mockUpdateEvaluationsBulk(...a),
  },
  wizard: {
    syncGroupProtocols: (...a: any[]) => mockSyncGroupProtocols(...a),
  },
}));

vi.mock('@/lib/protocol-dispatch', () => ({
  dispatchTreatmentProtocol: (...a: any[]) => mockDispatchTreatmentProtocol(...a),
  DEFAULT_CERAMIC_TYPE: 'Dissilicato de lítio',
  evaluationClients: {},
}));

vi.mock('@/lib/retry', () => ({
  withRetry: (...a: any[]) => mockWithRetry(...a),
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

vi.mock('@/lib/analytics', () => ({
  trackEvent: (...a: any[]) => mockTrackEvent(...a),
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
  pendingTeethKeys: {
    session: (id: string) => ['pending-teeth', 'session', id],
  },
}));

vi.mock('@/lib/aesthetic-goals', () => ({
  resolveAestheticGoalsForAI: (v: any) => v ?? undefined,
}));

vi.mock('../../wizard/helpers', () => ({
  getFullRegion: (t: string) => `region-${t}`,
}));

// ---- Helpers ----
function makeEval(overrides?: any) {
  return {
    id: 'eval-1',
    tooth: '11',
    status: 'draft',
    treatment_type: 'resina',
    patient_age: 30,
    region: 'Anterior Superior',
    cavity_class: 'Classe II',
    restoration_size: 'Média',
    substrate: 'Esmalte e Dentina',
    bruxism: false,
    aesthetic_level: 'funcional',
    tooth_color: 'A2',
    budget: 'padrão',
    longevity_expectation: 'Média',
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    patient_aesthetic_goals: null,
    anamnesis: null,
    ai_indication_reason: null,
    ...overrides,
  };
}

function makeDeps(overrides?: Partial<UseEvaluationActionsDeps>): UseEvaluationActionsDeps {
  return {
    sessionId: 'session-1',
    user: { id: 'user-1' } as any,
    evals: [makeEval()],
    isChecklistComplete: vi.fn(() => true),
    getChecklistProgress: vi.fn(() => ({ current: 3, total: 5 })),
    clearSelection: vi.fn(),
    ...overrides,
  };
}

describe('useEvaluationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateStatus.mockResolvedValue(undefined);
    mockDeleteSession.mockResolvedValue(undefined);
    mockGetOrCreateShareLink.mockResolvedValue('share-token-123');
    mockDispatchTreatmentProtocol.mockResolvedValue(undefined);
    mockSyncGroupProtocols.mockResolvedValue(undefined);
    mockUpdateEvaluationsBulk.mockResolvedValue(undefined);
    mockWithRetry.mockImplementation((fn: any) => fn());

    // Mock clipboard and window.open
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('returns all expected properties', () => {
    const { result } = renderHook(() => useEvaluationActions(makeDeps()));
    expect(result.current.showAddTeethModal).toBe(false);
    expect(typeof result.current.setShowAddTeethModal).toBe('function');
    expect(result.current.isSharing).toBe(false);
    expect(result.current.retryingEvaluationId).toBeNull();
    expect(result.current.isRegenerating).toBe(false);
    expect(result.current.regenerationProgress).toBeNull();
    expect(typeof result.current.handleMarkAsCompleted).toBe('function');
    expect(typeof result.current.handleMarkAllAsCompleted).toBe('function');
    expect(typeof result.current.handleBulkComplete).toBe('function');
    expect(typeof result.current.handleExportPDF).toBe('function');
    expect(typeof result.current.handleShareCase).toBe('function');
    expect(typeof result.current.handleShareWhatsApp).toBe('function');
    expect(typeof result.current.handleDeleteSession).toBe('function');
    expect(typeof result.current.handleAddTeethSuccess).toBe('function');
    expect(typeof result.current.handleRetryEvaluation).toBe('function');
    expect(typeof result.current.handleRegenerateWithBudget).toBe('function');
  });

  // ---- handleMarkAsCompleted ----
  describe('handleMarkAsCompleted', () => {
    it('returns undefined when evaluation not found', () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      const res = result.current.handleMarkAsCompleted('nonexistent');
      expect(res).toBeUndefined();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('returns pending checklist when not complete and no force', () => {
      const deps = makeDeps({
        isChecklistComplete: vi.fn(() => false),
        getChecklistProgress: vi.fn(() => ({ current: 2, total: 5 })),
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      const res = result.current.handleMarkAsCompleted('eval-1');
      expect(res).toEqual({ pending: true, current: 2, total: 5 });
    });

    it('mutates when checklist is complete', () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      result.current.handleMarkAsCompleted('eval-1');
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'eval-1', status: 'completed' },
        expect.anything(),
      );
    });

    it('mutates with force=true even when checklist is incomplete', () => {
      const deps = makeDeps({ isChecklistComplete: vi.fn(() => false) });
      const { result } = renderHook(() => useEvaluationActions(deps));
      result.current.handleMarkAsCompleted('eval-1', true);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  // ---- handleMarkAllAsCompleted ----
  describe('handleMarkAllAsCompleted', () => {
    it('shows info toast when no pending evals', async () => {
      const { toast } = await import('sonner');
      const deps = makeDeps({
        evals: [makeEval({ status: 'completed' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      act(() => result.current.handleMarkAllAsCompleted());
      expect(toast.info).toHaveBeenCalled();
    });

    it('shows info toast when all non-completed have incomplete checklist', async () => {
      const { toast } = await import('sonner');
      const deps = makeDeps({
        evals: [makeEval({ status: 'draft' })],
        isChecklistComplete: vi.fn(() => false),
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      act(() => result.current.handleMarkAllAsCompleted());
      expect(toast.info).toHaveBeenCalled();
    });

    it('bulk-completes eligible evaluations', () => {
      const deps = makeDeps({
        evals: [
          makeEval({ id: 'eval-1', status: 'draft' }),
          makeEval({ id: 'eval-2', status: 'draft' }),
        ],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      act(() => result.current.handleMarkAllAsCompleted());
      expect(mockMutate).toHaveBeenCalledWith(
        ['eval-1', 'eval-2'],
        expect.anything(),
      );
    });
  });

  // ---- handleExportPDF ----
  describe('handleExportPDF', () => {
    it('opens print URL in new tab', () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      act(() => result.current.handleExportPDF('eval-1'));
      expect(window.open).toHaveBeenCalledWith('/result/eval-1?print=true', '_blank');
    });
  });

  // ---- handleShareCase ----
  describe('handleShareCase', () => {
    it('early-returns when user is null', async () => {
      const deps = makeDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleShareCase();
      });
      expect(mockGetOrCreateShareLink).not.toHaveBeenCalled();
    });

    it('copies share link to clipboard', async () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleShareCase();
      });
      expect(mockGetOrCreateShareLink).toHaveBeenCalledWith('session-1', 'user-1');
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith('evaluation_shared', { method: 'clipboard_link' });
    });

    it('handles share error', async () => {
      const { toast } = await import('sonner');
      mockGetOrCreateShareLink.mockRejectedValue(new Error('share fail'));
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleShareCase();
      });
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ---- handleShareWhatsApp ----
  describe('handleShareWhatsApp', () => {
    it('early-returns when user is null', async () => {
      const deps = makeDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleShareWhatsApp();
      });
      expect(mockGetOrCreateShareLink).not.toHaveBeenCalled();
    });

    it('opens WhatsApp link', async () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleShareWhatsApp();
      });
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'noopener,noreferrer',
      );
      expect(mockTrackEvent).toHaveBeenCalledWith('evaluation_shared', { method: 'whatsapp' });
    });

    it('handles WhatsApp share error', async () => {
      const { toast } = await import('sonner');
      mockGetOrCreateShareLink.mockRejectedValue(new Error('wa fail'));
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleShareWhatsApp();
      });
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ---- handleDeleteSession ----
  describe('handleDeleteSession', () => {
    it('early-returns when user is null', async () => {
      const deps = makeDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleDeleteSession();
      });
      expect(mockDeleteSession).not.toHaveBeenCalled();
    });

    it('deletes session and navigates', async () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleDeleteSession();
      });
      expect(mockDeleteSession).toHaveBeenCalledWith('session-1', 'user-1');
      expect(mockTrackEvent).toHaveBeenCalledWith('session_deleted', { session_id: 'session-1' });
      expect(mockNavigate).toHaveBeenCalledWith('/evaluations');
    });

    it('handles delete error', async () => {
      const { toast } = await import('sonner');
      mockDeleteSession.mockRejectedValue(new Error('delete fail'));
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleDeleteSession();
      });
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ---- handleAddTeethSuccess ----
  describe('handleAddTeethSuccess', () => {
    it('invalidates session and pending teeth queries', () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      act(() => result.current.handleAddTeethSuccess());
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['evaluations', 'session', 'session-1'],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['pending-teeth', 'session', 'session-1'],
      });
    });
  });

  // ---- handleBulkComplete ----
  describe('handleBulkComplete', () => {
    it('shows info toast when no eligible evals', async () => {
      const { toast } = await import('sonner');
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', status: 'completed' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      act(() => result.current.handleBulkComplete(['eval-1']));
      expect(toast.info).toHaveBeenCalled();
    });

    it('shows info when evaluation not found in evals', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      act(() => result.current.handleBulkComplete(['nonexistent']));
      expect(toast.info).toHaveBeenCalled();
    });

    it('shows info when checklist incomplete', async () => {
      const { toast } = await import('sonner');
      const deps = makeDeps({ isChecklistComplete: vi.fn(() => false) });
      const { result } = renderHook(() => useEvaluationActions(deps));
      act(() => result.current.handleBulkComplete(['eval-1']));
      expect(toast.info).toHaveBeenCalled();
    });

    it('bulk-completes eligible evals', () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      act(() => result.current.handleBulkComplete(['eval-1']));
      expect(mockMutate).toHaveBeenCalledWith(['eval-1'], expect.anything());
    });
  });

  // ---- handleRetryEvaluation ----
  describe('handleRetryEvaluation', () => {
    it('early-returns when user is null', async () => {
      const deps = makeDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('early-returns when evaluation not found', async () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleRetryEvaluation('nonexistent');
      });
      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('retries resina evaluation with withRetry', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });

      expect(mockUpdateStatus).toHaveBeenCalledWith('eval-1', 'analyzing');
      expect(mockWithRetry).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalledWith('eval-1', 'draft');
      expect(toast.success).toHaveBeenCalled();
    });

    it('retries porcelana evaluation with cementationParams', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-p', treatment_type: 'porcelana' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-p');
      });
      expect(mockWithRetry).toHaveBeenCalled();
    });

    it('syncs protocols when multiple evals exist', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1' }), makeEval({ id: 'eval-2' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      expect(mockSyncGroupProtocols).toHaveBeenCalledWith(
        'session-1',
        ['eval-1', 'eval-2'],
      );
    });

    it('skips sync when only 1 eval', async () => {
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      expect(mockSyncGroupProtocols).not.toHaveBeenCalled();
    });

    it('handles sync error gracefully', async () => {
      mockSyncGroupProtocols.mockRejectedValue(new Error('sync fail'));
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1' }), makeEval({ id: 'eval-2' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      // Should not throw
    });

    it('handles retry failure — marks as error', async () => {
      const { toast } = await import('sonner');
      mockWithRetry.mockRejectedValue(new Error('AI fail'));
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      expect(mockUpdateStatus).toHaveBeenCalledWith('eval-1', 'error');
      expect(toast.error).toHaveBeenCalled();
    });

    it('handles status update error in catch block', async () => {
      mockWithRetry.mockRejectedValue(new Error('AI fail'));
      mockUpdateStatus
        .mockResolvedValueOnce(undefined) // analyzing
        .mockRejectedValueOnce(new Error('status fail')); // error update fails
      const { result } = renderHook(() => useEvaluationActions(makeDeps()));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      // Should not throw
    });

    it('uses treatment_type fallback to resina', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: null })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRetryEvaluation('eval-1');
      });
      // withRetry is called — dispatch happens with resina type
      expect(mockWithRetry).toHaveBeenCalled();
    });
  });

  // ---- handleRegenerateWithBudget ----
  describe('handleRegenerateWithBudget', () => {
    it('early-returns when user is null', async () => {
      const deps = makeDeps({ user: null });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });
      expect(mockUpdateEvaluationsBulk).not.toHaveBeenCalled();
    });

    it('early-returns when evals is empty', async () => {
      const deps = makeDeps({ evals: [] });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });
      expect(mockUpdateEvaluationsBulk).not.toHaveBeenCalled();
    });

    it('regenerates with premium budget', async () => {
      const { toast } = await import('sonner');
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockUpdateEvaluationsBulk).toHaveBeenCalledWith(
        ['eval-1'],
        { budget: 'premium', aesthetic_level: 'estético' },
      );
      expect(mockDispatchTreatmentProtocol).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('regenerates with padrão budget', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('padrão');
      });

      expect(mockUpdateEvaluationsBulk).toHaveBeenCalledWith(
        ['eval-1'],
        { budget: 'padrão', aesthetic_level: 'funcional' },
      );
    });

    it('regenerates porcelana evaluations', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-p', treatment_type: 'porcelana' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledWith(
        expect.objectContaining({
          treatmentType: 'porcelana',
          cementationParams: expect.objectContaining({
            ceramicType: 'Dissilicato de lítio',
          }),
        }),
        expect.anything(),
      );
    });

    it('skips non-resina/porcelana evals for AI dispatch', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-e', treatment_type: 'endodontia' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      // endodontia is filtered out by aiEvals filter
      expect(mockDispatchTreatmentProtocol).not.toHaveBeenCalled();
    });

    it('syncs protocols when successCount >= 2', async () => {
      const deps = makeDeps({
        evals: [
          makeEval({ id: 'eval-1', treatment_type: 'resina' }),
          makeEval({ id: 'eval-2', treatment_type: 'resina' }),
        ],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockSyncGroupProtocols).toHaveBeenCalled();
    });

    it('skips sync when successCount < 2', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockSyncGroupProtocols).not.toHaveBeenCalled();
    });

    it('handles individual eval dispatch failure', async () => {
      mockDispatchTreatmentProtocol.mockRejectedValue(new Error('AI fail'));
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockUpdateStatus).toHaveBeenCalledWith('eval-1', 'error');
    });

    it('handles bulk update failure with partial success warning', async () => {
      const { toast } = await import('sonner');
      // First eval succeeds, then bulk update throws
      mockDispatchTreatmentProtocol.mockResolvedValueOnce(undefined);
      mockUpdateEvaluationsBulk.mockRejectedValue(new Error('bulk fail'));

      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('handles sync error gracefully during regeneration', async () => {
      mockSyncGroupProtocols.mockRejectedValue(new Error('sync fail'));
      const deps = makeDeps({
        evals: [
          makeEval({ id: 'eval-1', treatment_type: 'resina' }),
          makeEval({ id: 'eval-2', treatment_type: 'resina' }),
        ],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });
      // Should not throw — sync error is non-critical
    });

    it('uses region fallback from getFullRegion', async () => {
      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina', region: null })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });

      expect(mockDispatchTreatmentProtocol).toHaveBeenCalledWith(
        expect.objectContaining({
          resinParams: expect.objectContaining({
            region: 'region-11',
          }),
        }),
        expect.anything(),
      );
    });

    it('handles status update error in individual eval catch', async () => {
      mockDispatchTreatmentProtocol.mockRejectedValue(new Error('AI fail'));
      mockUpdateStatus
        .mockResolvedValueOnce(undefined) // analyzing
        .mockRejectedValueOnce(new Error('status update fail')); // error marking fails

      const deps = makeDeps({
        evals: [makeEval({ id: 'eval-1', treatment_type: 'resina' })],
      });
      const { result } = renderHook(() => useEvaluationActions(deps));
      await act(async () => {
        await result.current.handleRegenerateWithBudget('premium');
      });
      // Should not throw
    });
  });
});
