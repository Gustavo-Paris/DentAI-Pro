import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useReferral.
// The hook depends on React Query, AuthContext, and browser APIs, so we test
// the share URL construction, default stats, and stats resolution independently.
// ---------------------------------------------------------------------------

interface ReferralStats {
  totalReferrals: number;
  totalCreditsEarned: number;
}

// ---------------------------------------------------------------------------
// Pure functions mirroring the hook's logic
// ---------------------------------------------------------------------------

// Mirrors: const shareUrl = code ? `${origin}/register?ref=${code}` : '';
function buildShareUrl(code: string | null, origin = 'https://tosmile.ai'): string {
  if (!code) return '';
  return `${origin}/register?ref=${code}`;
}

// Mirrors: stats: statsData || { totalReferrals: 0, totalCreditsEarned: 0 }
function getDefaultStats(): ReferralStats {
  return { totalReferrals: 0, totalCreditsEarned: 0 };
}

function resolveStats(statsData: ReferralStats | null | undefined): ReferralStats {
  return statsData || getDefaultStats();
}

// Mirrors: const code = codeData?.code || null;
function resolveCode(codeData: { code: string } | null | undefined): string | null {
  return codeData?.code || null;
}

// ---------------------------------------------------------------------------
// Tests: buildShareUrl
// ---------------------------------------------------------------------------

describe('buildShareUrl', () => {
  it('should build URL with referral code', () => {
    const url = buildShareUrl('ABC123');
    expect(url).toBe('https://tosmile.ai/register?ref=ABC123');
  });

  it('should return empty string when code is null', () => {
    const url = buildShareUrl(null);
    expect(url).toBe('');
  });

  it('should return empty string when code is empty string (falsy)', () => {
    const url = buildShareUrl('');
    expect(url).toBe('');
  });

  it('should use custom origin', () => {
    const url = buildShareUrl('XYZ', 'https://localhost:3000');
    expect(url).toBe('https://localhost:3000/register?ref=XYZ');
  });

  it('should preserve case in code', () => {
    const url = buildShareUrl('DrSilva2026');
    expect(url).toBe('https://tosmile.ai/register?ref=DrSilva2026');
  });

  it('should handle codes with special characters', () => {
    const url = buildShareUrl('DR-SILVA_99');
    expect(url).toBe('https://tosmile.ai/register?ref=DR-SILVA_99');
  });

  it('should contain the ref query parameter', () => {
    const url = buildShareUrl('TEST');
    expect(url).toContain('?ref=');
  });

  it('should end with the code value', () => {
    const url = buildShareUrl('MYCODE');
    expect(url).toMatch(/MYCODE$/);
  });
});

// ---------------------------------------------------------------------------
// Tests: getDefaultStats
// ---------------------------------------------------------------------------

describe('getDefaultStats', () => {
  it('should return zero totalReferrals', () => {
    const stats = getDefaultStats();
    expect(stats.totalReferrals).toBe(0);
  });

  it('should return zero totalCreditsEarned', () => {
    const stats = getDefaultStats();
    expect(stats.totalCreditsEarned).toBe(0);
  });

  it('should have exactly two keys', () => {
    const stats = getDefaultStats();
    expect(Object.keys(stats)).toHaveLength(2);
    expect(Object.keys(stats)).toEqual(['totalReferrals', 'totalCreditsEarned']);
  });

  it('should return a new object on each call', () => {
    const a = getDefaultStats();
    const b = getDefaultStats();
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // different references
  });
});

// ---------------------------------------------------------------------------
// Tests: resolveStats
// ---------------------------------------------------------------------------

