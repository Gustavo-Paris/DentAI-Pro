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

const mockCreatePatient = vi.fn();
vi.mock('@/hooks/domain/usePatientList', () => ({
  usePatientList: vi.fn(() => ({
    patients: [
      { id: 'p1', name: 'João Silva', phone: '11999999999', email: 'joao@test.com', caseCount: 3, lastVisit: '2026-01-15', sessionCount: 2, completedCount: 1 },
      { id: 'p2', name: 'Maria Santos', phone: null, email: null, caseCount: 0, lastVisit: null, sessionCount: 0, completedCount: 0 },
    ],
    total: 2,
    isLoading: false,
    isError: false,
    createPatient: mockCreatePatient,
    isCreating: false,
  })),
}));

vi.mock('@/lib/utils', () => ({
  getInitials: (name: string) => name?.charAt(0) || '?',
}));

vi.mock('@/lib/i18n', () => ({
  default: { language: 'pt-BR' },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('date-fns', () => ({
  format: () => '12/03/2026',
}));

vi.mock('@/lib/date-utils', () => ({
  getDateLocale: () => ({}),
  getDateFormat: () => 'dd/MM/yyyy',
}));

// ListPage mock that exposes callbacks for testing
let capturedListPageProps: any = null;
vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  ListPage: (props: any) => {
    capturedListPageProps = props;
    return (
      <div data-testid="list-page">
        {props.items?.map((item: any, index: number) => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {props.renderCard?.(item, index)}
          </div>
        ))}
        {props.createAction && (
          <button data-testid="create-action" onClick={props.createAction.onClick}>
            {props.createAction.label}
          </button>
        )}
        {props.emptyState?.action && (
          <button data-testid="empty-action" onClick={props.emptyState.action.onClick}>
            {props.emptyState.action.label}
          </button>
        )}
      </div>
    );
  },
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  Input: (p: any) => <input {...p} />,
  Textarea: (p: any) => <textarea {...p} />,
  Label: ({ children }: any) => <label>{children}</label>,
  Dialog: ({ children, open, onOpenChange }: any) => open ? (
    <div data-testid="dialog">
      {children}
      <button data-testid="dialog-close-trigger" onClick={() => onOpenChange?.(false)}>close-trigger</button>
    </div>
  ) : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

let capturedConfirmProps: any = null;
vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  PageConfirmDialog: (props: any) => {
    capturedConfirmProps = props;
    return props.open ? (
      <div data-testid="confirm-dialog">
        <button data-testid="confirm-btn" onClick={props.onConfirm}>confirm</button>
      </div>
    ) : null;
  },
}));

