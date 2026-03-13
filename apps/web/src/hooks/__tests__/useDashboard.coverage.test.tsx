import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — must be before importing the hook
// ---------------------------------------------------------------------------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => ({
  evaluations: {
    getDashboardMetrics: vi.fn().mockResolvedValue({
      totalEvaluations: 10,
      totalPatients: 5,
      pendingSessionCount: 2,
      weeklySessionCount: 3,
      completionRate: 80,
      pendingTeethCount: 4,
    }),
    getRecent: vi.fn().mockResolvedValue([
      {
        id: 'e1',
        session_id: 'session-1',
        created_at: '2025-01-15T10:00:00Z',
        tooth: '11',
        patient_name: 'Test Patient',
        status: 'completed',
        treatment_type: 'resina',
        patient_age: 30,
        dsd_simulation_url: null,
      },
    ]),
    getDashboardInsights: vi.fn().mockResolvedValue([]),
  },
  patients: {
    countByUserIdSince: vi.fn().mockResolvedValue(3),
  },
  profiles: {
    getByUserId: vi.fn().mockResolvedValue({
      full_name: 'Dr. Test User',
      avatar_url: null,
    }),
    getAvatarPublicUrl: vi.fn((url: string) => `https://storage.test/${url}`),
  },
}));

vi.mock('@/data/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    creditsRemaining: 10,
    creditsPerMonth: 50,
    isActive: true,
    isFree: false,
    isLoading: false,
    refreshSubscription: vi.fn(),
  })),
}));

vi.mock('@/hooks/useWizardDraft', () => ({
  useWizardDraft: vi.fn(() => ({
    loadDraft: vi.fn().mockResolvedValue(null),
    clearDraft: vi.fn(),
    saveDraft: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useDashboard } from '@/hooks/domain/useDashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDashboard (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    // Initially, some queries will be loading
    expect(result.current).toBeDefined();
    expect(result.current.firstName).toBeDefined();
    expect(result.current.greeting).toBeDefined();
  });

  it('should resolve profile data', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingProfile).toBe(false);
    });
    expect(result.current.firstName).toBe('Dr. Test');
  });

  it('should resolve metrics', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingMetrics).toBe(false);
    });
    expect(result.current.metrics.totalCases).toBe(10);
    expect(result.current.metrics.totalPatients).toBe(5);
  });

  it('should resolve sessions', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingSessions).toBe(false);
    });
    expect(result.current.sessions.length).toBeGreaterThanOrEqual(1);
    expect(result.current.sessions[0].session_id).toBe('session-1');
  });

  it('should have weekRange defined', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    expect(result.current.weekRange).toBeDefined();
    expect(result.current.weekRange.start).toBeDefined();
    expect(result.current.weekRange.end).toBeDefined();
  });

  it('should compute isNewUser correctly when sessions exist', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingMetrics).toBe(false);
    });
    expect(result.current.isNewUser).toBe(false);
  });

  it('should not show credits banner when credits > 5', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingCredits).toBe(false);
    });
    expect(result.current.showCreditsBanner).toBe(false);
  });

  it('should handle dismissWelcome', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    result.current.dismissWelcome();
    await waitFor(() => {
      expect(result.current.showWelcome).toBe(false);
    });
  });

  it('should handle dismissCreditsBanner', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    result.current.dismissCreditsBanner();
    await waitFor(() => {
      expect(result.current.showCreditsBanner).toBe(false);
    });
  });

  it('should handle requestDiscardDraft / cancelDiscardDraft', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    result.current.requestDiscardDraft();
    await waitFor(() => {
      expect(result.current.showDiscardConfirm).toBe(true);
    });
    result.current.cancelDiscardDraft();
    await waitFor(() => {
      expect(result.current.showDiscardConfirm).toBe(false);
    });
  });

  it('should handle confirmDiscardDraft', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    result.current.requestDiscardDraft();
    await waitFor(() => {
      expect(result.current.showDiscardConfirm).toBe(true);
    });
    result.current.confirmDiscardDraft();
    await waitFor(() => {
      expect(result.current.showDiscardConfirm).toBe(false);
    });
  });

  it('should return subscription info', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    expect(result.current.creditsRemaining).toBe(10);
    expect(result.current.creditsPerMonth).toBe(50);
    expect(result.current.isActive).toBe(true);
    expect(result.current.isFree).toBe(false);
  });

  it('should compute patient growth', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.patientsThisMonth).toBeGreaterThanOrEqual(0);
    });
  });

  it('should resolve insights', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.loadingInsights).toBe(false);
    });
    // With empty insights data, clinicalInsights should still be resolved
    expect(result.current.weeklyTrends).toBeDefined();
  });
});
