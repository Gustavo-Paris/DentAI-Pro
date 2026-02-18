import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreditConfirmDialog } from '../CreditConfirmDialog';
import type { CreditConfirmData } from '@/hooks/domain/wizard/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'components.creditConfirm.title': 'Confirmar uso de créditos',
        'components.creditConfirm.willCost': 'custará',
        'components.creditConfirm.credit': `${opts?.count ?? 1} crédito(s)`,
        'components.creditConfirm.currentBalance': 'Saldo atual',
        'components.creditConfirm.credits': 'créditos',
        'components.creditConfirm.afterOperation': 'Após operação',
        'common.cancel': 'Cancelar',
        'common.confirm': 'Confirmar',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'pt-BR' },
  }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Coins: ({ className }: { className?: string }) => <span data-testid="coins-icon" className={className} />,
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock shadcn AlertDialog components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) =>
    <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode; className?: string }) =>
    <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode; asChild?: boolean }) =>
    <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) =>
    <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) =>
    <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) =>
    <button onClick={onClick}>{children}</button>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const mockData: CreditConfirmData = {
  operation: 'photo_analysis',
  operationLabel: 'Análise de foto',
  cost: 2,
  remaining: 10,
};

describe('CreditConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when data is null', () => {
    const onConfirm = vi.fn();
    const { container } = render(
      <CreditConfirmDialog data={null} onConfirm={onConfirm} />,
    );
    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('should render with operation label and credit cost', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    expect(screen.getByText(/Análise de foto/)).toBeInTheDocument();
    expect(screen.getByText(/2 crédito/)).toBeInTheDocument();
  });

  it('should display current balance', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    expect(screen.getByText('Saldo atual')).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('should display remaining balance after operation', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    expect(screen.getByText('Após operação')).toBeInTheDocument();
    // remaining (10) - cost (2) = 8
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('should call onConfirm(true) when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirmar'));

    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('should call onConfirm(false) when cancel button is clicked', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Cancelar'));

    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('should render title with coins icon', () => {
    const onConfirm = vi.fn();
    render(<CreditConfirmDialog data={mockData} onConfirm={onConfirm} />);

    expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
    expect(screen.getByText('Confirmar uso de créditos')).toBeInTheDocument();
  });
});
