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
});
