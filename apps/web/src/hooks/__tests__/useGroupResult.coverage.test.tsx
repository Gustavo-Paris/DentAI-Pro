import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({
    sessionId: 'session-test-1',
    fingerprint: encodeURIComponent('resina::Z350|3M::Z350:A2B'),
  })),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => {
  const baseEval = {
    created_at: '2025-01-15T10:00:00Z',
    patient_name: 'Test Patient',
    patient_age: 30,
    region: 'anterior',
    cavity_class: 'III',
    restoration_size: 'Média',
    substrate: 'esmalte',
    aesthetic_level: 'estético',
    tooth_color: 'A2',
    stratification_needed: true,
    bruxism: false,
    longevity_expectation: 'médio',
    budget: 'padrão',
    recommendation_text: null,
    alternatives: null,
    resins: { id: 'r1', name: 'Z350', manufacturer: '3M' },
    photo_frontal: null,
    stratification_protocol: {
      layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
      checklist: ['Step1'],
      confidence: 'alta',
    },
    protocol_layers: null,
    alerts: ['Alert1'],
    warnings: null,
    checklist_progress: null,
    treatment_type: 'resina',
    cementation_protocol: null,
    ai_treatment_indication: null,
    ai_indication_reason: null,
    generic_protocol: null,
    session_id: 'session-test-1',
    dsd_analysis: null,
    dsd_simulation_url: null,
    dsd_simulation_layers: null,
    status: 'draft',
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    anamnesis: null,
  };
  return {
    evaluations: {
      listBySession: vi.fn().mockResolvedValue([
        { ...baseEval, id: 'eval-1', tooth: '11' },
        { ...baseEval, id: 'eval-2', tooth: '21' },
      ]),
      updateChecklistBulk: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      updateStatusBulk: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      getSignedPhotoUrl: vi.fn().mockResolvedValue('https://signed.url/photo'),
      getSignedDSDUrl: vi.fn().mockResolvedValue('https://signed.url/dsd'),
      getSignedDSDLayerUrls: vi.fn().mockResolvedValue({}),
    },
    wizard: {
      syncGroupProtocols: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/protocol-dispatch', () => ({
  dispatchTreatmentProtocol: vi.fn().mockResolvedValue(undefined),
  DEFAULT_CERAMIC_TYPE: 'Dissilicato de Lítio',
  evaluationClients: {},
}));

vi.mock('@/lib/aesthetic-goals', () => ({
  resolveAestheticGoalsForAI: vi.fn((v: unknown) => v),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useGroupResult } from '@/hooks/domain/useGroupResult';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGroupResult (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
    expect(result.current.sessionId).toBe('session-test-1');
    expect(result.current.isRetrying).toBe(false);
  });

  it('should load group evaluations', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.groupEvaluations.length).toBeGreaterThanOrEqual(1);
    expect(result.current.primaryEval).toBeDefined();
  });

  it('should compute groupTeeth', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.groupTeeth).toBeDefined();
    expect(result.current.groupTeeth.length).toBeGreaterThan(0);
  });

  it('should compute protocol data from primary eval', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.treatmentType).toBe('resina');
    expect(result.current.isPorcelain).toBe(false);
    expect(result.current.layers.length).toBeGreaterThan(0);
    expect(result.current.checklist).toEqual(['Step1']);
    expect(result.current.confidence).toBe('alta');
    expect(result.current.hasProtocol).toBe(true);
  });

  it('should provide resin from primary eval', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.resin).toBeDefined();
    expect(result.current.resin?.name).toBe('Z350');
  });

  it('should provide action handlers', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    expect(typeof result.current.handleChecklistChange).toBe('function');
    expect(typeof result.current.handleMarkAllCompleted).toBe('function');
    expect(typeof result.current.handleRetryProtocol).toBe('function');
  });

  it('should return DSD data', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.dsdAnalysis).toBeNull();
    expect(result.current.dsdSimulationLayers).toBeNull();
    expect(result.current.dsdLayerUrls).toEqual({});
  });

  it('should return alerts and warnings', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.alerts).toEqual(['Alert1']);
    expect(result.current.warnings).toEqual([]);
  });

  it('should expose currentTreatmentStyle', async () => {
    const { result } = renderHook(() => useGroupResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.currentTreatmentStyle).toBeDefined();
  });
});
