import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContralateralTooth, warmupEdgeFunctions } from '../wizard';

const mockInvoke = vi.fn();

vi.mock('../client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => ({ data: null, error: null }) }),
          not: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        download: () => Promise.resolve({ data: null }),
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), log: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockRejectedValue(new Error('warmup expected'));
});

describe('getContralateralTooth', () => {
  it('should swap quadrant 1 to 2', () => {
    expect(getContralateralTooth('11')).toBe('21');
    expect(getContralateralTooth('13')).toBe('23');
    expect(getContralateralTooth('15')).toBe('25');
  });

  it('should swap quadrant 2 to 1', () => {
    expect(getContralateralTooth('21')).toBe('11');
    expect(getContralateralTooth('24')).toBe('14');
  });

  it('should swap quadrant 3 to 4', () => {
    expect(getContralateralTooth('31')).toBe('41');
    expect(getContralateralTooth('36')).toBe('46');
  });

  it('should swap quadrant 4 to 3', () => {
    expect(getContralateralTooth('41')).toBe('31');
    expect(getContralateralTooth('47')).toBe('37');
  });

  it('should swap quadrant 5 to 6 (deciduous)', () => {
    expect(getContralateralTooth('51')).toBe('61');
  });

  it('should swap quadrant 6 to 5 (deciduous)', () => {
    expect(getContralateralTooth('65')).toBe('55');
  });

  it('should swap quadrant 7 to 8', () => {
    expect(getContralateralTooth('71')).toBe('81');
  });

  it('should swap quadrant 8 to 7', () => {
    expect(getContralateralTooth('85')).toBe('75');
  });

  it('should return null for invalid tooth length', () => {
    expect(getContralateralTooth('1')).toBeNull();
    expect(getContralateralTooth('111')).toBeNull();
    expect(getContralateralTooth('')).toBeNull();
  });

  it('should return null for invalid quadrant', () => {
    expect(getContralateralTooth('91')).toBeNull();
    expect(getContralateralTooth('01')).toBeNull();
  });
});

describe('warmupEdgeFunctions', () => {
  it('should invoke recommend-resin and recommend-cementation', () => {
    warmupEdgeFunctions();

    expect(mockInvoke).toHaveBeenCalledWith('recommend-resin', { body: {} });
    expect(mockInvoke).toHaveBeenCalledWith('recommend-cementation', { body: {} });
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('should not throw when invocations fail', () => {
    mockInvoke.mockRejectedValue(new Error('warmup expected'));

    expect(() => warmupEdgeFunctions()).not.toThrow();
  });
});
