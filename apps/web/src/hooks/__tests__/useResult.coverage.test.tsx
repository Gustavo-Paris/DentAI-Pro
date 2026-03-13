import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ id: 'eval-test-1' })),
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
  evaluations: {
    getByIdWithRelations: vi.fn().mockResolvedValue({
      id: 'eval-test-1',
      created_at: '2025-01-15T10:00:00Z',
      patient_name: 'Test Patient',
      patient_age: 30,
      tooth: '11',
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
      recommendation_text: 'Test recommendation',
      alternatives: [{ name: 'Alt1', manufacturer: 'Mfr1', reason: 'Reason1' }],
      resins: { id: 'r1', name: 'Z350', manufacturer: '3M', shade: 'A2', brand: 'Filtek', product_line: 'Z350 XT', type: 'esmalte', opacity: 'translucido' },
      photo_frontal: null,
      photo_45: null,
      photo_face: null,
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
        checklist: ['Step1', 'Step2'],
        confidence: 'alta',
      },
      protocol_layers: null,
      alerts: ['Alert1'],
      warnings: ['Warn1'],
      is_from_inventory: true,
      ideal_resin_id: null,
      ideal_reason: null,
      ideal_resin: null,
      has_inventory_at_creation: true,
      checklist_progress: [0],
      dsd_analysis: null,
      dsd_simulation_url: null,
      dsd_simulation_layers: null,
      treatment_type: 'resina',
      cementation_protocol: null,
      ai_treatment_indication: null,
      ai_indication_reason: null,
      generic_protocol: null,
      session_id: 'session-1',
      tooth_bounds: null,
      patient_aesthetic_goals: null,
      patient_desired_changes: null,
    }),
  },
  storage: {
    getSignedPhotoUrl: vi.fn().mockResolvedValue('https://signed.url/photo'),
    getSignedDSDUrl: vi.fn().mockResolvedValue('https://signed.url/dsd'),
    getSignedDSDLayerUrls: vi.fn().mockResolvedValue({}),
    getAvatarPublicUrl: vi.fn((url: string) => `https://storage.test/${url}`),
  },
  profiles: {
    getFullByUserId: vi.fn().mockResolvedValue({
      full_name: 'Dr. Test',
      cro: 'CRO-SP 12345',
      clinic_name: 'Test Clinic',
      clinic_logo_url: null,
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/imageUtils', () => ({
  fetchImageAsBase64: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useResult } from '@/hooks/domain/useResult';

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

describe('useResult (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
    expect(result.current.generatingPDF).toBe(false);
    expect(result.current.showPdfConfirmDialog).toBe(false);
  });

  it('should load evaluation data', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.evaluation).toBeDefined();
    expect(result.current.evaluation?.id).toBe('eval-test-1');
  });

  it('should compute treatment flags', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.treatmentType).toBe('resina');
    expect(result.current.isPorcelain).toBe(false);
    expect(result.current.isSpecialTreatment).toBe(false);
  });

  it('should compute protocol data', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.layers).toHaveLength(2);
    expect(result.current.checklist).toEqual(['Step1', 'Step2']);
    expect(result.current.confidence).toBe('alta');
    expect(result.current.hasProtocol).toBe(true);
  });

  it('should compute resin and alternatives', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.resin).toBeDefined();
    expect(result.current.resin?.name).toBe('Z350');
    expect(result.current.idealResin).toBeNull();
    expect(result.current.showIdealResin).toBe(false);
    expect(result.current.alternatives).toHaveLength(1);
  });

  it('should compute alerts and warnings', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.alerts).toEqual(['Alert1']);
    expect(result.current.warnings).toEqual(['Warn1']);
  });

  it('should load dentist profile', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.dentistProfile).not.toBeNull();
    });
    expect(result.current.dentistProfile?.full_name).toBe('Dr. Test');
  });

  it('should compute hasPhotos as false when no photos', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.hasPhotos).toBe(false);
  });

  it('should provide currentTreatmentStyle', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.currentTreatmentStyle).toBeDefined();
    expect(result.current.currentTreatmentStyle.icon).toBeDefined();
  });

  it('should provide checklist change handler', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    expect(typeof result.current.handleChecklistChange).toBe('function');
  });

  it('should provide PDF handlers', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    expect(typeof result.current.handlePdfButtonClick).toBe('function');
    expect(typeof result.current.handleExportPDF).toBe('function');
  });

  it('should return dsd data as defaults', async () => {
    const { result } = renderHook(() => useResult(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.dsdLayerUrls).toEqual({});
    expect(result.current.dsdSimulationUrl).toBeNull();
    expect(result.current.dsdSimulationLayers).toBeNull();
  });
});