vi.mock('lucide-react', () => ({
  Phone: () => null,
  Mail: () => null,
  ChevronRight: () => null,
  Plus: () => null,
  Users: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Patients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedListPageProps = null;
    capturedConfirmProps = null;
  });

  it('renders without crashing', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });
    expect(screen.getByTestId('list-page')).toBeTruthy();
  });

  it('renders error state when isError', async () => {
    const mod = await import('@/hooks/domain/usePatientList');
    (mod.usePatientList as any).mockReturnValueOnce({
      patients: [],
      total: 0,
      isLoading: false,
      isError: true,
      createPatient: vi.fn(),
      isCreating: false,
    });
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });
    expect(screen.getByTestId('error-state')).toBeTruthy();
  });

  it('renders patient cards via renderCard', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });
    expect(screen.getByTestId('item-p1')).toBeTruthy();
    expect(screen.getByTestId('item-p2')).toBeTruthy();
  });

  it('opens create dialog via createAction', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });
    fireEvent.click(screen.getByTestId('create-action'));
    expect(screen.getByTestId('dialog')).toBeTruthy();
  });

  it('fills create form and submits', async () => {
    mockCreatePatient.mockResolvedValue({ id: 'new-p', name: 'Test' });
    const { toast } = await import('sonner');
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    // Open dialog
    fireEvent.click(screen.getByTestId('create-action'));

    // Fill form fields
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    const phoneInput = screen.getByPlaceholderText('patients.phonePlaceholder');
    const emailInput = screen.getByPlaceholderText('patients.emailPlaceholder');

    fireEvent.change(nameInput, { target: { value: 'New Patient' } });
    fireEvent.change(phoneInput, { target: { value: '11999998888' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });

    // Click save button
    const saveBtn = screen.getByText('common.save');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(mockCreatePatient).toHaveBeenCalledWith({
      name: 'New Patient',
      phone: '11999998888',
      email: 'new@test.com',
      notes: undefined,
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles create patient error', async () => {
    mockCreatePatient.mockRejectedValue(new Error('fail'));
    const { toast } = await import('sonner');
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Test' } });

    await act(async () => {
      fireEvent.click(screen.getByText('common.save'));
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('does not submit when name is empty', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));

    await act(async () => {
      fireEvent.click(screen.getByText('common.save'));
    });

    expect(mockCreatePatient).not.toHaveBeenCalled();
  });

  it('validates email on blur', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const emailInput = screen.getByPlaceholderText('patients.emailPlaceholder');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    // Validation error should be shown
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('validates phone on blur', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const phoneInput = screen.getByPlaceholderText('patients.phonePlaceholder');
    fireEvent.change(phoneInput, { target: { value: '12' } });
    fireEvent.blur(phoneInput);

    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('clears validation when value is corrected', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const emailInput = screen.getByPlaceholderText('patients.emailPlaceholder');

    // Add invalid email
    fireEvent.change(emailInput, { target: { value: 'bad' } });
    fireEvent.blur(emailInput);
    expect(screen.getByRole('alert')).toBeTruthy();

    // Fix email
    fireEvent.change(emailInput, { target: { value: 'good@test.com' } });
    fireEvent.blur(emailInput);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('closes clean dialog without confirm', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    expect(screen.getByTestId('dialog')).toBeTruthy();

    // Close dialog (form is clean)
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('shows discard confirm when closing dirty form', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    // Open and dirty the form
    fireEvent.click(screen.getByTestId('create-action'));
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Dirty' } });

    // Try to close via cancel button
    fireEvent.click(screen.getByText('common.cancel'));

    // Discard confirm should appear
    expect(screen.getByTestId('confirm-dialog')).toBeTruthy();
  });

  it('confirms discard and closes dialog', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Dirty' } });

    // Close via cancel
    fireEvent.click(screen.getByText('common.cancel'));

    // Confirm discard
    fireEvent.click(screen.getByTestId('confirm-btn'));

    // Dialog should be closed
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('handles onSearchChange callback', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    // capturedListPageProps should have onSearchChange
    expect(capturedListPageProps.onSearchChange).toBeDefined();
    act(() => {
      capturedListPageProps.onSearchChange('test search');
    });
    // Should not throw
  });

  it('handles onSortChange callback', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    expect(capturedListPageProps.onSortChange).toBeDefined();
    act(() => {
      capturedListPageProps.onSortChange('name-asc');
    });
    // Should not throw
  });

  it('handles onSortChange with null value', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    act(() => {
      capturedListPageProps.onSortChange(null);
    });
    // Should not throw
  });

  it('handles offsetPagination.onPageChange', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    expect(capturedListPageProps.offsetPagination.onPageChange).toBeDefined();
    act(() => {
      capturedListPageProps.offsetPagination.onPageChange(2);
    });
  });

  it('closes dialog via onOpenChange(false) when dirty', async () => {
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    // Open dialog and dirty it
    fireEvent.click(screen.getByTestId('create-action'));
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'Dirty' } });

    // Trigger dialog onOpenChange(false) via close trigger
    fireEvent.click(screen.getByTestId('dialog-close-trigger'));

    // Should show discard confirm (form is dirty)
    expect(screen.getByTestId('confirm-dialog')).toBeTruthy();
  });

  it('fills notes field in create form', async () => {
    mockCreatePatient.mockResolvedValue({ id: 'new-p', name: 'Test' });
    const Patients = (await import('../Patients')).default;
    render(<Patients />, { wrapper });

    fireEvent.click(screen.getByTestId('create-action'));
    const nameInput = screen.getByPlaceholderText('patients.namePlaceholder');
    fireEvent.change(nameInput, { target: { value: 'With Notes' } });

    const notesInput = screen.getByPlaceholderText('patients.clinicalNotesPlaceholder');
    fireEvent.change(notesInput, { target: { value: 'Some notes' } });

    await act(async () => {
      fireEvent.click(screen.getByText('common.save'));
    });

    expect(mockCreatePatient).toHaveBeenCalledWith(expect.objectContaining({
      notes: 'Some notes',
    }));
  });
});
