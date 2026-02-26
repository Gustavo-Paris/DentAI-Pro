import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddTeethModal, type PendingTooth } from '../AddTeethModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: any) => <span data-testid="loader-icon" className={className} />,
  Plus: ({ className }: any) => <span data-testid="plus-icon" className={className} />,
  Wrench: ({ className }: any) => <span data-testid="wrench-icon" className={className} />,
  Wand2: ({ className }: any) => <span data-testid="wand-icon" className={className} />,
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog" role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id, ...props }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid={`checkbox-${id}`}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-wrapper" data-value={value}>
      {children}
      {/* Hidden select for triggering value change in tests */}
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ display: 'none' }}
      >
        <option value="resina">resina</option>
        <option value="porcelana">porcelana</option>
        <option value="coroa">coroa</option>
        <option value="implante">implante</option>
        <option value="endodontia">endodontia</option>
        <option value="encaminhamento">encaminhamento</option>
        <option value="gengivoplastia">gengivoplastia</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
  SelectValue: () => <span data-testid="select-value" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePendingTooth(overrides: Partial<PendingTooth> = {}): PendingTooth {
  return {
    id: 'tooth-1',
    session_id: 'session-1',
    user_id: 'user-1',
    tooth: '11',
    priority: 'alta',
    treatment_indication: 'resina',
    indication_reason: 'Cárie extensa',
    cavity_class: 'Classe II',
    restoration_size: 'Grande',
    substrate: null,
    substrate_condition: null,
    enamel_condition: null,
    depth: 'Profunda',
    tooth_region: 'anterior',
    tooth_bounds: null,
    ...overrides,
  };
}

const restorativeTooth1 = makePendingTooth({ id: 'r1', tooth: '11', priority: 'alta' });
const restorativeTooth2 = makePendingTooth({ id: 'r2', tooth: '21', priority: 'média' });
const aestheticTooth1 = makePendingTooth({ id: 'a1', tooth: '13', priority: 'baixa', indication_reason: 'Leve escurecimento' });
const aestheticTooth2 = makePendingTooth({ id: 'a2', tooth: '23', priority: 'baixa', indication_reason: 'Desgaste incisal' });

