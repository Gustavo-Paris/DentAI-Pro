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

const mockHandleMarkAsCompleted = vi.fn();
const mockHandleMarkAllAsCompleted = vi.fn();
const mockHandleDeleteSession = vi.fn();
const mockHandleRegenerateWithBudget = vi.fn();
const mockHandleShareCase = vi.fn();
const mockHandleShareWhatsApp = vi.fn();
const mockHandleBulkComplete = vi.fn();
const mockHandleExportPDF = vi.fn();
const mockHandleRetryEvaluation = vi.fn();
const mockSetShowAddTeethModal = vi.fn();
const mockClearSelection = vi.fn();
const mockToggleSelection = vi.fn();
const mockToggleSelectAll = vi.fn();
const mockHandleSubmitTeeth = vi.fn();

function makeDefaultHookReturn(overrides?: any) {
  return {
    sessionId: 'session-1',
    evaluations: [
      {
        id: 'eval-1',
        session_id: 'session-1',
        tooth: '11',
        treatment_type: 'resina',
        photo_frontal: null,
        dsd_simulation_url: null,
        dsd_simulation_layers: null,
        budget: 'padrão',
        status: 'draft',
      },
    ],
    patientName: 'Test Patient',
    evaluationDate: '12 de março de 2026',
    evaluationDateShort: '12/03',
    isLoading: false,
    isError: false,
    completedCount: 0,
    pendingTeeth: [],
    selectedIds: new Set(),
    clearSelection: mockClearSelection,
    toggleSelection: mockToggleSelection,
    toggleSelectAll: mockToggleSelectAll,
    handleExportPDF: mockHandleExportPDF,
    handleMarkAsCompleted: mockHandleMarkAsCompleted,
    handleRetryEvaluation: mockHandleRetryEvaluation,
    handleShareCase: mockHandleShareCase,
    handleShareWhatsApp: mockHandleShareWhatsApp,
    handleBulkComplete: mockHandleBulkComplete,
    handleMarkAllAsCompleted: mockHandleMarkAllAsCompleted,
    handleDeleteSession: mockHandleDeleteSession,
    handleRegenerateWithBudget: mockHandleRegenerateWithBudget,
    handleSubmitTeeth: mockHandleSubmitTeeth,
    setShowAddTeethModal: mockSetShowAddTeethModal,
    showAddTeethModal: false,
    isSharing: false,
    retryingEvaluationId: null,
    isRegenerating: false,
    regenerationProgress: null,
    isChecklistComplete: vi.fn(() => false),
    getChecklistProgress: vi.fn(() => ({ current: 0, total: 5 })),
    ...overrides,
  };
}

