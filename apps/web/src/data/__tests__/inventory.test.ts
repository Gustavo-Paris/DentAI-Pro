import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  list,
  getCatalog,
  countByUserId,
  addItems,
  removeItem,
} from '../inventory';

// ---------------------------------------------------------------------------
// Mock supabase client — builder pattern
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: [], error: null, count: 0 };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
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
  builder.order = chainMethod(mockOrder);
  builder.insert = (...args: unknown[]) => {
    mockInsert(...args);
    return terminalResult;
  };
  builder.delete = () => {
    mockDelete();
    return builder;
  };
  builder.range = (...args: unknown[]) => {
    mockRange(...args);
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
  terminalResult = { data: [], error: null, count: 0 };
});

describe('inventory.list', () => {
  it('should return items and count', async () => {
    const mockData = [{ id: '1', resin_id: 'r1', resin: { brand: 'Tokuyama' } }];
    terminalResult = { data: mockData, error: null, count: 1 };

    const result = await list({ userId: 'user-1' });

    expect(result).toEqual({ items: mockData, count: 1 });
  });

  it('should return empty items when data is null', async () => {
    terminalResult = { data: null, error: null, count: null };

    const result = await list({ userId: 'user-1' });

    expect(result).toEqual({ items: [], count: 0 });
  });

  it('should use default pageSize of 30', async () => {
    terminalResult = { data: [], error: null, count: 0 };

    await list({ userId: 'user-1' });

    expect(mockRange).toHaveBeenCalledWith(0, 29);
  });

  it('should calculate range for page > 0', async () => {
    terminalResult = { data: [], error: null, count: 0 };

    await list({ userId: 'user-1', page: 1, pageSize: 10 });

    expect(mockRange).toHaveBeenCalledWith(10, 19);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Inventory error'), count: null };

    await expect(list({ userId: 'user-1' })).rejects.toThrow('Inventory error');
  });
});

describe('inventory.getCatalog', () => {
  it('should return catalog resins sorted', async () => {
    const catalog = [
      { id: 'r1', brand: 'A', product_line: 'X', shade: 'A1', type: 'enamel', opacity: 'low' },
    ];
    terminalResult = { data: catalog, error: null };

    const result = await getCatalog();

    expect(result).toEqual(catalog);
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getCatalog();

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Catalog error') };

    await expect(getCatalog()).rejects.toThrow('Catalog error');
  });
});

describe('inventory.countByUserId', () => {
  it('should return count', async () => {
    terminalResult = { count: 10, error: null };

    const result = await countByUserId('user-1');

    expect(result).toBe(10);
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

describe('inventory.addItems', () => {
  it('should insert inventory items for the user', async () => {
    terminalResult = { error: null };

    await addItems('user-1', ['r1', 'r2']);

    expect(mockInsert).toHaveBeenCalledWith([
      { user_id: 'user-1', resin_id: 'r1' },
      { user_id: 'user-1', resin_id: 'r2' },
    ]);
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Insert error') };

    await expect(addItems('user-1', ['r1'])).rejects.toThrow('Insert error');
  });

  it('should handle single item', async () => {
    terminalResult = { error: null };

    await addItems('user-1', ['r1']);

    expect(mockInsert).toHaveBeenCalledWith([
      { user_id: 'user-1', resin_id: 'r1' },
    ]);
  });
});

describe('inventory.removeItem', () => {
  it('should delete inventory item by id', async () => {
    terminalResult = { error: null };

    await expect(removeItem('item-1')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'item-1');
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Delete error') };

    await expect(removeItem('item-1')).rejects.toThrow('Delete error');
  });
});
