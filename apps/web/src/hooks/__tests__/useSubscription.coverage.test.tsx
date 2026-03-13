import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUser = { id: 'test-user-id' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser, loading: false })),
}));

const mockGetPlans = vi.fn().mockResolvedValue([
  { id: 'starter', credits_per_month: 5, cases_per_month: 3, dsd_simulations_per_month: 2 },
  { id: 'price_pro_monthly_v2', credits_per_month: 50, cases_per_month: -1, dsd_simulations_per_month: -1 },
]);

const mockGetCreditCosts = vi.fn().mockResolvedValue([
  { operation: 'case_analysis', credits: 2 },
  { operation: 'dsd_simulation', credits: 3 },
]);

const mockGetByUserId = vi.fn().mockResolvedValue({
  status: 'active',
  plan_id: 'price_pro_monthly_v2',
  credits_used_this_month: 10,
  credits_rollover: 5,
  credits_bonus: 3,
  cases_used_this_month: 4,
  dsd_used_this_month: 2,
  plan: { id: 'price_pro_monthly_v2', credits_per_month: 50, cases_per_month: -1, dsd_simulations_per_month: -1 },
});

const mockGetCreditPacks = vi.fn().mockResolvedValue([
  { id: 'pack-10', credits: 10, price: 990 },
]);

const mockCreateCheckoutSession = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/123' });
const mockPurchaseCreditPack = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pack' });
const mockCreatePortalSession = vi.fn().mockResolvedValue({ url: 'https://portal.stripe.com' });
const mockListByUserId = vi.fn().mockResolvedValue([]);