vi.mock('@/hooks/domain/useEvaluationDetail', () => ({
  useEvaluationDetail: vi.fn(() => makeDefaultHookReturn()),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

let capturedDetailPageProps: any = null;
vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  DetailPage: (props: any) => {
    capturedDetailPageProps = props;
    return (
      <div data-testid="detail-page">
        <span>{props.title}</span>
        {props.headerActions?.map((action: any, i: number) => (
          <button key={i} data-testid={`header-action-${i}`} onClick={action.onClick} disabled={action.disabled}>
            {action.label}
          </button>
        ))}
        {typeof props.children === 'function' ? props.children() : props.children}
      </div>
    );
  },
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

let capturedConfirmDialogs: any[] = [];
vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  PageConfirmDialog: (props: any) => {
    capturedConfirmDialogs.push(props);
    return props.open ? (
      <div data-testid={`confirm-dialog-${props.title}`}>
        <button data-testid={`confirm-${props.title}`} onClick={props.onConfirm}>confirm</button>
        <button data-testid={`cancel-${props.title}`} onClick={() => props.onOpenChange(false)}>cancel</button>
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

vi.mock('@/components/evaluation/EvaluationTable', () => ({
  EvaluationTable: (props: any) => (
    <div data-testid="eval-table">
      <button data-testid="table-complete" onClick={() => props.handleCompleteClick('eval-1')}>complete</button>
    </div>
  ),
}));

vi.mock('@/components/evaluation/EvaluationCards', () => ({
  EvaluationCards: () => <div data-testid="eval-cards" />,
}));

vi.mock('@/components/evaluation/SessionHeaderCard', () => ({
  SessionHeaderCard: (props: any) => (
    <div data-testid="session-header">
      <button data-testid="photo-click" onClick={props.onPhotoClick}>photo</button>
    </div>
  ),
}));

vi.mock('@/components/evaluation/PatientDocumentModal', () => ({
  PatientDocumentModal: () => null,
}));

vi.mock('@/components/AddTeethModal', () => ({
  default: () => null,
}));

vi.mock('@/components/DSDPreviewModal', () => ({
  default: () => null,
}));

vi.mock('lucide-react', () => ({
  CheckCircle: () => null,
  Plus: () => null,
  Share2: () => null,
  Loader2: () => null,
  X: () => null,
  Sparkles: () => null,
  Trash2: () => null,
  Lightbulb: () => null,
  RefreshCw: () => null,
  FileText: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('EvaluationDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedDetailPageProps = null;
    capturedConfirmDialogs = [];
    mockHandleMarkAsCompleted.mockReturnValue(undefined);
    mockHandleMarkAllAsCompleted.mockResolvedValue(undefined);
    mockHandleDeleteSession.mockResolvedValue(undefined);
  });

  it('renders without crashing', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    expect(screen.getByTestId('detail-page')).toBeTruthy();
  });

  it('renders empty state when no evaluations', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      evaluations: [],
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    const { container } = render(<EvaluationDetails />, { wrapper });
    expect(container.textContent).toContain('evaluation.noEvaluationsFound');
  });

  it('handleCompleteClick calls markAsCompleted', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByTestId('table-complete'));
    expect(mockHandleMarkAsCompleted).toHaveBeenCalledWith('eval-1');
  });

  it('handleCompleteClick opens confirm when checklist pending', async () => {
    mockHandleMarkAsCompleted.mockReturnValue({ pending: true, current: 2, total: 5 });
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByTestId('table-complete'));
    // Should open confirm dialog for incomplete checklist
    expect(screen.getByTestId('confirm-dialog-evaluation.incompleteChecklistTitle')).toBeTruthy();
  });

  it('confirm completion with incomplete checklist forces complete', async () => {
    mockHandleMarkAsCompleted.mockReturnValueOnce({ pending: true, current: 2, total: 5 });
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByTestId('table-complete'));
    fireEvent.click(screen.getByTestId('confirm-evaluation.incompleteChecklistTitle'));
    expect(mockHandleMarkAsCompleted).toHaveBeenCalledWith('eval-1', true);
  });

  it('share button calls handleShareCase', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    const shareBtn = screen.getByText('evaluation.share');
    fireEvent.click(shareBtn);
    expect(mockHandleShareCase).toHaveBeenCalled();
  });

  it('WhatsApp button calls handleShareWhatsApp', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    const waBtn = screen.getByText('WhatsApp');
    fireEvent.click(waBtn);
    expect(mockHandleShareWhatsApp).toHaveBeenCalled();
  });

  it('delete button opens delete dialog, confirm triggers delete', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByText('evaluation.deleteSession'));
    expect(screen.getByTestId('confirm-dialog-evaluation.deleteSessionTitle')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-evaluation.deleteSessionTitle'));
    });
    expect(mockHandleDeleteSession).toHaveBeenCalled();
  });

  it('mark all completed opens confirm dialog', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByText('evaluation.markAllCompleted'));
    expect(screen.getByTestId('confirm-dialog-evaluation.markAllCompletedTitle')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-evaluation.markAllCompletedTitle'));
    });
    expect(mockHandleMarkAllAsCompleted).toHaveBeenCalled();
  });

  it('regenerate button opens regenerate dialog and confirms', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    // Header action 1 is regenerate
    fireEvent.click(screen.getByTestId('header-action-1'));
    expect(screen.getByTestId('confirm-dialog-evaluation.regenerateTitle')).toBeTruthy();

    fireEvent.click(screen.getByTestId('confirm-evaluation.regenerateTitle'));
    expect(mockHandleRegenerateWithBudget).toHaveBeenCalledWith('premium');
  });

  it('shows pending teeth button and add teeth modal', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      pendingTeeth: ['21', '22'],
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    const addBtns = screen.getAllByText(/evaluation\.addMoreTeeth/);
    fireEvent.click(addBtns[0]);
    expect(mockSetShowAddTeethModal).toHaveBeenCalledWith(true);
  });

  it('shows selection bar when items are selected', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      selectedIds: new Set(['eval-1']),
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    expect(screen.getByText('common.finish')).toBeTruthy();
    expect(screen.getByLabelText('common.clearSelection')).toBeTruthy();
  });

  it('selection bar finish button calls handleBulkComplete', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      selectedIds: new Set(['eval-1']),
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByText('common.finish'));
    expect(mockHandleBulkComplete).toHaveBeenCalledWith(['eval-1']);
  });

  it('selection bar clear button calls clearSelection', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      selectedIds: new Set(['eval-1']),
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByLabelText('common.clearSelection'));
    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('patient document button opens modal', async () => {
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    fireEvent.click(screen.getByText('patientDocument.title'));
    // Should not throw - modal state is set
  });

  it('shows tip banner for sparse evaluations with no pending teeth', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      evaluations: [
        { id: 'eval-1', session_id: 's1', tooth: '11', treatment_type: 'resina', photo_frontal: null, dsd_simulation_url: null, dsd_simulation_layers: null, budget: 'padrão', status: 'draft' },
      ],
      pendingTeeth: [],
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    expect(screen.getAllByTestId('tip-banner').length).toBeGreaterThan(0);
  });

  it('shows isRegenerating state in header action', async () => {
    const mod = await import('@/hooks/domain/useEvaluationDetail');
    (mod.useEvaluationDetail as any).mockReturnValueOnce(makeDefaultHookReturn({
      isRegenerating: true,
      regenerationProgress: { current: 1, total: 3 },
    }));
    const EvaluationDetails = (await import('../EvaluationDetails')).default;
    render(<EvaluationDetails />, { wrapper });
    const regenBtn = screen.getByTestId('header-action-1');
    expect(regenBtn).toBeDisabled();
  });
});
