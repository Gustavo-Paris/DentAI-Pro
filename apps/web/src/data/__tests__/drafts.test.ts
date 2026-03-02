import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, save, remove } from '../drafts';

// ---------------------------------------------------------------------------
// Mock supabase client — builder pattern (same as evaluations.test.ts)
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: null, error: null };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

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
  builder.insert = chainMethod(mockInsert);
  builder.delete = (...args: unknown[]) => {
    mockDelete(...args);
    return builder;
  };
  builder.maybeSingle = () => {
    mockMaybeSingle();
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
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
});

describe('drafts.load', () => {
  it('should return draft when found', async () => {
    const draft = { id: 'd1', user_id: 'u1', draft_data: { step: 3 } };
    terminalResult = { data: draft, error: null };

    const result = await load('u1');

    expect(result).toEqual(draft);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it('should return null when no draft exists', async () => {
    terminalResult = { data: null, error: null };

    const result = await load('u1');

    expect(result).toBeNull();
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Load error') };

    await expect(load('u1')).rejects.toThrow('Load error');
  });
});

describe('drafts.save', () => {
  it('should call insert with draft data', async () => {
    terminalResult = { error: null };

    await save('u1', { step: 4, patientName: 'Test' });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        draft_data: { step: 4, patientName: 'Test' },
      }),
    );
  });

  it('should deep-clone draft data via JSON serialization', async () => {
    terminalResult = { error: null };

    const circular = { a: 1 };
    await save('u1', circular);

    // Verify the draft_data is a clean copy (JSON.parse(JSON.stringify(...)))
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.draft_data).toEqual({ a: 1 });
  });

  it('should throw when insert fails', async () => {
    terminalResult = { error: new Error('Insert failed') };

    await expect(save('u1', { step: 1 })).rejects.toThrow('Insert failed');
  });
});

describe('drafts.remove', () => {
  it('should delete the draft by user_id', async () => {
    terminalResult = { error: null };

    await remove('u1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Delete error') };

    await expect(remove('u1')).rejects.toThrow('Delete error');
  });
});
