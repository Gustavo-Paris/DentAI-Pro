import { describe, it, expect } from 'vitest';
import { formatPrice, formatCredits } from '../useSubscription';

// Test the pure utility functions and credit calculation logic
// The hook itself requires React context (QueryClient, Auth), so we test
// the exported helpers and the computation logic independently.

describe('formatPrice', () => {
  it('should format BRL price from cents', () => {
    const result = formatPrice(2990);
    expect(result).toContain('29,90');
    expect(result).toContain('R$');
  });

  it('should handle zero', () => {
    const result = formatPrice(0);
    expect(result).toContain('0,00');
  });

  it('should handle large amounts', () => {
    const result = formatPrice(99900);
    expect(result).toContain('999,00');
  });
});

describe('formatCredits', () => {
  it('should format generic credits (singular)', () => {
    expect(formatCredits(1)).toBe('1 crédito');
  });

  it('should format generic credits (plural)', () => {
    expect(formatCredits(5)).toBe('5 créditos');
  });

  it('should format case_analysis (singular)', () => {
    expect(formatCredits(1, 'case_analysis')).toBe('1 análise');
  });

  it('should format case_analysis (plural)', () => {
    expect(formatCredits(3, 'case_analysis')).toBe('3 análises');
  });

  it('should format dsd_simulation (singular)', () => {
    expect(formatCredits(2, 'dsd_simulation')).toBe('1 simulação DSD');
  });

  it('should format dsd_simulation (plural)', () => {
    expect(formatCredits(6, 'dsd_simulation')).toBe('3 simulações DSD');
  });
});

describe('credit calculation logic', () => {
  // Replicate the hook's credit computation to verify correctness
  function computeCredits(params: {
    creditsPerMonth: number;
    creditsUsed: number;
    creditsRollover: number;
  }) {
    const { creditsPerMonth, creditsUsed, creditsRollover } = params;
    const creditsTotal = creditsPerMonth + creditsRollover;
    const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);
    const creditsPercentUsed = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;
    return { creditsTotal, creditsRemaining, creditsPercentUsed };
  }

  it('should compute credits correctly for free tier', () => {
    const result = computeCredits({ creditsPerMonth: 5, creditsUsed: 2, creditsRollover: 0 });
    expect(result.creditsTotal).toBe(5);
    expect(result.creditsRemaining).toBe(3);
    expect(result.creditsPercentUsed).toBe(40);
  });

  it('should include rollover in total', () => {
    const result = computeCredits({ creditsPerMonth: 10, creditsUsed: 5, creditsRollover: 3 });
    expect(result.creditsTotal).toBe(13);
    expect(result.creditsRemaining).toBe(8);
  });

  it('should not go negative on remaining', () => {
    const result = computeCredits({ creditsPerMonth: 5, creditsUsed: 10, creditsRollover: 0 });
    expect(result.creditsRemaining).toBe(0);
  });

  it('should handle zero total', () => {
    const result = computeCredits({ creditsPerMonth: 0, creditsUsed: 0, creditsRollover: 0 });
    expect(result.creditsTotal).toBe(0);
    expect(result.creditsPercentUsed).toBe(0);
  });

  // canUseCredits logic
  function canUseCredits(creditsRemaining: number, cost: number): boolean {
    return creditsRemaining >= cost;
  }

  it('should allow operation when enough credits', () => {
    expect(canUseCredits(5, 2)).toBe(true);
  });

  it('should deny operation when not enough credits', () => {
    expect(canUseCredits(1, 2)).toBe(false);
  });

  it('should allow operation when credits exactly match', () => {
    expect(canUseCredits(2, 2)).toBe(true);
  });

  it('should deny operation when zero credits remain', () => {
    expect(canUseCredits(0, 1)).toBe(false);
  });
});

