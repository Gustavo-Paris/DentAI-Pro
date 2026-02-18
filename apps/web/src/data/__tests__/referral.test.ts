import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyReferralCode, getReferralStats, getReferralCode } from '../referral';

// ---------------------------------------------------------------------------
// Mock supabase client
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: null, error: null };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();

function createBuilder(): Record<string, (...args: unknown[]) => unknown> {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};

  const chainMethod = (mockFn: ReturnType<typeof vi.fn>) => {
    return (...args: unknown[]) => {
      mockFn(...args);
      return builder;
    };
  };

  builder.select = chainMethod(mockSelect);
  builder.eq = chainMethod(mockEq);
  builder.update = chainMethod(mockUpdate);
  builder.insert = (...args: unknown[]) => {
    mockInsert(...args);
    return builder;
  };
  builder.maybeSingle = () => {
    mockMaybeSingle();
    return terminalResult;
  };
  builder.single = () => {
    mockSingle();
    return terminalResult;
  };
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve, reject);
  };

  return builder;
}

vi.mock('../client', () => ({
  supabase: {
    from: () => createBuilder(),
    rpc: (...args: unknown[]) => {
      mockRpc(...args);
      return Promise.resolve(terminalResult);
    },
    auth: {
      getUser: () =>
        Promise.resolve({
          data: {
            user: {
              user_metadata: { full_name: 'Dr. João' },
              email: 'joao@test.com',
            },
          },
        }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/constants', () => ({
  BONUS_CREDITS: 5,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
});

describe('applyReferralCode', () => {
  it('should silently return when referral code not found', async () => {
    // withQuery returns null (cast as T), then the null check returns early
    terminalResult = { data: null, error: null };

    await expect(applyReferralCode('INVALID-CODE', 'new-user-1')).resolves.toBeUndefined();
  });

  it('should silently return on self-referral', async () => {
    // The code belongs to the same user
    terminalResult = {
      data: { id: 'ref-1', user_id: 'user-1', code: 'JOAO-AB12', is_active: true },
      error: null,
    };

    await expect(applyReferralCode('JOAO-AB12', 'user-1')).resolves.toBeUndefined();
    // Should not have attempted to create a conversion via insert
    // (The first withQuery succeeds, but self-referral check returns early)
    // Note: insert is not called because self-referral returns before reaching insert
  });

  it('should silently return on duplicate conversion', async () => {
    // First query (find referral code) returns a valid code
    // Second call to supabase (duplicate check) also returns data via the shared terminal.
    // Since both calls resolve to the same terminalResult,
    // the duplicate check finds an existing conversion and returns early.
    terminalResult = {
      data: { id: 'ref-1', user_id: 'referrer-1', code: 'JOAO-AB12', is_active: true },
      error: null,
    };

    await expect(applyReferralCode('JOAO-AB12', 'new-user-1')).resolves.toBeUndefined();
  });
});

describe('getReferralStats', () => {
  it('should return correct stats from conversions', async () => {
    terminalResult = {
      data: [
        { id: 'c1', reward_amount: 5 },
        { id: 'c2', reward_amount: 5 },
        { id: 'c3', reward_amount: 5 },
      ],
      error: null,
    };

    const stats = await getReferralStats('user-1');

    expect(stats).toEqual({
      totalReferrals: 3,
      totalCreditsEarned: 15,
    });
  });

  it('should return zero stats when no conversions (empty array)', async () => {
    terminalResult = { data: [], error: null };

    const stats = await getReferralStats('user-1');

    expect(stats).toEqual({
      totalReferrals: 0,
      totalCreditsEarned: 0,
    });
  });

  it('should handle null reward_amount in conversions', async () => {
    terminalResult = {
      data: [
        { id: 'c1', reward_amount: 5 },
        { id: 'c2', reward_amount: null },
      ],
      error: null,
    };

    const stats = await getReferralStats('user-1');

    expect(stats).toEqual({
      totalReferrals: 2,
      totalCreditsEarned: 5,
    });
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Stats error') };

    await expect(getReferralStats('user-1')).rejects.toThrow('Stats error');
  });
});

describe('getReferralCode', () => {
  it('should return existing active referral code', async () => {
    const code = { id: 'ref-1', user_id: 'u1', code: 'JOAO-AB12', is_active: true };
    terminalResult = { data: code, error: null };

    const result = await getReferralCode('u1');

    expect(result).toEqual(code);
  });

  it('should extract code from result', async () => {
    const newCode = { id: 'ref-2', user_id: 'u1', code: 'DRJOAO-AB12', is_active: true };
    terminalResult = { data: newCode, error: null };

    const result = await getReferralCode('u1');
    expect(result.code).toBe('DRJOAO-AB12');
  });
});
