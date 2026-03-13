import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToothSelectionCard } from '../ToothSelectionCard';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled, ...p }: any) => (
    <button onClick={onClick} disabled={disabled} {...p}>{children}</button>
  ),
  Checkbox: ({ checked, onCheckedChange, ...p }: any) => (
    <input type="checkbox" checked={checked} onChange={(e: any) => onCheckedChange?.(e.target.checked)} {...p} />
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('porcelana')}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { Check: S, CircleDot: S, Plus: S, Wrench: S, Wand2: S };
});

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  toI18nKeySuffix: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

vi.mock('../DentalArchDiagram', () => ({
  DentalArchDiagram: ({ onToggleTooth }: any) => (
    <div data-testid="dental-arch" onClick={() => onToggleTooth?.('11')}>Arch</div>
  ),
}));

const defaultProps = {
  analysisResult: {
    detected_teeth: [
      { tooth: '11', priority: 'alta' as const, treatment_indication: 'resina', indication_reason: 'Cárie' },
      { tooth: '21', priority: 'média' as const, treatment_indication: 'resina', indication_reason: null },
      { tooth: '12', priority: 'baixa' as const, treatment_indication: 'resina', indication_reason: 'Estética' },
    ],
  },
  selectedTeeth: ['11'],
  onSelectedTeethChange: vi.fn(),
  toothTreatments: { '11': 'resina' as const },
  onToothTreatmentChange: vi.fn(),
  originalToothTreatments: {} as Record<string, any>,
  onRestoreAiSuggestion: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ToothSelectionCard', () => {
  it('renders card with title', () => {
    render(<ToothSelectionCard {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.selectTeethTitle')).toBeInTheDocument();
  });

  it('renders dental arch diagram', () => {
    render(<ToothSelectionCard {...defaultProps} />);
    expect(screen.getByTestId('dental-arch')).toBeInTheDocument();
  });

  it('renders restorative teeth section', () => {
    render(<ToothSelectionCard {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.requiredTreatments')).toBeInTheDocument();
  });

  it('renders aesthetic improvements section', () => {
    render(<ToothSelectionCard {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.aestheticImprovements')).toBeInTheDocument();
  });

  it('handles toggle tooth via checkbox (select)', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard
        {...defaultProps}
        selectedTeeth={[]}
        onSelectedTeethChange={onSelectedTeethChange}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onSelectedTeethChange).toHaveBeenCalled();
  });

  it('handles toggle tooth via checkbox (deselect)', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard
        {...defaultProps}
        selectedTeeth={['11']}
        onSelectedTeethChange={onSelectedTeethChange}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // Find the checked one and uncheck it
    const checkedBox = Array.from(checkboxes).find((cb: any) => cb.checked);
    if (checkedBox) {
      fireEvent.click(checkedBox);
      expect(onSelectedTeethChange).toHaveBeenCalled();
    }
  });

  it('handles select restorative only', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard {...defaultProps} onSelectedTeethChange={onSelectedTeethChange} />,
    );
    fireEvent.click(screen.getByText(/components\.wizard\.review\.onlyRequired/));
    expect(onSelectedTeethChange).toHaveBeenCalledWith(['11', '21']);
  });

  it('handles select all', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard {...defaultProps} onSelectedTeethChange={onSelectedTeethChange} />,
    );
    fireEvent.click(screen.getByText(/components\.wizard\.review\.selectAll/));
    expect(onSelectedTeethChange).toHaveBeenCalledWith(['11', '21', '12']);
  });

  it('handles select aesthetic only', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard {...defaultProps} onSelectedTeethChange={onSelectedTeethChange} />,
    );
    fireEvent.click(screen.getByText(/components\.wizard\.review\.onlyAesthetic/));
    expect(onSelectedTeethChange).toHaveBeenCalledWith(['12']);
  });

  it('handles clear selection', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard {...defaultProps} onSelectedTeethChange={onSelectedTeethChange} />,
    );
    fireEvent.click(screen.getByText('components.wizard.review.clearSelection'));
    expect(onSelectedTeethChange).toHaveBeenCalledWith([]);
  });

  it('handles add manual tooth flow', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard
        {...defaultProps}
        selectedTeeth={['11']}
        onSelectedTeethChange={onSelectedTeethChange}
      />,
    );
    // Click "add manually" button
    fireEvent.click(screen.getByText('components.wizard.review.addManually'));
    // Should show the add form
    expect(screen.getByText('components.wizard.review.add')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.cancel')).toBeInTheDocument();
  });

  it('handles cancel manual add', () => {
    render(<ToothSelectionCard {...defaultProps} />);
    fireEvent.click(screen.getByText('components.wizard.review.addManually'));
    fireEvent.click(screen.getByText('components.wizard.review.cancel'));
    // Should go back to showing "add manually" button
    expect(screen.getByText('components.wizard.review.addManually')).toBeInTheDocument();
  });

  it('handles tooth toggle from dental arch diagram', () => {
    const onSelectedTeethChange = vi.fn();
    render(
      <ToothSelectionCard
        {...defaultProps}
        selectedTeeth={['11']}
        onSelectedTeethChange={onSelectedTeethChange}
      />,
    );
    fireEvent.click(screen.getByTestId('dental-arch'));
    expect(onSelectedTeethChange).toHaveBeenCalled();
  });

  it('shows selected count', () => {
    render(<ToothSelectionCard {...defaultProps} selectedTeeth={['11', '21']} />);
    expect(screen.getByText(/components\.wizard\.review\.teethSelectedCount/)).toBeInTheDocument();
  });

  it('renders restore AI suggestion button when treatment changed', () => {
    render(
      <ToothSelectionCard
        {...defaultProps}
        selectedTeeth={['11']}
        toothTreatments={{ '11': 'porcelana' as any }}
        originalToothTreatments={{ '11': 'resina' as any }}
      />,
    );
    const restoreBtn = screen.getByLabelText(/components\.wizard\.review\.restoreAI/);
    expect(restoreBtn).toBeInTheDocument();
    fireEvent.click(restoreBtn);
    expect(defaultProps.onRestoreAiSuggestion).toHaveBeenCalledWith('11');
  });
});
