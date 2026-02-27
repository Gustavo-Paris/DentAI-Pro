import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreditConfirmDialog } from '../CreditConfirmDialog';
import type { CreditConfirmData } from '@/hooks/domain/wizard/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
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
  Trans: ({ children }: { children: React.ReactNode }) => children,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  withTranslation: () => (Component: any) => Component,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Coins: ({ className }: { className?: string }) => <span data-testid="coins-icon" className={className} />,
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock PageConfirmDialog from pageshell (component migrated from AlertDialog)
vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PageConfirmDialog: ({ children, open, title, icon, confirmText, cancelText, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="alert-dialog">
        <div>{icon}<h2>{title}</h2></div>
        {children}
        <div>
          <button onClick={onCancel}>{cancelText}</button>
          <button onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    ) : null,
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
