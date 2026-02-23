import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  list,
  getById,
  getEvaluationStats,
  listSessions,
  update,
  listAll,
  countByUserId,
} from '../patients';

// ---------------------------------------------------------------------------
// Mock supabase client — uses a builder pattern where every method returns
// the same builder, and the terminal result is controlled by `terminalResult`.
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: [], error: null, count: 0 };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

// A builder object where every chaining method returns itself,
// and terminal methods resolve with terminalResult.
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
  builder.in = chainMethod(mockIn);
  builder.limit = chainMethod(vi.fn());
  builder.order = chainMethod(mockOrder);
  builder.range = (...args: unknown[]) => {
    mockRange(...args);
    return terminalResult;
  };
  builder.maybeSingle = () => {
    mockMaybeSingle();
    return terminalResult;
  };
  builder.update = (...args: unknown[]) => {
    mockUpdate(...args);
    return builder;
  };
  // Allow builder itself to be thenable (for cases where the chain ends without terminal)
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
  terminalResult = { data: [], error: null, count: 0 };
});

describe('patients.list', () => {
  it('should return rows and count on success', async () => {
    const mockData = [{ id: '1', name: 'João' }];
    terminalResult = { data: mockData, error: null, count: 1 };

    const result = await list({ userId: 'user-1', page: 0, pageSize: 20 });

    expect(result).toEqual({ rows: mockData, count: 1 });
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null, count: null };

    const result = await list({ userId: 'user-1' });

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('DB error'), count: null };

    await expect(list({ userId: 'user-1' })).rejects.toThrow('DB error');
  });

  it('should use default page and pageSize', async () => {
    terminalResult = { data: [], error: null, count: 0 };

    await list({ userId: 'user-1' });

    expect(mockRange).toHaveBeenCalledWith(0, 19);
  });

  it('should calculate range correctly for page > 0', async () => {
    terminalResult = { data: [], error: null, count: 0 };

    await list({ userId: 'user-1', page: 2, pageSize: 10 });

    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });
});

describe('patients.getById', () => {
  it('should return patient when found', async () => {
    const patient = { id: 'p1', name: 'Maria' };
    terminalResult = { data: patient, error: null };

    const result = await getById('p1', 'user-1');

    expect(result).toEqual(patient);
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it('should return null when not found', async () => {
    terminalResult = { data: null, error: null };

    const result = await getById('nonexistent', 'user-1');

    expect(result).toBeNull();
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Not found') };

    await expect(getById('p1', 'user-1')).rejects.toThrow('Not found');
  });
});

describe('patients.getEvaluationStats', () => {
  it('should return evaluation stats for given patient IDs', async () => {
    const stats = [
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01' },
    ];
    terminalResult = { data: stats, error: null };

    const result = await getEvaluationStats('user-1', ['p1', 'p2']);

    expect(result).toEqual(stats);
    expect(mockIn).toHaveBeenCalledWith('patient_id', ['p1', 'p2']);
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getEvaluationStats('user-1', ['p1']);

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Stats error') };

    await expect(getEvaluationStats('user-1', ['p1'])).rejects.toThrow('Stats error');
  });
});

describe('patients.listSessions', () => {
  it('should return session rows and count', async () => {
    const sessions = [{ session_id: 's1', tooth: '11', status: 'draft', created_at: '2025-01-01' }];
    terminalResult = { data: sessions, error: null, count: 1 };

    const result = await listSessions('p1', 'user-1', 0, 20);

    expect(result).toEqual({ rows: sessions, count: 1 });
  });

  it('should return empty when no data', async () => {
    terminalResult = { data: null, error: null, count: null };

    const result = await listSessions('p1', 'user-1');

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Sessions error'), count: null };

    await expect(listSessions('p1', 'user-1')).rejects.toThrow('Sessions error');
  });
});

describe('patients.update', () => {
  it('should update patient without throwing on success', async () => {
    terminalResult = { error: null };

    await expect(update('p1', { name: 'Updated' })).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated' });
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Update failed') };

    await expect(update('p1', { name: 'Test' })).rejects.toThrow('Update failed');
  });
});

describe('patients.listAll', () => {
  it('should return all patients for a user', async () => {
    const patients = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    terminalResult = { data: patients, error: null };

    const result = await listAll('user-1');

    expect(result).toEqual(patients);
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await listAll('user-1');

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('List error') };

    await expect(listAll('user-1')).rejects.toThrow('List error');
  });
});

describe('patients.countByUserId', () => {
  it('should return count', async () => {
    terminalResult = { count: 42, error: null };

    const result = await countByUserId('user-1');

    expect(result).toBe(42);
  });

  it('should return 0 when count is null', async () => {
    terminalResult = { count: null, error: null };

    const result = await countByUserId('user-1');

    expect(result).toBe(0);
  });

  it('should throw on error', async () => {
    terminalResult = { count: null, error: new Error('Count error') };

    await expect(countByUserId('user-1')).rejects.toThrow('Count error');
  });
});