describe('resolveStats', () => {
  it('should return provided stats when available', () => {
    const input: ReferralStats = { totalReferrals: 5, totalCreditsEarned: 25 };
    const stats = resolveStats(input);
    expect(stats.totalReferrals).toBe(5);
    expect(stats.totalCreditsEarned).toBe(25);
  });

  it('should return default stats when null', () => {
    const stats = resolveStats(null);
    expect(stats.totalReferrals).toBe(0);
    expect(stats.totalCreditsEarned).toBe(0);
  });

  it('should return default stats when undefined', () => {
    const stats = resolveStats(undefined);
    expect(stats.totalReferrals).toBe(0);
    expect(stats.totalCreditsEarned).toBe(0);
  });

  it('should handle stats with large numbers', () => {
    const input: ReferralStats = { totalReferrals: 999, totalCreditsEarned: 4995 };
    const stats = resolveStats(input);
    expect(stats.totalReferrals).toBe(999);
    expect(stats.totalCreditsEarned).toBe(4995);
  });

  it('should handle stats with zero values (truthy object)', () => {
    const input: ReferralStats = { totalReferrals: 0, totalCreditsEarned: 0 };
    const stats = resolveStats(input);
    // The object is truthy even if its values are zero
    expect(stats).toBe(input);
    expect(stats.totalReferrals).toBe(0);
  });

  it('should return the same reference when stats are provided', () => {
    const input: ReferralStats = { totalReferrals: 3, totalCreditsEarned: 15 };
    const stats = resolveStats(input);
    expect(stats).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Tests: resolveCode
// ---------------------------------------------------------------------------

describe('resolveCode', () => {
  it('should extract code from codeData', () => {
    const code = resolveCode({ code: 'ABC123' });
    expect(code).toBe('ABC123');
  });

  it('should return null when codeData is null', () => {
    const code = resolveCode(null);
    expect(code).toBeNull();
  });

  it('should return null when codeData is undefined', () => {
    const code = resolveCode(undefined);
    expect(code).toBeNull();
  });

  it('should return null when code is empty string', () => {
    const code = resolveCode({ code: '' });
    // '' || null -> null
    expect(code).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: integration of resolveCode + buildShareUrl
// ---------------------------------------------------------------------------

describe('code-to-URL pipeline', () => {
  it('should produce valid URL from codeData with code', () => {
    const code = resolveCode({ code: 'DrSilva' });
    const url = buildShareUrl(code);
    expect(url).toBe('https://tosmile.ai/register?ref=DrSilva');
  });

  it('should produce empty URL from null codeData', () => {
    const code = resolveCode(null);
    const url = buildShareUrl(code);
    expect(url).toBe('');
  });

  it('should produce empty URL from undefined codeData', () => {
    const code = resolveCode(undefined);
    const url = buildShareUrl(code);
    expect(url).toBe('');
  });

  it('should produce empty URL when code is empty string', () => {
    const code = resolveCode({ code: '' });
    const url = buildShareUrl(code);
    expect(url).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Tests: stats + code combined (mirrors hook return shape)
// ---------------------------------------------------------------------------

describe('hook return shape computation', () => {
  function computeReturn(
    codeData: { code: string } | null,
    statsData: ReferralStats | null,
    loadingCode: boolean,
    loadingStats: boolean,
  ) {
    const code = resolveCode(codeData);
    return {
      code,
      stats: resolveStats(statsData),
      isLoading: loadingCode || loadingStats,
      shareUrl: buildShareUrl(code),
    };
  }

  it('should compute loading state while code is loading', () => {
    const result = computeReturn(null, null, true, false);
    expect(result.isLoading).toBe(true);
  });

  it('should compute loading state while stats is loading', () => {
    const result = computeReturn(null, null, false, true);
    expect(result.isLoading).toBe(true);
  });

  it('should not be loading when both queries are done', () => {
    const result = computeReturn({ code: 'ABC' }, { totalReferrals: 1, totalCreditsEarned: 5 }, false, false);
    expect(result.isLoading).toBe(false);
  });

  it('should include all fields when fully loaded', () => {
    const result = computeReturn(
      { code: 'DrMaria' },
      { totalReferrals: 10, totalCreditsEarned: 50 },
      false,
      false,
    );
    expect(result.code).toBe('DrMaria');
    expect(result.stats.totalReferrals).toBe(10);
    expect(result.stats.totalCreditsEarned).toBe(50);
    expect(result.isLoading).toBe(false);
    expect(result.shareUrl).toBe('https://tosmile.ai/register?ref=DrMaria');
  });

  it('should use defaults when user has no code and no stats', () => {
    const result = computeReturn(null, null, false, false);
    expect(result.code).toBeNull();
    expect(result.stats.totalReferrals).toBe(0);
    expect(result.stats.totalCreditsEarned).toBe(0);
    expect(result.shareUrl).toBe('');
    expect(result.isLoading).toBe(false);
  });
});
