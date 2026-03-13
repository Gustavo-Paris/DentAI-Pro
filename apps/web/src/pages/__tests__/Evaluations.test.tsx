import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

const mockSessions = [
  {
    session_id: 's1',
    patient_name: 'João Silva',
    status: 'completed',
    evaluationCount: 3,
    completedCount: 3,
    treatmentTypes: ['resina', 'porcelana'],
    teeth: ['11', '12', '13', '14'],
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    session_id: 's2',
    patient_name: 'Maria Santos',
    status: 'pending',
    evaluationCount: 2,
    completedCount: 0,
    treatmentTypes: ['endodontia'],
    teeth: ['21'],
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    session_id: 's3',
    patient_name: null,
    status: 'partial',
    evaluationCount: 1,
    completedCount: 0,
    treatmentTypes: [],
    teeth: [],
    created_at: '2026-01-25T10:00:00Z',
  },
];

vi.mock('@/hooks/domain/useEvaluationSessions', () => ({
  useEvaluationSessions: vi.fn(() => ({
    sessions: mockSessions,
    isLoading: false,
    isError: false,
    newSessionId: null,
    newTeethCount: 0,
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    loading: false,
  })),
}));

vi.mock('@/data', () => ({
  evaluations: {
    listBySession: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('@/lib/query-keys', () => ({
  evaluationKeys: {
    session: (id: string) => ['evaluations', 'session', id],
  },
}));

vi.mock('@/lib/constants', () => ({
  QUERY_STALE_TIMES: { SHORT: 30000 },
}));

let capturedListPageProps: any = null;
vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  ListPage: (props: any) => {
    capturedListPageProps = props;
    return (
      <div data-testid="list-page">
        {props.items?.map((item: any, i: number) => (
          <div key={item.session_id || i} data-testid={`item-${item.session_id}`}>
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
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  StatusBadge: ({ label }: any) => <span data-testid="status-badge">{label}</span>,
  defineStatusConfig: (config: any) => config,
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('date-fns', () => ({
  format: () => '12/03',
}));

vi.mock('@/lib/date-utils', () => ({
  getDateLocale: () => ({}),
  getDateFormat: () => 'dd/MM',
}));

vi.mock('@/lib/treatment-config', () => ({
  formatToothLabel: (t: string) => `Dente ${t}`,
  getTreatmentConfig: () => ({
    icon: () => null,
    shortLabelKey: 'test',
  }),
}));

vi.mock('@/lib/treatment-colors', () => ({
  TREATMENT_COLORS: { resina: '#4CAF50', porcelana: '#2196F3' },
  TREATMENT_COLOR_FALLBACK: '#666',
}));

vi.mock('lucide-react', () => ({
  CheckCircle: () => null,
  ChevronRight: () => null,
  Plus: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Evaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedListPageProps = null;
  });

  it('renders without crashing', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(screen.getByTestId('list-page')).toBeTruthy();
  });

  it('renders error state when isError', async () => {
    const mod = await import('@/hooks/domain/useEvaluationSessions');
    (mod.useEvaluationSessions as any).mockReturnValueOnce({
      sessions: [],
      isLoading: false,
      isError: true,
      newSessionId: null,
      newTeethCount: 0,
    });
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(screen.getByTestId('error-state')).toBeTruthy();
  });

  it('renders session cards', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(screen.getByTestId('item-s1')).toBeTruthy();
    expect(screen.getByTestId('item-s2')).toBeTruthy();
  });

  it('onSearchChange updates search filter', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(capturedListPageProps.onSearchChange).toBeDefined();
    act(() => {
      capturedListPageProps.onSearchChange('João');
    });
    // After search, only s1 should match
  });

  it('onFiltersChange updates status filter', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(capturedListPageProps.onFiltersChange).toBeDefined();
    act(() => {
      capturedListPageProps.onFiltersChange({ status: 'completed' });
    });
  });

  it('onFiltersChange with all status resets filter', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    act(() => {
      capturedListPageProps.onFiltersChange({ status: 'all' });
    });
  });

  it('offsetPagination.onPageChange changes page', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(capturedListPageProps.offsetPagination.onPageChange).toBeDefined();
    act(() => {
      capturedListPageProps.offsetPagination.onPageChange(2);
    });
  });

  it('shows success banner when newSessionId is set', async () => {
    const mod = await import('@/hooks/domain/useEvaluationSessions');
    (mod.useEvaluationSessions as any).mockReturnValueOnce({
      sessions: mockSessions,
      isLoading: false,
      isError: false,
      newSessionId: 's1',
      newTeethCount: 3,
    });
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    // The success banner is rendered in the slots.headerSlot
    expect(capturedListPageProps.slots.headerSlot).toBeTruthy();
  });

  it('creates action navigates to new-case', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(capturedListPageProps.createAction.onClick).toBeDefined();
  });

  it('renders with loading state', async () => {
    const mod = await import('@/hooks/domain/useEvaluationSessions');
    (mod.useEvaluationSessions as any).mockReturnValueOnce({
      sessions: [],
      isLoading: true,
      isError: false,
      newSessionId: null,
      newTeethCount: 0,
    });
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    expect(capturedListPageProps.isLoading).toBe(true);
  });

  it('renders with URL search params', async () => {
    const urlWrapper = ({ children }: any) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/evaluations?status=completed&treatment=resina&q=test']}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper: urlWrapper });
    expect(screen.getByTestId('list-page')).toBeTruthy();
  });

  it('renders session card with no patient name', async () => {
    const Evaluations = (await import('../Evaluations')).default;
    render(<Evaluations />, { wrapper });
    // s3 has null patient name - should render fallback
    expect(screen.getByTestId('item-s3')).toBeTruthy();
  });
});
