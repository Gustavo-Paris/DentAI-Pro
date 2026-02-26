import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDashboardMetrics,
  getDashboardInsights,
  updateEvaluationsBulk,
  updateChecklistBulk,
  checkSharedLinkStatus,
  insertEvaluation,
  updateEvaluation,
  deletePendingTeeth,
  deleteSession,
  invokeEdgeFunction,
} from '../evaluations';

// =============================================================================
// Mock supabase client — builder pattern (same pattern as evaluations.test.ts)
// =============================================================================

let terminalResult: unknown = { data: [], error: null, count: 0 };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockGte = vi.fn();
const mockGt = vi.fn();
const mockIn = vi.fn();
const mockNot = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockRpc = vi.fn();
const mockInvoke = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageList = vi.fn();

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
  builder.neq = chainMethod(mockNeq);
  builder.gte = chainMethod(mockGte);
  builder.gt = chainMethod(mockGt);
  builder.in = chainMethod(mockIn);
  builder.not = chainMethod(mockNot);
  builder.order = chainMethod(mockOrder);
  builder.update = chainMethod(mockUpdate);
  builder.insert = chainMethod(mockInsert);
  builder.delete = (...args: unknown[]) => {
    mockDelete(...args);
    return builder;
  };
  builder.range = (...args: unknown[]) => {
    mockRange(...args);
    return terminalResult;
  };
  builder.limit = (...args: unknown[]) => {
    mockLimit(...args);
    return terminalResult;
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
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    storage: {
      from: () => ({
        remove: (...args: unknown[]) => mockStorageRemove(...args),
        list: (...args: unknown[]) => mockStorageList(...args),
      }),
    },
  },
}));

// Mock date-fns for deterministic dates
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual,
    // Let startOfWeek and subDays work normally — they produce deterministic results
  };
});

// =============================================================================
// Tests
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: [], error: null, count: 0 };
});

// ---------------------------------------------------------------------------
// getDashboardMetrics
// ---------------------------------------------------------------------------

