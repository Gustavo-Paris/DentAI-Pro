import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacySection } from '../PrivacySection';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Input: (p: any) => <input {...p} />,
  Label: ({ children, ...p }: any) => <label {...p}>{children}</label>,
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { Loader2: S, Download: S, Trash2: S, ShieldCheck: S, AlertTriangle: S };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('PrivacySection', () => {
  const defaultProps = {
    exportData: vi.fn().mockResolvedValue({ profile: {}, evaluations: [] }),
    deleteAccount: vi.fn().mockResolvedValue({ success: true }),
  };

  it('renders LGPD rights card', () => {
    render(<PrivacySection {...defaultProps} />);
    expect(screen.getByText('profile.lgpdTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.lgpdLaw')).toBeInTheDocument();
  });

  it('renders export data card', () => {
    render(<PrivacySection {...defaultProps} />);
    expect(screen.getByText('profile.exportDataTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.exportButton')).toBeInTheDocument();
  });

  it('renders delete account card', () => {
    render(<PrivacySection {...defaultProps} />);
    expect(screen.getByText('profile.deleteAccountTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.deleteAccountButton')).toBeInTheDocument();
  });

  it('opens delete dialog when delete button clicked', () => {
    render(<PrivacySection {...defaultProps} />);
    fireEvent.click(screen.getByText('profile.deleteAccountButton'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('profile.confirmDeleteTitle')).toBeInTheDocument();
  });

  it('renders LGPD rights list', () => {
    render(<PrivacySection {...defaultProps} />);
    expect(screen.getByText('profile.lgpdAccess')).toBeInTheDocument();
    expect(screen.getByText('profile.lgpdDeletion')).toBeInTheDocument();
    expect(screen.getByText('profile.lgpdCorrection')).toBeInTheDocument();
    expect(screen.getByText('profile.lgpdInfo')).toBeInTheDocument();
  });

  it('calls exportData on export click', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();

    const { waitFor } = await import('@testing-library/react');
    const { toast } = await import('sonner');

    render(<PrivacySection {...defaultProps} />);
    fireEvent.click(screen.getByText('profile.exportButton'));

    await waitFor(() => {
      expect(defaultProps.exportData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast when export fails', async () => {
    const { waitFor } = await import('@testing-library/react');
    const { toast } = await import('sonner');

    const failExport = vi.fn().mockRejectedValue(new Error('fail'));
    render(<PrivacySection {...{ ...defaultProps, exportData: failExport }} />);
    fireEvent.click(screen.getByText('profile.exportButton'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows error when delete confirmation does not match', async () => {
    const { waitFor } = await import('@testing-library/react');
    const { toast } = await import('sonner');

    render(<PrivacySection {...defaultProps} />);
    fireEvent.click(screen.getByText('profile.deleteAccountButton'));

    // Type wrong confirmation and click delete
    const input = screen.getByPlaceholderText('profile.deleteConfirmPhrase');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('profile.deletePermanently'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(defaultProps.deleteAccount).not.toHaveBeenCalled();
  });
});