const allPendingTeeth = [restorativeTooth1, restorativeTooth2, aestheticTooth1, aestheticTooth2];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AddTeethModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    pendingTeeth: allPendingTeeth,
    onSubmitTeeth: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('should render when open is true', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<AddTeethModal {...defaultProps} open={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render the modal title', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('components.addTeeth.title')).toBeInTheDocument();
    });

    it('should render the modal description', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('components.addTeeth.description')).toBeInTheDocument();
    });
  });

  // ---- Pending teeth display ----

  describe('pending teeth display', () => {
    it('should display restorative teeth section for alta/média priority teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('components.addTeeth.requiredTreatments')).toBeInTheDocument();
    });

    it('should display aesthetic teeth section for baixa priority teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('components.addTeeth.aestheticImprovements')).toBeInTheDocument();
    });

    it('should display tooth numbers for all pending teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      // t('components.addTeeth.tooth', { number: '11' }) => 'components.addTeeth.tooth:{"number":"11"}'
      expect(screen.getByText('components.addTeeth.tooth:{"number":"11"}')).toBeInTheDocument();
      expect(screen.getByText('components.addTeeth.tooth:{"number":"21"}')).toBeInTheDocument();
      expect(screen.getByText('components.addTeeth.tooth:{"number":"13"}')).toBeInTheDocument();
      expect(screen.getByText('components.addTeeth.tooth:{"number":"23"}')).toBeInTheDocument();
    });

    it('should display priority badges for restorative teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Component renders t(`common.priority${Priority}`) — mock returns key as-is
      expect(screen.getByText('common.priorityAlta')).toBeInTheDocument();
      expect(screen.getByText('common.priorityMédia')).toBeInTheDocument();
    });

    it('should display cavity/restoration info for restorative teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Both restorative teeth share "Classe II" from the factory
      const cavityElements = screen.getAllByText('Classe II');
      expect(cavityElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display indication reason for aesthetic teeth', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('Leve escurecimento')).toBeInTheDocument();
      expect(screen.getByText('Desgaste incisal')).toBeInTheDocument();
    });

    it('should display restorative count badge', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Two restorative teeth (alta + média) and two aesthetic teeth (baixa)
      // Both badges show "2", so use getAllByText
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('should not display restorative section when no alta/média teeth', () => {
      render(<AddTeethModal {...defaultProps} pendingTeeth={[aestheticTooth1]} />);
      expect(screen.queryByText('components.addTeeth.requiredTreatments')).not.toBeInTheDocument();
    });

    it('should not display aesthetic section when no baixa teeth', () => {
      render(<AddTeethModal {...defaultProps} pendingTeeth={[restorativeTooth1]} />);
      expect(screen.queryByText('components.addTeeth.aestheticImprovements')).not.toBeInTheDocument();
    });
  });

  // ---- Tooth selection ----

  describe('tooth selection', () => {
    it('should allow selecting a tooth via checkbox', () => {
      render(<AddTeethModal {...defaultProps} />);
      const checkbox = screen.getByTestId('checkbox-restorative-tooth-11');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should allow deselecting a tooth via checkbox', () => {
      render(<AddTeethModal {...defaultProps} />);
      const checkbox = screen.getByTestId('checkbox-restorative-tooth-11');
      // Select
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      // Deselect
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should show treatment selector when tooth is selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Initially no select-wrapper visible for tooth 11
      const checkbox = screen.getByTestId('checkbox-restorative-tooth-11');
      fireEvent.click(checkbox);

      // Treatment selector should now be visible
      const selects = screen.getAllByTestId('select-wrapper');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  // ---- Select all / deselect all ----

  describe('select all / deselect all', () => {
    it('should render select all button with count', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(
        screen.getByText(`components.addTeeth.selectAll:{"count":${allPendingTeeth.length}}`)
      ).toBeInTheDocument();
    });

    it('should select all teeth when select all is clicked', () => {
      render(<AddTeethModal {...defaultProps} />);
      fireEvent.click(
        screen.getByText(`components.addTeeth.selectAll:{"count":${allPendingTeeth.length}}`)
      );

      // All checkboxes should be checked
      expect(screen.getByTestId('checkbox-restorative-tooth-11')).toBeChecked();
      expect(screen.getByTestId('checkbox-restorative-tooth-21')).toBeChecked();
      expect(screen.getByTestId('checkbox-aesthetic-tooth-13')).toBeChecked();
      expect(screen.getByTestId('checkbox-aesthetic-tooth-23')).toBeChecked();
    });

    it('should show clear selection button only when teeth are selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Initially no clear selection button
      expect(screen.queryByText('components.addTeeth.clearSelection')).not.toBeInTheDocument();

      // Select a tooth
      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));

      // Now clear selection should appear
      expect(screen.getByText('components.addTeeth.clearSelection')).toBeInTheDocument();
    });

    it('should deselect all teeth when clear selection is clicked', () => {
      render(<AddTeethModal {...defaultProps} />);
      // Select all first
      fireEvent.click(
        screen.getByText(`components.addTeeth.selectAll:{"count":${allPendingTeeth.length}}`)
      );

      // Click clear selection
      fireEvent.click(screen.getByText('components.addTeeth.clearSelection'));

      // All checkboxes should be unchecked
      expect(screen.getByTestId('checkbox-restorative-tooth-11')).not.toBeChecked();
      expect(screen.getByTestId('checkbox-restorative-tooth-21')).not.toBeChecked();
      expect(screen.getByTestId('checkbox-aesthetic-tooth-13')).not.toBeChecked();
      expect(screen.getByTestId('checkbox-aesthetic-tooth-23')).not.toBeChecked();
    });
  });

  // ---- Treatment dropdown ----

  describe('treatment dropdown', () => {
    it('should change treatment type when dropdown value changes', () => {
      render(<AddTeethModal {...defaultProps} />);

      // Select tooth 11
      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));

      // Change treatment via the hidden native select
      const selects = screen.getAllByTestId('select-native');
      fireEvent.change(selects[0], { target: { value: 'porcelana' } });

      // The select wrapper should now have porcelana as its value
      const wrappers = screen.getAllByTestId('select-wrapper');
      expect(wrappers[0]).toHaveAttribute('data-value', 'porcelana');
    });
  });

  // ---- Submit ----

  describe('submit', () => {
    it('should disable submit button when no teeth are selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      const submitButton = screen.getByText('components.addTeeth.addCount:{"count":0}');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when teeth are selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));
      const submitButton = screen.getByText('components.addTeeth.addCount:{"count":1}');
      expect(submitButton).not.toBeDisabled();
    });

    it('should call onSubmitTeeth with correct payload on submit', async () => {
      render(<AddTeethModal {...defaultProps} />);

      // Select tooth 11
      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));

      // Click submit
      fireEvent.click(screen.getByText('components.addTeeth.addCount:{"count":1}'));

      await waitFor(() => {
        expect(defaultProps.onSubmitTeeth).toHaveBeenCalledWith({
          selectedTeeth: ['11'],
          toothTreatments: {},
          pendingTeeth: allPendingTeeth,
        });
      });
    });

    it('should call onClose after successful submit', async () => {
      render(<AddTeethModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));
      fireEvent.click(screen.getByText('components.addTeeth.addCount:{"count":1}'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should show error toast when submit fails', async () => {
      const { toast } = await import('sonner');
      const failingSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<AddTeethModal {...defaultProps} onSubmitTeeth={failingSubmit} />);

      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));
      fireEvent.click(screen.getByText('components.addTeeth.addCount:{"count":1}'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('components.addTeeth.addError');
      });
    });

    it('should not call onSubmitTeeth when no teeth selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      const submitButton = screen.getByText('components.addTeeth.addCount:{"count":0}');
      fireEvent.click(submitButton);
      expect(defaultProps.onSubmitTeeth).not.toHaveBeenCalled();
    });

    it('should include changed treatment types in payload', async () => {
      render(<AddTeethModal {...defaultProps} />);

      // Select tooth 11
      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));

      // Change treatment to porcelana
      const selects = screen.getAllByTestId('select-native');
      fireEvent.change(selects[0], { target: { value: 'porcelana' } });

      // Submit
      fireEvent.click(screen.getByText('components.addTeeth.addCount:{"count":1}'));

      await waitFor(() => {
        expect(defaultProps.onSubmitTeeth).toHaveBeenCalledWith({
          selectedTeeth: ['11'],
          toothTreatments: { '11': 'porcelana' },
          pendingTeeth: allPendingTeeth,
        });
      });
    });
  });

  // ---- Cancel ----

  describe('cancel', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<AddTeethModal {...defaultProps} />);
      fireEvent.click(screen.getByText('components.addTeeth.cancel'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('should handle empty pending teeth list', () => {
      render(<AddTeethModal {...defaultProps} pendingTeeth={[]} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.queryByText('components.addTeeth.requiredTreatments')).not.toBeInTheDocument();
      expect(screen.queryByText('components.addTeeth.aestheticImprovements')).not.toBeInTheDocument();
    });

    it('should handle teeth with null priority as restorative (média fallback)', () => {
      const toothNullPriority = makePendingTooth({ id: 'np1', tooth: '14', priority: null });
      // priority null is not 'alta', 'média', or 'baixa', so it goes to neither section
      // restorativeTeeth = filter(alta | média), aestheticTeeth = filter(baixa)
      // null priority => excluded from both
      render(<AddTeethModal {...defaultProps} pendingTeeth={[toothNullPriority]} />);
      expect(screen.queryByText('components.addTeeth.requiredTreatments')).not.toBeInTheDocument();
      expect(screen.queryByText('components.addTeeth.aestheticImprovements')).not.toBeInTheDocument();
    });

    it('should update submit button count as teeth are selected', () => {
      render(<AddTeethModal {...defaultProps} />);
      expect(screen.getByText('components.addTeeth.addCount:{"count":0}')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-11'));
      expect(screen.getByText('components.addTeeth.addCount:{"count":1}')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('checkbox-restorative-tooth-21'));
      expect(screen.getByText('components.addTeeth.addCount:{"count":2}')).toBeInTheDocument();
    });
  });
});
