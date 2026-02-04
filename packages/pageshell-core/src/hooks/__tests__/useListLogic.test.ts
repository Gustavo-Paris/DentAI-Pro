import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListLogic } from '../list';

describe('useListLogic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct defaults', () => {
      const { result } = renderHook(() => useListLogic());

      expect(result.current.search).toBe('');
      expect(result.current.debouncedSearch).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.sortBy).toBe('');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(20);
    });

    it('should use initial values', () => {
      const { result } = renderHook(() =>
        useListLogic({
          initialSearch: 'test',
          initialPage: 2,
          pageSize: 10,
        })
      );

      expect(result.current.search).toBe('test');
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(10);
    });

    it('should use filter defaults from config', () => {
      const { result } = renderHook(() =>
        useListLogic({
          filters: {
            status: {
              options: ['all', 'active', 'inactive'],
              defaultValue: 'active',
            },
          },
        })
      );

      expect(result.current.filters.status).toBe('active');
    });
  });

  describe('search', () => {
    it('should update search value immediately', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setSearch('test query');
      });

      expect(result.current.search).toBe('test query');
    });

    it('should debounce search for filtering', () => {
      const { result } = renderHook(() =>
        useListLogic({ searchDebounceMs: 300 })
      );

      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.debouncedSearch).toBe('');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.debouncedSearch).toBe('test');
    });

    it('should reset page when searching', () => {
      const { result } = renderHook(() => useListLogic({ initialPage: 5 }));

      act(() => {
        result.current.setSearch('query');
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('filters', () => {
    it('should set a single filter', () => {
      const { result } = renderHook(() =>
        useListLogic({
          filters: {
            status: { options: ['all', 'active', 'inactive'] },
          },
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.filters.status).toBe('active');
    });

    it('should set multiple filters', () => {
      const { result } = renderHook(() =>
        useListLogic({
          filters: {
            status: { options: ['all', 'active'] },
            role: { options: ['all', 'admin', 'user'] },
          },
        })
      );

      act(() => {
        result.current.setFilters({ status: 'active', role: 'admin' });
      });

      expect(result.current.filters).toEqual({ status: 'active', role: 'admin' });
    });

    it('should reset page when filtering', () => {
      const { result } = renderHook(() =>
        useListLogic({
          initialPage: 3,
          filters: { status: { options: ['all', 'active'] } },
        })
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.page).toBe(1);
    });

    it('should clear filters', () => {
      const { result } = renderHook(() =>
        useListLogic({
          initialSearch: 'test',
          filters: { status: { options: ['all', 'active'], defaultValue: 'all' } },
        })
      );

      act(() => {
        result.current.setSearch('query');
        result.current.setFilter('status', 'active');
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.search).toBe('');
      expect(result.current.filters.status).toBe('all');
    });

    it('should track hasActiveFilters', () => {
      const { result } = renderHook(() =>
        useListLogic({
          filters: { status: { options: ['all', 'active'] } },
        })
      );

      expect(result.current.hasActiveFilters).toBe(false);

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should track hasActiveFilters with search', () => {
      const { result } = renderHook(() => useListLogic());

      expect(result.current.hasActiveFilters).toBe(false);

      act(() => {
        result.current.setSearch('query');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should set sort field', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setSort('name');
      });

      expect(result.current.sortBy).toBe('name');
    });

    it('should toggle sort order', () => {
      const { result } = renderHook(() => useListLogic());

      expect(result.current.sortOrder).toBe('desc');

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.sortOrder).toBe('asc');

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.sortOrder).toBe('desc');
    });

    it('should set sort field and order together', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setSortBy('createdAt', 'asc');
      });

      expect(result.current.sortBy).toBe('createdAt');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('pagination', () => {
    it('should set page within bounds', () => {
      // Need items so totalPages > 1, otherwise setPage clamps to 1
      const items = Array(50)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(5);

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);
    });

    it('should clamp page to minimum 1', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setPage(-5);
      });

      expect(result.current.page).toBe(1);
    });

    it('should not go below page 1', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setPage(-5);
      });

      expect(result.current.page).toBe(1);
    });

    it('should go to next page', () => {
      const items = Array(30)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      // Ensure totalPages is computed correctly
      expect(result.current.totalPages).toBe(3);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.page).toBe(2);
    });

    it('should not go past last page when totalPages is 1', () => {
      const items = Array(5)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.page).toBe(1); // Still 1, can't go past totalPages
    });

    it('should go to previous page when page > 1', () => {
      const items = Array(30)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10, initialPage: 2 })
      );

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.page).toBe(1);
    });

    it('should not go below page 1 with prevPage', () => {
      const { result } = renderHook(() => useListLogic({ initialPage: 1 }));

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.page).toBe(1);
    });

    it('should set page size', () => {
      const { result } = renderHook(() => useListLogic());

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.pageSize).toBe(50);
    });

    it('should reset page when changing page size', () => {
      const { result } = renderHook(() =>
        useListLogic({ initialPage: 5 })
      );

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('client-side filtering', () => {
    const users = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
    ];

    it('should filter by search after debounce', () => {
      const { result } = renderHook(() =>
        useListLogic({
          items: users,
          searchFields: ['name', 'email'],
          searchDebounceMs: 100,
        })
      );

      // Initially all items
      expect(result.current.filteredItems).toHaveLength(3);

      act(() => {
        result.current.setSearch('alice');
      });

      // Before debounce, still uses old debouncedSearch
      // Advance timers to trigger debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0]!.name).toBe('Alice');
    });

    it('should filter by attribute (no debounce needed)', () => {
      const { result } = renderHook(() =>
        useListLogic({
          items: users,
          filters: {
            role: { options: ['all', 'admin', 'user'] },
          },
        })
      );

      act(() => {
        result.current.setFilter('role', 'admin');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0]!.name).toBe('Alice');
    });

    it('should handle case-insensitive search', () => {
      const { result } = renderHook(() =>
        useListLogic({
          items: users,
          searchFields: ['name'],
          searchDebounceMs: 50,
        })
      );

      act(() => {
        result.current.setSearch('ALICE');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.filteredItems).toHaveLength(1);
    });

    it('should handle accented characters', () => {
      const items = [{ name: 'José' }, { name: 'João' }];
      const { result } = renderHook(() =>
        useListLogic({
          items,
          searchFields: ['name'],
          searchDebounceMs: 50,
        })
      );

      act(() => {
        result.current.setSearch('jose');
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0]!.name).toBe('José');
    });
  });

  describe('client-side sorting', () => {
    const items = [
      { name: 'Charlie', score: 85 },
      { name: 'Alice', score: 90 },
      { name: 'Bob', score: 80 },
    ];

    it('should sort items with compareFn', () => {
      const { result } = renderHook(() =>
        useListLogic({
          items,
          sort: {
            options: [{ value: 'name', label: 'Name' }],
            default: 'name',
            defaultOrder: 'asc',
            compareFn: (key) => (a: unknown, b: unknown) => {
              const va = (a as Record<string, unknown>)[key];
              const vb = (b as Record<string, unknown>)[key];
              return String(va).localeCompare(String(vb));
            },
          },
        })
      );

      expect(result.current.sortedItems[0]!.name).toBe('Alice');
      expect(result.current.sortedItems[1]!.name).toBe('Bob');
      expect(result.current.sortedItems[2]!.name).toBe('Charlie');
    });

    it('should reverse sort order for desc', () => {
      const { result } = renderHook(() =>
        useListLogic({
          items,
          sort: {
            options: [{ value: 'name', label: 'Name' }],
            default: 'name',
            defaultOrder: 'desc',
            compareFn: (key) => (a: unknown, b: unknown) => {
              const va = (a as Record<string, unknown>)[key];
              const vb = (b as Record<string, unknown>)[key];
              return String(va).localeCompare(String(vb));
            },
          },
        })
      );

      expect(result.current.sortedItems[0]!.name).toBe('Charlie');
      expect(result.current.sortedItems[2]!.name).toBe('Alice');
    });
  });

  describe('pagination of filtered items', () => {
    const items = Array(25)
      .fill(null)
      .map((_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

    it('should paginate items', () => {
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      expect(result.current.paginatedItems).toHaveLength(10);
      expect(result.current.paginatedItems[0]!.id).toBe(1);
    });

    it('should calculate total pages', () => {
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(3);
    });

    it('should track filtered count', () => {
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10 })
      );

      expect(result.current.filteredCount).toBe(25);
    });

    it('should paginate second page', () => {
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10, initialPage: 2 })
      );

      expect(result.current.paginatedItems).toHaveLength(10);
      expect(result.current.paginatedItems[0]!.id).toBe(11);
    });

    it('should paginate last partial page', () => {
      const { result } = renderHook(() =>
        useListLogic({ items, pageSize: 10, initialPage: 3 })
      );

      expect(result.current.paginatedItems).toHaveLength(5);
      expect(result.current.paginatedItems[0]!.id).toBe(21);
    });
  });

  describe('queryParams', () => {
    it('should provide query params for API', () => {
      const { result } = renderHook(() =>
        useListLogic({ pageSize: 10, initialPage: 3 })
      );

      expect(result.current.queryParams).toEqual({
        search: '',
        filters: {},
        sortBy: '',
        sortOrder: 'desc',
        page: 3,
        pageSize: 10,
        offset: 20,
      });
    });

    it('should calculate correct offset', () => {
      const { result } = renderHook(() =>
        useListLogic({ pageSize: 25, initialPage: 4 })
      );

      expect(result.current.queryParams.offset).toBe(75);
    });
  });

  describe('reset', () => {
    it('should reset to initial values', () => {
      const onReset = vi.fn();
      const { result } = renderHook(() =>
        useListLogic({
          initialSearch: 'initial',
          initialPage: 1,
          pageSize: 10,
          onReset,
        })
      );

      act(() => {
        result.current.setSearch('changed');
        result.current.setPage(5);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.search).toBe('initial');
      expect(result.current.page).toBe(1);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onStateChange', () => {
      const onStateChange = vi.fn();
      const { result } = renderHook(() =>
        useListLogic({ onStateChange })
      );

      act(() => {
        result.current.setSearch('test');
      });

      expect(onStateChange).toHaveBeenCalled();
    });
  });
});
