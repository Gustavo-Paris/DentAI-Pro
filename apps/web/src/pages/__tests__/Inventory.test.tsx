import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRef } from 'react';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

const mockOpenDialog = vi.fn();
const mockCloseDialog = vi.fn();
const mockSetDeletingItemId = vi.fn();
const mockExportCSV = vi.fn();
const mockRemoveFromInventory = vi.fn();
const mockHandleCSVFile = vi.fn();

const mockItems = [
  { id: 'i1', shade: 'A2', brand: 'Filtek', product_line: 'Z350 XT', type: 'Esmalte' },
  { id: 'i2', shade: 'A3', brand: '3M', product_line: 'Z250', type: 'Dentina' },
];

vi.mock('@/hooks/domain/useInventoryManagement', () => ({
  useInventoryManagement: vi.fn(() => ({
    flatItems: mockItems,
    allItems: mockItems,
    total: 2,
    isLoading: false,
    isError: false,
    isAdding: false,
    importing: false,
    dialogOpen: false,
    importDialogOpen: false,
    deletingItemId: null,
    brandOptions: [{ value: 'Filtek', label: 'Filtek' }],
    typeOptions: [{ value: 'Esmalte', label: 'Esmalte' }],
    groupedCatalog: {},
    catalogBrands: [],
    catalogTypes: [],
    catalogFilters: { brand: 'all', type: 'all' },
    selectedResins: new Set(),
    csvPreview: null,
    csvInputRef: createRef(),
    openDialog: mockOpenDialog,
    closeDialog: mockCloseDialog,
    closeImportDialog: vi.fn(),
    setCatalogFilters: vi.fn(),
    toggleResinSelection: vi.fn(),
    addSelectedToInventory: vi.fn(),
    removeFromInventory: mockRemoveFromInventory,
    setDeletingItemId: mockSetDeletingItemId,
    exportCSV: mockExportCSV,
    handleCSVFile: mockHandleCSVFile,
    confirmImport: vi.fn(),
  })),
}));

let capturedListPageProps: any = null;
vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  ListPage: (props: any) => {
    capturedListPageProps = props;
    return (
      <div data-testid="list-page">
        {props.items?.map((item: any, i: number) => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {props.renderCard?.(item, i)}
          </div>
        ))}
        {props.createAction && (
          <button data-testid="create-action" onClick={props.createAction.onClick}>
            {props.createAction.label}
          </button>
        )}
      </div>
    );
  },
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

let capturedConfirmProps: any = null;
vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  PageConfirmDialog: (props: any) => {
    capturedConfirmProps = props;
    return props.open ? (
      <div data-testid="confirm-dialog">
        <button data-testid="confirm-btn" onClick={props.onConfirm}>confirm</button>
        <button data-testid="cancel-confirm" onClick={() => props.onOpenChange(false)}>cancel</button>
      </div>
    ) : null;
  },
}));