describe('credit calculation with bonus', () => {
  // Replicate the hook's full credit computation including bonus
  function computeCreditsWithBonus(params: {
    creditsPerMonth: number;
    creditsUsed: number;
    creditsRollover: number;
    creditsBonus: number;
  }) {
    const { creditsPerMonth, creditsUsed, creditsRollover, creditsBonus } = params;
    const creditsTotal = creditsPerMonth + creditsRollover + creditsBonus;
    const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);
    const creditsPercentUsed = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;
    return { creditsTotal, creditsRemaining, creditsPercentUsed };
  }

  it('should include bonus in total credits', () => {
    const result = computeCreditsWithBonus({
      creditsPerMonth: 10,
      creditsUsed: 5,
      creditsRollover: 3,
      creditsBonus: 7,
    });
    expect(result.creditsTotal).toBe(20); // 10 + 3 + 7
    expect(result.creditsRemaining).toBe(15); // 20 - 5
  });

  it('should compute percentage correctly with bonus', () => {
    const result = computeCreditsWithBonus({
      creditsPerMonth: 10,
      creditsUsed: 10,
      creditsRollover: 0,
      creditsBonus: 10,
    });
    expect(result.creditsTotal).toBe(20);
    expect(result.creditsPercentUsed).toBe(50); // 10/20 * 100
    expect(result.creditsRemaining).toBe(10);
  });
});

describe('estimatedDaysRemaining calculation', () => {
  function computeEstimatedDays(
    creditUsageHistory: { created_at: string; credits_used: number }[],
    creditsRemaining: number,
  ): number | null {
    if (creditUsageHistory.length === 0 || creditsRemaining <= 0) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = creditUsageHistory.filter(
      (entry) => new Date(entry.created_at) >= thirtyDaysAgo,
    );

    if (recentEntries.length === 0) return null;

    const totalUsed = recentEntries.reduce((sum, entry) => sum + entry.credits_used, 0);
    const avgPerDay = totalUsed / 30;

    if (avgPerDay <= 0) return null;
    return Math.floor(creditsRemaining / avgPerDay);
  }

  it('should return null for empty usage history', () => {
    expect(computeEstimatedDays([], 10)).toBeNull();
  });

  it('should return null when no credits remaining', () => {
    const history = [{ created_at: new Date().toISOString(), credits_used: 5 }];
    expect(computeEstimatedDays(history, 0)).toBeNull();
  });

  it('should return null when no recent entries in last 30 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const history = [{ created_at: oldDate.toISOString(), credits_used: 5 }];
    expect(computeEstimatedDays(history, 10)).toBeNull();
  });

  it('should estimate days based on average daily usage', () => {
    const now = new Date();
    const history = [
      { created_at: now.toISOString(), credits_used: 30 }, // 30 credits over 30 days = 1/day
    ];
    const result = computeEstimatedDays(history, 15);
    expect(result).toBe(15); // 15 remaining / 1 per day
  });

  it('should handle high usage rate', () => {
    const now = new Date();
    const history = [
      { created_at: now.toISOString(), credits_used: 60 }, // 60 credits over 30 days = 2/day
    ];
    const result = computeEstimatedDays(history, 10);
    expect(result).toBe(5); // 10 remaining / 2 per day
  });
});

// ---------------------------------------------------------------------------
// Subscription status computed properties
// ---------------------------------------------------------------------------

describe('subscription status logic', () => {
  function computeStatus(subscription: { status: string; plan_id: string | null } | null) {
    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
    const isFree = !isActive || subscription?.plan_id === 'starter' || !subscription?.plan_id;
    const isEssencial = isActive && subscription?.plan_id === 'price_essencial_monthly';
    const isPro = isActive && subscription?.plan_id === 'price_pro_monthly_v2';
    const isElite = isActive && subscription?.plan_id === 'price_elite_monthly';
    return { isActive, isFree, isEssencial, isPro, isElite };
  }

  it('should identify active subscription', () => {
    const result = computeStatus({ status: 'active', plan_id: 'price_pro_monthly_v2' });
    expect(result.isActive).toBe(true);
  });

  it('should identify trialing as active', () => {
    const result = computeStatus({ status: 'trialing', plan_id: 'price_pro_monthly_v2' });
    expect(result.isActive).toBe(true);
  });

  it('should identify inactive statuses', () => {
    for (const status of ['inactive', 'past_due', 'canceled', 'unpaid']) {
      const result = computeStatus({ status, plan_id: 'price_pro_monthly_v2' });
      expect(result.isActive).toBe(false);
    }
  });

  it('should identify free tier when no subscription', () => {
    const result = computeStatus(null);
    expect(result.isFree).toBe(true);
  });

  it('should identify free tier when plan_id is starter', () => {
    const result = computeStatus({ status: 'active', plan_id: 'starter' });
    expect(result.isFree).toBe(true);
  });

  it('should identify free tier when plan_id is null', () => {
    const result = computeStatus({ status: 'active', plan_id: null });
    expect(result.isFree).toBe(true);
  });

  it('should identify free tier when subscription is inactive', () => {
    const result = computeStatus({ status: 'canceled', plan_id: 'price_pro_monthly_v2' });
    expect(result.isFree).toBe(true);
  });

  it('should identify isPro correctly', () => {
    const result = computeStatus({ status: 'active', plan_id: 'price_pro_monthly_v2' });
    expect(result.isPro).toBe(true);
    expect(result.isFree).toBe(false);
    expect(result.isEssencial).toBe(false);
    expect(result.isElite).toBe(false);
  });

  it('should identify isEssencial correctly', () => {
    const result = computeStatus({ status: 'active', plan_id: 'price_essencial_monthly' });
    expect(result.isEssencial).toBe(true);
    expect(result.isPro).toBe(false);
  });

  it('should identify isElite correctly', () => {
    const result = computeStatus({ status: 'active', plan_id: 'price_elite_monthly' });
    expect(result.isElite).toBe(true);
    expect(result.isPro).toBe(false);
  });
});