vi.mock('@/data', () => ({
  subscriptions: {
    getPlans: () => mockGetPlans(),
    getCreditCosts: () => mockGetCreditCosts(),
    getByUserId: (id: string) => mockGetByUserId(id),
    getCreditPacks: () => mockGetCreditPacks(),
    createCheckoutSession: (...a: any[]) => mockCreateCheckoutSession(...a),
    purchaseCreditPack: (...a: any[]) => mockPurchaseCreditPack(...a),
    createPortalSession: () => mockCreatePortalSession(),
    syncCreditPurchase: vi.fn(),
  },
  creditUsage: {
    listByUserId: (...a: any[]) => mockListByUserId(...a),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/i18n', () => ({
  default: {
    language: 'pt-BR',
    t: (key: string, opts?: any) => {
      if (key === 'credits.format.credit') return `${opts?.count} crédito${opts?.count !== 1 ? 's' : ''}`;
      if (key === 'credits.format.analysis') return `${opts?.count} análise${opts?.count !== 1 ? 's' : ''}`;
      if (key === 'credits.format.simulation') return `${opts?.count} simulação DSD`;
      return key;
    },
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useSubscription } from '@/hooks/useSubscription';

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

describe('useSubscription (renderHook)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default implementations
    mockGetPlans.mockResolvedValue([
      { id: 'starter', credits_per_month: 5, cases_per_month: 3, dsd_simulations_per_month: 2 },
      { id: 'price_pro_monthly_v2', credits_per_month: 50, cases_per_month: -1, dsd_simulations_per_month: -1 },
    ]);
    mockGetByUserId.mockResolvedValue({
      status: 'active',
      plan_id: 'price_pro_monthly_v2',
      credits_used_this_month: 10,
      credits_rollover: 5,
      credits_bonus: 3,
      cases_used_this_month: 4,
      dsd_used_this_month: 2,
      plan: { id: 'price_pro_monthly_v2', credits_per_month: 50, cases_per_month: -1, dsd_simulations_per_month: -1 },
    });
    mockGetCreditCosts.mockResolvedValue([
      { operation: 'case_analysis', credits: 2 },
      { operation: 'dsd_simulation', credits: 3 },
    ]);
    mockGetCreditPacks.mockResolvedValue([{ id: 'pack-10', credits: 10, price: 990 }]);
    mockListByUserId.mockResolvedValue([]);
  });

  it('returns initial state with data after loading', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeDefined();
    expect(result.current.plans.length).toBeGreaterThan(0);
    expect(result.current.isActive).toBe(true);
    expect(result.current.isFree).toBe(false);
    expect(result.current.isPro).toBe(true);
    expect(result.current.isEssencial).toBe(false);
    expect(result.current.isElite).toBe(false);
  });

  it('computes credit values correctly', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.creditsPerMonth).toBe(50);
    expect(result.current.creditsUsed).toBe(10);
    expect(result.current.creditsRollover).toBe(5);
    expect(result.current.creditsBonus).toBe(3);
    expect(result.current.creditsTotal).toBe(58); // 50 + 5 + 3
    expect(result.current.creditsRemaining).toBe(48); // 58 - 10
  });

  it('getCreditCost returns cost from DB map', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getCreditCost('case_analysis')).toBe(2);
    expect(result.current.getCreditCost('dsd_simulation')).toBe(3);
    expect(result.current.getCreditCost('unknown')).toBe(1); // fallback
  });

  it('canUseCredits returns true when enough credits', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canUseCredits('case_analysis')).toBe(true);
    expect(result.current.canUseCredits('dsd_simulation')).toBe(true);
  });

  it('canUseCredits returns false when not enough credits', async () => {
    mockGetByUserId.mockResolvedValue({
      status: 'active',
      plan_id: 'price_pro_monthly_v2',
      credits_used_this_month: 58,
      credits_rollover: 5,
      credits_bonus: 3,
      cases_used_this_month: 0,
      dsd_used_this_month: 0,
      plan: { id: 'price_pro_monthly_v2', credits_per_month: 50, cases_per_month: -1, dsd_simulations_per_month: -1 },
    });
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.creditsRemaining).toBe(0);
    expect(result.current.canUseCredits('case_analysis')).toBe(false);
  });

  it('checkout calls mutation', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.checkout('price_pro_monthly_v2', 'monthly');
    });

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith('price_pro_monthly_v2', 'monthly');
    });
  });

  it('purchasePack calls mutation', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.purchasePack('pack-10', 'card');
    });

    await waitFor(() => {
      expect(mockPurchaseCreditPack).toHaveBeenCalledWith('pack-10', 'card');
    });
  });

  it('openPortal calls mutation', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.openPortal();
    });

    await waitFor(() => {
      expect(mockCreatePortalSession).toHaveBeenCalled();
    });
  });

  it('refreshSubscription invalidates queries', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.refreshSubscription();
    });
    // Should not throw
  });

  it('returns creditPacks', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.creditPacks.length).toBeGreaterThan(0);
    });
    expect(result.current.creditPacks[0].id).toBe('pack-10');
  });

  it('handles free/inactive subscription', async () => {
    mockGetByUserId.mockResolvedValue(null);
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.isFree).toBe(true);
    expect(result.current.creditsPerMonth).toBe(5); // default
  });

  it('computes legacy usage (casesRemaining, dsdRemaining)', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Pro plan has -1 limits = Infinity
    expect(result.current.casesRemaining).toBe(Infinity);
    expect(result.current.dsdRemaining).toBe(Infinity);
    expect(result.current.canCreateCase).toBe(true);
    expect(result.current.canCreateDsd).toBe(true);
  });

  it('estimatedDaysRemaining is null when no usage history', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.estimatedDaysRemaining).toBeNull();
  });

  it('estimatedDaysRemaining computes when usage history exists', async () => {
    const now = new Date();
    mockListByUserId.mockResolvedValue([
      { created_at: now.toISOString(), credits_used: 30 },
    ]);
    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isCreditUsageLoading).toBe(false);
    });
    // Should compute: 48 remaining / (30/30=1 per day) = 48 days
    expect(result.current.estimatedDaysRemaining).toBe(48);
  });
});