vi.mock('@/components/TipBanner', () => ({
  TipBanner: ({ action }: any) => (
    <div data-testid="tip-banner">
      {action && <button data-testid="tip-action" onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
}));

vi.mock('@/components/ResinTypeLegend', () => ({
  ResinTypeLegend: () => <div data-testid="resin-legend" />,
  getTypeColorClasses: () => 'text-green-500',
}));

vi.mock('@/lib/vitaShadeColors', () => ({
  getVitaShadeColor: () => '#C4A882',
  isGradient: () => false,
}));

vi.mock('@/components/inventory/AddResinsDialog', () => ({
  AddResinsDialog: () => null,
}));

vi.mock('@/components/inventory/CSVImportDialog', () => ({
  CSVImportDialog: () => null,
}));

vi.mock('lucide-react', () => ({
  Lightbulb: () => null,
  Plus: () => null,
  X: () => <span>X</span>,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedListPageProps = null;
    capturedConfirmProps = null;
  });

  it('renders without crashing', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(screen.getByTestId('list-page')).toBeTruthy();
  });

  it('renders error state when isError', async () => {
    const mod = await import('@/hooks/domain/useInventoryManagement');
    (mod.useInventoryManagement as any).mockReturnValueOnce({
      flatItems: [],
      allItems: [],
      total: 0,
      isLoading: false,
      isError: true,
      isAdding: false,
      importing: false,
      dialogOpen: false,
      importDialogOpen: false,
      deletingItemId: null,
      brandOptions: [],
      typeOptions: [],
      csvInputRef: { current: null },
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
      exportCSV: vi.fn(),
      setDeletingItemId: vi.fn(),
    });
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(screen.getByTestId('error-state')).toBeTruthy();
  });

  it('renders inventory item cards via renderCard', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(screen.getByTestId('item-i1')).toBeTruthy();
    expect(screen.getByTestId('item-i2')).toBeTruthy();
  });

  it('createAction opens dialog', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    fireEvent.click(screen.getByTestId('create-action'));
    expect(mockOpenDialog).toHaveBeenCalled();
  });

  it('remove button calls setDeletingItemId', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    // Find remove buttons rendered in cards
    const removeButtons = screen.getAllByTitle('common.remove');
    fireEvent.click(removeButtons[0]);
    expect(mockSetDeletingItemId).toHaveBeenCalledWith('i1');
  });

  it('shows tip banner when few items', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(screen.getByTestId('tip-banner')).toBeTruthy();
  });

  it('does not show tip banner when loading', async () => {
    const mod = await import('@/hooks/domain/useInventoryManagement');
    (mod.useInventoryManagement as any).mockReturnValueOnce({
      flatItems: mockItems,
      allItems: mockItems,
      total: 2,
      isLoading: true,
      isError: false,
      isAdding: false,
      importing: false,
      dialogOpen: false,
      importDialogOpen: false,
      deletingItemId: null,
      brandOptions: [],
      typeOptions: [],
      csvInputRef: createRef(),
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
      closeImportDialog: vi.fn(),
      setCatalogFilters: vi.fn(),
      toggleResinSelection: vi.fn(),
      addSelectedToInventory: vi.fn(),
      removeFromInventory: vi.fn(),
      setDeletingItemId: vi.fn(),
      exportCSV: vi.fn(),
      handleCSVFile: vi.fn(),
      confirmImport: vi.fn(),
      groupedCatalog: {},
      catalogBrands: [],
      catalogTypes: [],
      catalogFilters: { brand: 'all', type: 'all' },
      selectedResins: new Set(),
      csvPreview: null,
    });
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(screen.queryByTestId('tip-banner')).toBeNull();
  });

  it('confirm dialog triggers remove then clears deletingItemId', async () => {
    const mod = await import('@/hooks/domain/useInventoryManagement');
    (mod.useInventoryManagement as any).mockReturnValueOnce({
      flatItems: mockItems,
      allItems: mockItems,
      total: 2,
      isLoading: false,
      isError: false,
      isAdding: false,
      importing: false,
      dialogOpen: false,
      importDialogOpen: false,
      deletingItemId: 'i1',
      brandOptions: [],
      typeOptions: [],
      csvInputRef: createRef(),
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
      closeImportDialog: vi.fn(),
      setCatalogFilters: vi.fn(),
      toggleResinSelection: vi.fn(),
      addSelectedToInventory: vi.fn(),
      removeFromInventory: mockRemoveFromInventory,
      setDeletingItemId: mockSetDeletingItemId,
      exportCSV: mockExportCSV,
      handleCSVFile: mockHandleCSVFile,
      confirmImport: vi.fn(),
      groupedCatalog: {},
      catalogBrands: [],
      catalogTypes: [],
      catalogFilters: { brand: 'all', type: 'all' },
      selectedResins: new Set(),
      csvPreview: null,
    });
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });

    // Confirm dialog should be visible
    expect(screen.getByTestId('confirm-dialog')).toBeTruthy();
    fireEvent.click(screen.getByTestId('confirm-btn'));
    expect(mockRemoveFromInventory).toHaveBeenCalledWith('i1');
    expect(mockSetDeletingItemId).toHaveBeenCalledWith(null);
  });

  it('cancel confirm dialog clears deletingItemId', async () => {
    const mod = await import('@/hooks/domain/useInventoryManagement');
    (mod.useInventoryManagement as any).mockReturnValueOnce({
      flatItems: mockItems,
      allItems: mockItems,
      total: 2,
      isLoading: false,
      isError: false,
      isAdding: false,
      importing: false,
      dialogOpen: false,
      importDialogOpen: false,
      deletingItemId: 'i1',
      brandOptions: [],
      typeOptions: [],
      csvInputRef: createRef(),
      openDialog: mockOpenDialog,
      closeDialog: mockCloseDialog,
      closeImportDialog: vi.fn(),
      setCatalogFilters: vi.fn(),
      toggleResinSelection: vi.fn(),
      addSelectedToInventory: vi.fn(),
      removeFromInventory: mockRemoveFromInventory,
      setDeletingItemId: mockSetDeletingItemId,
      exportCSV: mockExportCSV,
      handleCSVFile: mockHandleCSVFile,
      confirmImport: vi.fn(),
      groupedCatalog: {},
      catalogBrands: [],
      catalogTypes: [],
      catalogFilters: { brand: 'all', type: 'all' },
      selectedResins: new Set(),
      csvPreview: null,
    });
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });

    fireEvent.click(screen.getByTestId('cancel-confirm'));
    expect(mockSetDeletingItemId).toHaveBeenCalledWith(null);
  });

  it('headerActions includes CSV export when items exist', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    // headerActions should have CSV button since allItems.length > 0
    expect(capturedListPageProps.headerActions.length).toBeGreaterThanOrEqual(1);
    expect(capturedListPageProps.headerActions[0].label).toBe('CSV');
  });

  it('sort config includes compare functions', async () => {
    const Inventory = (await import('../Inventory')).default;
    render(<Inventory />, { wrapper });
    expect(capturedListPageProps.sort.options.length).toBe(3);
    // Test sort comparators
    const brandSort = capturedListPageProps.sort.options[0].compare;
    const result = brandSort(
      { brand: 'A', product_line: 'X', shade: 'Z' },
      { brand: 'B', product_line: 'X', shade: 'Z' },
    );
    expect(result).toBeLessThan(0);
  });
});
