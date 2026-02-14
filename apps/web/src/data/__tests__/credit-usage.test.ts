import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listByUserId, getMonthlyStats } from '../credit-usage';

// ---------------------------------------------------------------------------
// Mock supabase client — uses a builder pattern where every method returns
// the same builder, and the terminal result is controlled by `terminalResult`.
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: [], error: null };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

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
  builder.order = chainMethod(mockOrder);
  builder.gte = chainMethod(mockGte);
  builder.lte = chainMethod(mockLte);
  builder.range = (...args: unknown[]) => {
    mockRange(...args);
    return builder;
  };
  // Terminal: allow builder to be thenable so withQuery / direct await can resolve
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve, reject);
  };

  return builder;
}

vi.mock('../client', () => ({
  supabase: {
    from: () => createBuilder(),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: [], error: null };
});

describe('creditUsage.listByUserId', () => {
  it('should return credit usage records for a user', async () => {
    const records = [
      {
        id: 'cu-1',
        operation: 'case_analysis',
        credits_used: 1,
        reference_id: 'eval-1',
        created_at: '2026-02-14T10:00:00Z',
      },
      {
        id: 'cu-2',
        operation: 'dsd_simulation',
        credits_used: 2,
        reference_id: 'eval-2',
        created_at: '2026-02-13T15:30:00Z',
      },
    ];
    terminalResult = { data: records, error: null };

    const result = await listByUserId('user-1');

    expect(result).toEqual(records);
    expect(mockSelect).toHaveBeenCalledWith(
      'id, operation, credits_used, reference_id, created_at',
    );
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await listByUserId('user-1');

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Credit usage fetch error') };

    await expect(listByUserId('user-1')).rejects.toThrow('Credit usage fetch error');
  });

  it('should use default limit of 50 and offset of 0', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1');

    // range(0, 49) for limit=50, offset=0
    expect(mockRange).toHaveBeenCalledWith(0, 49);
  });

  it('should apply custom limit and offset', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1', { limit: 10, offset: 20 });

    // range(20, 29) for limit=10, offset=20
    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });

  it('should apply dateFrom filter when provided', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1', { dateFrom: '2026-02-01T00:00:00Z' });

    expect(mockGte).toHaveBeenCalledWith('created_at', '2026-02-01T00:00:00Z');
  });

  it('should apply dateTo filter when provided', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1', { dateTo: '2026-02-28T23:59:59Z' });

    expect(mockLte).toHaveBeenCalledWith('created_at', '2026-02-28T23:59:59Z');
  });

  it('should apply both dateFrom and dateTo when provided', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1', {
      dateFrom: '2026-02-01T00:00:00Z',
      dateTo: '2026-02-28T23:59:59Z',
    });

    expect(mockGte).toHaveBeenCalledWith('created_at', '2026-02-01T00:00:00Z');
    expect(mockLte).toHaveBeenCalledWith('created_at', '2026-02-28T23:59:59Z');
  });

  it('should not apply date filters when not provided', async () => {
    terminalResult = { data: [], error: null };

    await listByUserId('user-1', { limit: 10 });

    expect(mockGte).not.toHaveBeenCalled();
    expect(mockLte).not.toHaveBeenCalled();
  });
});

describe('creditUsage.getMonthlyStats', () => {
  it('should aggregate usage by operation for the current month', async () => {
    const rawRows = [
      { operation: 'case_analysis', credits_used: 1 },
      { operation: 'case_analysis', credits_used: 1 },
      { operation: 'dsd_simulation', credits_used: 2 },
      { operation: 'case_analysis', credits_used: 1 },
      { operation: 'dsd_simulation', credits_used: 2 },
    ];
    terminalResult = { data: rawRows, error: null };

    const result = await getMonthlyStats('user-1');

    expect(result).toEqual([
      { operation: 'case_analysis', total_credits: 3, count: 3 },
      { operation: 'dsd_simulation', total_credits: 4, count: 2 },
    ]);
  });

  it('should return empty array when no usage data', async () => {
    terminalResult = { data: [], error: null };

    const result = await getMonthlyStats('user-1');

    expect(result).toEqual([]);
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getMonthlyStats('user-1');

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Monthly stats error') };

    await expect(getMonthlyStats('user-1')).rejects.toThrow('Monthly stats error');
  });

  it('should query with user_id and first-of-month date filter', async () => {
    terminalResult = { data: [], error: null };

    await getMonthlyStats('user-1');

    expect(mockSelect).toHaveBeenCalledWith('operation, credits_used');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockGte).toHaveBeenCalledWith(
      'created_at',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });

  it('should handle a single operation', async () => {
    const rawRows = [{ operation: 'photo_analysis', credits_used: 3 }];
    terminalResult = { data: rawRows, error: null };

    const result = await getMonthlyStats('user-1');

    expect(result).toEqual([
      { operation: 'photo_analysis', total_credits: 3, count: 1 },
    ]);
  });
});
