// packages/pageshell-core/src/utils/__tests__/filterOptions.test.ts
import { describe, it, expect } from 'vitest';
import { createFilterOptions } from '../filterOptions';

describe('createFilterOptions', () => {
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      'filters.status.all': 'All',
      'filters.status.draft': 'Draft',
      'filters.status.published': 'Published',
      'filters.status.archived': 'Archived',
    };
    return translations[key] ?? key;
  };

  it('creates filter options from i18n prefix and values', () => {
    const options = createFilterOptions(mockT, 'filters.status', [
      'draft',
      'published',
      'archived',
    ]);

    expect(options).toEqual([
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ]);
  });

  it('excludes "all" option when includeAll is false', () => {
    const options = createFilterOptions(
      mockT,
      'filters.status',
      ['draft', 'published'],
      { includeAll: false }
    );

    expect(options).toEqual([
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ]);
  });

  it('uses custom allValue when provided', () => {
    const mockTWithEmpty = (key: string) => {
      if (key === 'filters.status.') return 'Any';
      return mockT(key);
    };

    const options = createFilterOptions(
      mockTWithEmpty,
      'filters.status',
      ['draft'],
      { allValue: '' }
    );

    expect(options[0]).toEqual({ value: '', label: 'Any' });
  });
});
