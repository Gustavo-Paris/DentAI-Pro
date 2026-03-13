import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProtocolSections, type ProtocolSectionsProps } from '../ProtocolSections';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return {
    Layers: S, Crown: S, Stethoscope: S, ArrowUpRight: S,
    CircleX: S, Smile: S, HeartPulse: S, Palette: S, Copy: S, Check: S,
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/components/protocol/ProtocolTable', () => ({
  default: ({ layers }: any) => <div data-testid="protocol-table">{layers?.length} layers</div>,
}));
vi.mock('@/components/protocol/ProtocolChecklist', () => ({
  default: ({ items }: any) => <div data-testid="protocol-checklist">{items?.length} items</div>,
}));
vi.mock('@/components/protocol/AlertsSection', () => ({
  default: ({ alerts }: any) => <div data-testid="alerts-section">{alerts?.length} alerts</div>,
}));
vi.mock('@/components/protocol/WarningsSection', () => ({
  default: ({ warnings }: any) => <div data-testid="warnings-section">{warnings?.length} warnings</div>,
}));
vi.mock('@/components/protocol/ConfidenceIndicator', () => ({
  default: () => <div data-testid="confidence-indicator" />,
}));
vi.mock('@/components/protocol/AlternativeBox', () => ({
  default: () => <div data-testid="alternative-box" />,
}));
vi.mock('@/components/protocol/CementationProtocolCard', () => ({
  CementationProtocolCard: () => <div data-testid="cementation-card" />,
}));
vi.mock('@/components/protocol/VeneerPreparationCard', () => ({
  VeneerPreparationCard: () => <div data-testid="veneer-card" />,
}));
vi.mock('@/components/protocol/FinishingPolishingCard', () => ({
  FinishingPolishingCard: () => <div data-testid="finishing-card" />,
}));

const mockT = (key: string, fallback?: any) => typeof fallback === 'string' ? fallback : key;

const baseProps: ProtocolSectionsProps = {
  treatmentType: 'resina',
  hasProtocol: true,
  isPorcelain: false,
  isSpecialTreatment: false,
  layers: [
    { order: 1, name: 'Dentina', shade: 'A3', resin_brand: 'Z350', thickness: '1mm', technique: 'Incremental' },
  ],
  finishingProtocol: null,
  genericProtocol: null,
  cementationProtocol: null,
  protocolAlternative: null,
  checklist: ['Step 1', 'Step 2'],
  alerts: ['Alert 1'],
  warnings: ['Warning 1'],
  confidence: { level: 'high' },
  checkedIndices: [],
  onProgressChange: vi.fn(),
  t: mockT,
};

describe('ProtocolSections', () => {
  it('renders resin protocol sections', () => {
    render(<ProtocolSections {...baseProps} />);
    expect(screen.getByTestId('protocol-table')).toBeInTheDocument();
    expect(screen.getByTestId('protocol-checklist')).toBeInTheDocument();
    expect(screen.getByTestId('alerts-section')).toBeInTheDocument();
    expect(screen.getByTestId('warnings-section')).toBeInTheDocument();
    expect(screen.getByTestId('confidence-indicator')).toBeInTheDocument();
  });

  it('renders porcelain sections when isPorcelain', () => {
    render(
      <ProtocolSections
        {...baseProps}
        isPorcelain
        cementationProtocol={{ steps: [] } as any}
      />,
    );
    expect(screen.getByTestId('cementation-card')).toBeInTheDocument();
    expect(screen.getByTestId('veneer-card')).toBeInTheDocument();
  });

  it('renders special treatment card', () => {
    render(
      <ProtocolSections
        {...baseProps}
        treatmentType="coroa"
        isSpecialTreatment
        hasProtocol={false}
        genericProtocol={{ summary: 'Crown protocol', checklist: ['Step A'] }}
      />,
    );
    expect(screen.getByText('Crown protocol')).toBeInTheDocument();
  });

  it('renders alternative box when provided', () => {
    render(
      <ProtocolSections
        {...baseProps}
        protocolAlternative={{
          resin: 'Filtek Z250',
          shade: 'A2',
          technique: 'Bulk fill',
          tradeoff: 'Less aesthetic',
        }}
      />,
    );
    expect(screen.getByTestId('alternative-box')).toBeInTheDocument();
  });

  it('renders finishing card when provided', () => {
    render(
      <ProtocolSections
        {...baseProps}
        finishingProtocol={{ steps: [] } as any}
      />,
    );
    expect(screen.getByTestId('finishing-card')).toBeInTheDocument();
  });

  it('respects visibleSection filter', () => {
    render(
      <ProtocolSections
        {...baseProps}
        visibleSection="checklist"
      />,
    );
    expect(screen.getByTestId('protocol-checklist')).toBeInTheDocument();
    expect(screen.queryByTestId('protocol-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confidence-indicator')).not.toBeInTheDocument();
  });

  it('renders resins used badges', () => {
    render(<ProtocolSections {...baseProps} />);
    expect(screen.getByText('Z350 A3')).toBeInTheDocument();
  });

  it('renders copy button for resin protocol', () => {
    render(<ProtocolSections {...baseProps} />);
    const copyButtons = screen.getAllByRole('button');
    // At least one copy button
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('copies resin protocol text to clipboard on click', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<ProtocolSections {...baseProps} />);
    const copyBtn = screen.getByLabelText('components.protocol.copy.label');
    await fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('renders special treatment icons for each type', () => {
    const specialTypes = ['coroa', 'implante', 'endodontia', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];
    for (const tt of specialTypes) {
      const { unmount } = render(
        <ProtocolSections
          {...baseProps}
          treatmentType={tt}
          isSpecialTreatment
          hasProtocol={false}
          genericProtocol={{ summary: `${tt} protocol`, checklist: ['Step'] }}
        />,
      );
      expect(screen.getByText(`${tt} protocol`)).toBeInTheDocument();
      unmount();
    }
  });

  it('uses treatmentStyleLabel when provided', () => {
    render(
      <ProtocolSections
        {...baseProps}
        treatmentType="coroa"
        isSpecialTreatment
        hasProtocol={false}
        genericProtocol={{ summary: 'Test', checklist: ['Step'] }}
        treatmentStyleLabel="Custom Title"
      />,
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders copy button for generic protocol', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(
      <ProtocolSections
        {...baseProps}
        treatmentType="coroa"
        isSpecialTreatment
        hasProtocol={false}
        genericProtocol={{ summary: 'Test summary', checklist: ['Step A'] }}
      />,
    );
    const copyBtn = screen.getByLabelText('components.protocol.copy.label');
    await fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('handles clipboard write error', async () => {
    const { toast: mockToast } = await import('sonner');
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('fail')) } });
    render(<ProtocolSections {...baseProps} />);
    const copyBtn = screen.getByLabelText('components.protocol.copy.label');
    await fireEvent.click(copyBtn);
    expect(mockToast.error).toHaveBeenCalled();
  });
});
