import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => ({
  inventory: {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: 'inv-1', resin_id: 'r1', resin: { shade: 'A2E', brand: '3M', product_line: 'Filtek Z350 XT', type: 'esmalte', opacity: 'translucido' } },
        { id: 'inv-2', resin_id: 'r2', resin: { shade: 'A3B', brand: '3M', product_line: 'Filtek Z350 XT', type: 'corpo', opacity: 'semi-opaco' } },
        { id: 'inv-3', resin_id: 'r3', resin: { shade: 'B1', brand: 'Ivoclar', product_line: 'IPS Empress', type: 'esmalte', opacity: 'translucido' } },
      ],
      count: 3,
    }),
    getCatalog: vi.fn().mockResolvedValue([
      { id: 'r1', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A2E', type: 'esmalte', opacity: 'translucido' },
      { id: 'r4', brand: 'Ivoclar', product_line: 'IPS Empress', shade: 'A1', type: 'dentina', opacity: 'opaco' },
      { id: 'r5', brand: 'Tokuyama', product_line: 'Omnichroma', shade: 'Universal', type: 'corpo', opacity: 'semi-opaco' },
    ]),
    addItems: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useInventoryManagement } from '@/hooks/domain/useInventoryManagement';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInventoryManagement (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.importing).toBe(false);
    expect(result.current.importDialogOpen).toBe(false);
  });

  it('should load inventory items', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.allItems).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.flatItems).toHaveLength(3);
    expect(result.current.flatItems[0].resinId).toBe('r1');
  });

  it('should compute brand and type options', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.brandOptions.length).toBeGreaterThan(0);
    expect(result.current.typeOptions.length).toBeGreaterThan(0);
  });

  it('should load catalog', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.catalog.length).toBeGreaterThan(0);
    });
  });

  it('should compute catalogBrands and catalogTypes', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.catalog.length).toBeGreaterThan(0);
    });
    expect(result.current.catalogBrands.length).toBeGreaterThan(0);
    expect(result.current.catalogTypes.length).toBeGreaterThan(0);
  });

  it('should filter catalog excluding inventory items', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.catalog.length).toBeGreaterThan(0);
    });
    // r1 is in inventory, so filtered catalog should not include it
    const filteredIds = Object.values(result.current.groupedCatalog)
      .flatMap(lines => Object.values(lines).flat())
      .map(r => r.id);
    expect(filteredIds).not.toContain('r1');
  });

  it('should open and close dialog', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    act(() => { result.current.openDialog(); });
    expect(result.current.dialogOpen).toBe(true);
    act(() => { result.current.closeDialog(); });
    expect(result.current.dialogOpen).toBe(false);
  });

  it('should toggle resin selection', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    act(() => { result.current.toggleResinSelection('r4'); });
    expect(result.current.selectedResins.has('r4')).toBe(true);
    act(() => { result.current.toggleResinSelection('r4'); });
    expect(result.current.selectedResins.has('r4')).toBe(false);
  });

  it('should update catalog filters', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    act(() => {
      result.current.setCatalogFilters({ search: 'Tokuyama', brand: 'all', type: 'all' });
    });
    expect(result.current.catalogFilters.search).toBe('Tokuyama');
  });

  it('should set deletingItemId', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    act(() => { result.current.setDeletingItemId('inv-1'); });
    expect(result.current.deletingItemId).toBe('inv-1');
  });

  it('should have getInventoryItemId function', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.getInventoryItemId('r1')).toBe('inv-1');
    expect(result.current.getInventoryItemId('nonexistent')).toBeUndefined();
  });

  it('should have csvInputRef', () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    expect(result.current.csvInputRef).toBeDefined();
  });

  it('should close import dialog', async () => {
    const { result } = renderHook(() => useInventoryManagement(), { wrapper: createWrapper() });
    act(() => { result.current.closeImportDialog(); });
    expect(result.current.importDialogOpen).toBe(false);
    expect(result.current.csvPreview).toBeNull();
  });
});