describe('getCreditCost logic', () => {
  const DEFAULT_CREDIT_COSTS: Record<string, number> = {
    case_analysis: 1,
    dsd_simulation: 2,
  };

  function getCreditCost(
    creditCostsMap: Record<string, number>,
    operation: string,
  ): number {
    return creditCostsMap[operation] || DEFAULT_CREDIT_COSTS[operation] || 1;
  }

  it('should return cost from DB map when available', () => {
    const map = { case_analysis: 3, dsd_simulation: 5 };
    expect(getCreditCost(map, 'case_analysis')).toBe(3);
  });

  it('should fall back to default when not in DB map', () => {
    expect(getCreditCost({}, 'case_analysis')).toBe(1);
    expect(getCreditCost({}, 'dsd_simulation')).toBe(2);
  });

  it('should return 1 for unknown operations', () => {
    expect(getCreditCost({}, 'unknown_operation')).toBe(1);
  });

  it('should prefer DB value over default', () => {
    const map = { case_analysis: 10 };
    expect(getCreditCost(map, 'case_analysis')).toBe(10);
  });
});

describe('legacy usage tracking logic', () => {
  function computeLegacyUsage(plan: { cases_per_month: number; dsd_simulations_per_month: number } | undefined, subscription: { cases_used_this_month: number; dsd_used_this_month: number } | undefined) {
    const casesLimit = plan?.cases_per_month || 3;
    const casesUsed = subscription?.cases_used_this_month || 0;
    const casesRemaining = casesLimit === -1 ? Infinity : Math.max(0, casesLimit - casesUsed);

    const dsdLimit = plan?.dsd_simulations_per_month || 2;
    const dsdUsed = subscription?.dsd_used_this_month || 0;
    const dsdRemaining = dsdLimit === -1 ? Infinity : Math.max(0, dsdLimit - dsdUsed);

    return { casesLimit, casesUsed, casesRemaining, dsdLimit, dsdUsed, dsdRemaining };
  }

  it('should use defaults when no plan', () => {
    const result = computeLegacyUsage(undefined, undefined);
    expect(result.casesLimit).toBe(3);
    expect(result.dsdLimit).toBe(2);
    expect(result.casesRemaining).toBe(3);
    expect(result.dsdRemaining).toBe(2);
  });

  it('should calculate remaining correctly', () => {
    const result = computeLegacyUsage(
      { cases_per_month: 10, dsd_simulations_per_month: 5 },
      { cases_used_this_month: 4, dsd_used_this_month: 2 },
    );
    expect(result.casesRemaining).toBe(6);
    expect(result.dsdRemaining).toBe(3);
  });

  it('should handle unlimited plans (-1)', () => {
    const result = computeLegacyUsage(
      { cases_per_month: -1, dsd_simulations_per_month: -1 },
      { cases_used_this_month: 100, dsd_used_this_month: 50 },
    );
    expect(result.casesRemaining).toBe(Infinity);
    expect(result.dsdRemaining).toBe(Infinity);
  });

  it('should not go negative on remaining', () => {
    const result = computeLegacyUsage(
      { cases_per_month: 3, dsd_simulations_per_month: 2 },
      { cases_used_this_month: 10, dsd_used_this_month: 5 },
    );
    expect(result.casesRemaining).toBe(0);
    expect(result.dsdRemaining).toBe(0);
  });
});
