import { describe, it, expect } from 'vitest';
import { countByField } from '../countByField';

describe('countByField', () => {
  const items = [
    { id: 1, status: 'published' },
    { id: 2, status: 'draft' },
    { id: 3, status: 'published' },
    { id: 4, status: 'archived' },
    { id: 5, status: 'published' },
  ];

  it('counts all values of a field', () => {
    const result = countByField(items, 'status');

    expect(result).toEqual({
      published: 3,
      draft: 1,
      archived: 1,
      total: 5,
    });
  });

  it('counts only specified values when provided', () => {
    const result = countByField(items, 'status', ['published', 'draft']);

    expect(result).toEqual({
      published: 3,
      draft: 1,
      total: 5,
    });
  });

  it('returns total only for empty array', () => {
    const result = countByField([], 'status');

    expect(result).toEqual({ total: 0 });
  });

  it('handles undefined values', () => {
    const itemsWithUndefined = [
      { id: 1, status: 'active' },
      { id: 2, status: undefined },
      { id: 3, status: 'active' },
    ];

    const result = countByField(itemsWithUndefined, 'status');

    expect(result).toEqual({
      active: 2,
      undefined: 1,
      total: 3,
    });
  });
});