describe('getDashboardMetrics', () => {
  it('should compute session metrics from evaluation data', async () => {
    // Simulate 3 evaluations across 2 sessions:
    //   session "s1" with 2 evaluations (one completed, one not) => pending
    //   session "s2" with 1 evaluation (completed) => completed
    //
    // Since all three Promise.allSettled calls return terminalResult,
    // we must set a result that works for all three.
    terminalResult = {
      data: [
        { session_id: 's1', status: 'completed' },
        { session_id: 's1', status: 'draft' },
        { session_id: 's2', status: 'completed' },
      ],
      error: null,
      count: 1,
    };

    const result = await getDashboardMetrics({ userId: 'user-1' });

    // The function computes:
    // - pendingSessionCount: sessions where not all evals are completed
    // - weeklySessionCount: unique session_ids in weekly data
    // - completionRate: (completed sessions / total sessions) * 100
    // - pendingTeethCount: from the count query
    expect(result).toHaveProperty('pendingSessionCount');
    expect(result).toHaveProperty('weeklySessionCount');
    expect(result).toHaveProperty('completionRate');
    expect(result).toHaveProperty('pendingTeethCount');
    expect(typeof result.pendingSessionCount).toBe('number');
    expect(typeof result.completionRate).toBe('number');
  });

  it('should return zeros when no evaluations exist', async () => {
    terminalResult = { data: [], error: null, count: 0 };

    const result = await getDashboardMetrics({ userId: 'user-empty' });

    expect(result.pendingSessionCount).toBe(0);
    expect(result.weeklySessionCount).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.pendingTeethCount).toBe(0);
  });

  it('should handle failed queries gracefully via Promise.allSettled', async () => {
    // When all queries reject, the function uses fallback values
    terminalResult = { data: null, error: new Error('DB error'), count: null };

    const result = await getDashboardMetrics({ userId: 'user-1' });

    // Should not throw — uses Promise.allSettled
    expect(result).toHaveProperty('pendingSessionCount');
    expect(result).toHaveProperty('completionRate');
  });

  it('should compute 100% completion when all sessions are complete', async () => {
    terminalResult = {
      data: [
        { session_id: 's1', status: 'completed' },
        { session_id: 's2', status: 'completed' },
      ],
      error: null,
      count: 0,
    };

    const result = await getDashboardMetrics({ userId: 'user-1' });

    expect(result.completionRate).toBe(100);
    expect(result.pendingSessionCount).toBe(0);
  });

  it('should use evaluation id as session fallback for legacy rows', async () => {
    terminalResult = {
      data: [
        { id: 'legacy-1', session_id: null, status: 'completed' },
        { id: 'legacy-2', session_id: null, status: 'draft' },
      ],
      error: null,
      count: 1,
    };

    const result = await getDashboardMetrics({ userId: 'user-1' });

    // Each row with null session_id becomes its own session
    // 2 total sessions: legacy-1 (completed), legacy-2 (pending)
    expect(result.completionRate).toBe(50);
    expect(result.pendingSessionCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getDashboardInsights
// ---------------------------------------------------------------------------

describe('getDashboardInsights', () => {
  it('should return insight data', async () => {
    const data = [
      { id: 'e1', created_at: '2026-02-20', treatment_type: 'resina', resins: { name: 'Z350' } },
    ];
    terminalResult = { data, error: null };

    const result = await getDashboardInsights({ userId: 'user-1' });
    expect(result).toEqual(data);
  });

  it('should return empty array when no data', async () => {
    terminalResult = { data: null, error: null };

    const result = await getDashboardInsights({ userId: 'user-1' });
    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Insights error') };

    await expect(getDashboardInsights({ userId: 'user-1' })).rejects.toThrow('Insights error');
  });

  it('should accept custom weeksBack parameter', async () => {
    terminalResult = { data: [], error: null };

    await getDashboardInsights({ userId: 'user-1', weeksBack: 4 });

    // Should call gte with a date approximately 28 days in the past
    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String));
  });
});

// ---------------------------------------------------------------------------
// updateEvaluationsBulk
// ---------------------------------------------------------------------------

describe('updateEvaluationsBulk', () => {
  it('should update multiple evaluations', async () => {
    terminalResult = { error: null };

    await updateEvaluationsBulk(['e1', 'e2'], { budget: 'premium' });

    expect(mockUpdate).toHaveBeenCalledWith({ budget: 'premium' });
    expect(mockIn).toHaveBeenCalledWith('id', ['e1', 'e2']);
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Bulk update error') };

    await expect(
      updateEvaluationsBulk(['e1'], { budget: 'standard' }),
    ).rejects.toThrow('Bulk update error');
  });
});

// ---------------------------------------------------------------------------
// updateChecklistBulk
// ---------------------------------------------------------------------------

describe('updateChecklistBulk', () => {
  it('should update checklist progress for multiple evaluations', async () => {
    terminalResult = { error: null };

    await updateChecklistBulk(['e1', 'e2'], 'user-1', [0, 2, 4]);

    expect(mockUpdate).toHaveBeenCalledWith({ checklist_progress: [0, 2, 4] });
    expect(mockIn).toHaveBeenCalledWith('id', ['e1', 'e2']);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Checklist error') };

    await expect(
      updateChecklistBulk(['e1'], 'user-1', [1]),
    ).rejects.toThrow('Checklist error');
  });
});

// ---------------------------------------------------------------------------
// checkSharedLinkStatus
// ---------------------------------------------------------------------------

describe('checkSharedLinkStatus', () => {
  it('should return valid status', async () => {
    terminalResult = { data: 'valid', error: null };

    const result = await checkSharedLinkStatus('token-abc');
    expect(result).toBe('valid');
  });

  it('should return expired status', async () => {
    terminalResult = { data: 'expired', error: null };

    const result = await checkSharedLinkStatus('token-old');
    expect(result).toBe('expired');
  });

  it('should return not_found when RPC errors (graceful degradation)', async () => {
    terminalResult = { data: null, error: new Error('RPC not deployed') };

    const result = await checkSharedLinkStatus('token-bad');
    expect(result).toBe('not_found');
  });

  it('should return not_found when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await checkSharedLinkStatus('token-null');
    expect(result).toBe('not_found');
  });
});

// ---------------------------------------------------------------------------
// insertEvaluation
// ---------------------------------------------------------------------------

describe('insertEvaluation', () => {
  it('should insert and return the created evaluation', async () => {
    const created = { id: 'new-eval', tooth: '11' };
    terminalResult = { data: created, error: null };

    const result = await insertEvaluation({ tooth: '11', user_id: 'u1' } as never);
    expect(result).toEqual(created);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Insert error') };

    await expect(
      insertEvaluation({ tooth: '11' } as never),
    ).rejects.toThrow('Insert error');
  });
});

// ---------------------------------------------------------------------------
// updateEvaluation
// ---------------------------------------------------------------------------

describe('updateEvaluation', () => {
  it('should update evaluation fields', async () => {
    terminalResult = { error: null };

    await updateEvaluation('eval-1', { status: 'completed' } as never);

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
    expect(mockEq).toHaveBeenCalledWith('id', 'eval-1');
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Update eval error') };

    await expect(
      updateEvaluation('eval-1', { status: 'draft' } as never),
    ).rejects.toThrow('Update eval error');
  });
});

// ---------------------------------------------------------------------------
// deletePendingTeeth
// ---------------------------------------------------------------------------

describe('deletePendingTeeth', () => {
  it('should delete specified teeth from session_detected_teeth', async () => {
    terminalResult = { error: null };

    await deletePendingTeeth('session-1', ['11', '12', '21']);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('session_id', 'session-1');
    expect(mockIn).toHaveBeenCalledWith('tooth', ['11', '12', '21']);
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Delete teeth error') };

    await expect(
      deletePendingTeeth('s1', ['11']),
    ).rejects.toThrow('Delete teeth error');
  });
});

// ---------------------------------------------------------------------------
// invokeEdgeFunction
// ---------------------------------------------------------------------------

describe('invokeEdgeFunction', () => {
  it('should invoke edge function successfully', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    await invokeEdgeFunction('recommend-resin', { tooth: '11' });

    expect(mockInvoke).toHaveBeenCalledWith('recommend-resin', {
      body: { tooth: '11' },
    });
  });

  it('should throw the original error when no context available', async () => {
    const edgeError = new Error('Function timeout');
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('recommend-resin', { tooth: '11' }),
    ).rejects.toThrow('Function timeout');
  });

  it('should extract server message from FunctionsHttpError context', async () => {
    const contextJson = vi.fn().mockResolvedValue({
      error: 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS',
    });
    const edgeError = Object.assign(new Error('FunctionsHttpError'), {
      context: {
        json: contextJson,
        status: 402,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('recommend-resin', {}),
    ).rejects.toThrow('Insufficient credits');
  });

  it('should attach code and status from server error body', async () => {
    const contextJson = vi.fn().mockResolvedValue({
      error: 'Rate limited',
      code: 'RATE_LIMITED',
    });
    const edgeError = Object.assign(new Error('FunctionsHttpError'), {
      context: {
        json: contextJson,
        status: 429,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    try {
      await invokeEdgeFunction('test-fn', {});
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as Error & { code?: string; status?: number };
      expect(error.message).toBe('Rate limited');
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.status).toBe(429);
    }
  });

  it('should fall back to original error when context.json fails', async () => {
    const contextJson = vi.fn().mockRejectedValue(new Error('Parse failed'));
    const edgeError = Object.assign(new Error('Original edge error'), {
      context: {
        json: contextJson,
        status: 500,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('test-fn', {}),
    ).rejects.toThrow('Original edge error');
  });

  it('should fall back to original error when context has no message', async () => {
    const contextJson = vi.fn().mockResolvedValue({ some: 'data' });
    const edgeError = Object.assign(new Error('Original error'), {
      context: {
        json: contextJson,
        status: 500,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('test-fn', {}),
    ).rejects.toThrow('Original error');
  });

  it('should use message field from error body when code is present', async () => {
    const contextJson = vi.fn().mockResolvedValue({
      message: 'Server unavailable',
      code: 'SERVICE_UNAVAILABLE',
    });
    const edgeError = Object.assign(new Error('FunctionsHttpError'), {
      context: {
        json: contextJson,
        status: 503,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('test-fn', {}),
    ).rejects.toThrow('Server unavailable');
  });

  it('should fall back to original error when body has message but no code', async () => {
    // When the enriched error has no .code, the catch block does not re-throw it,
    // so the original error is thrown instead. This is by design.
    const contextJson = vi.fn().mockResolvedValue({
      message: 'Server unavailable',
    });
    const edgeError = Object.assign(new Error('FunctionsHttpError'), {
      context: {
        json: contextJson,
        status: 503,
      },
    });
    mockInvoke.mockResolvedValue({ error: edgeError });

    await expect(
      invokeEdgeFunction('test-fn', {}),
    ).rejects.toThrow('FunctionsHttpError');
  });
});

// ---------------------------------------------------------------------------
// deleteSession (complex: fetches photos, deletes evals, cleans storage)
// ---------------------------------------------------------------------------

describe('deleteSession', () => {
  it('should delete evaluations for the session', async () => {
    // The first query (select photos) returns empty, so no storage cleanup
    terminalResult = { data: [], error: null };

    await deleteSession('session-1', 'user-1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('session_id', 'session-1');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('should handle deletion when no evaluations exist', async () => {
    terminalResult = { data: null, error: null };

    // Should not throw
    await deleteSession('session-empty', 'user-1');
  });

  it('should throw when evaluation deletion fails', async () => {
    terminalResult = { data: [], error: new Error('Delete failed') };

    await expect(
      deleteSession('s1', 'user-1'),
    ).rejects.toThrow('Delete failed');
  });
});
