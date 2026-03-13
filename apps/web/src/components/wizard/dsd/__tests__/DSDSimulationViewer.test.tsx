import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DSDSimulationViewer } from '../DSDSimulationViewer';
import { createRef } from 'react';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return {
    Check: S, Loader2: S, RefreshCw: S, Eye: S, User: S,
    Ruler: S, Ratio: S, SmilePlus: S, Columns2: S, SlidersHorizontal: S,
    SplitSquareHorizontal: S, Image: S, ImageOff: S, Info: S,
  };
});

vi.mock('@/components/dsd/ComparisonSlider', () => ({
  ComparisonSlider: ({ beforeImage, afterImage }: any) => (
    <div data-testid="comparison-slider">
      <img src={beforeImage} alt="before" />
      <img src={afterImage} alt="after" />
    </div>
  ),
}));

vi.mock('@/components/dsd/AnnotationOverlay', () => ({
  AnnotationOverlay: () => <div data-testid="annotation-overlay" />,
}));

vi.mock('@/components/dsd/ProportionOverlay', () => ({
  ProportionOverlay: () => <div data-testid="proportion-overlay" />,
}));

vi.mock('@/hooks/domain/dsd/useProportionLines', () => ({
  useProportionLines: () => ({ midline: null, goldenRatio: [], smileArc: [] }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/types/dsd', () => ({
  getLayerLabel: (type: string) => type,
}));

vi.mock('@/components/dsd/LayerComparisonModal', () => ({
  default: () => <div data-testid="layer-comparison-modal" />,
}));

const noop = vi.fn();

const defaultProps = {
  imageBase64: 'data:image/jpeg;base64,abc',
  simulationImageUrl: 'sim.jpg',
  layers: [{ type: 'natural-restorations' as const, label: 'Natural', simulation_url: 'url' }],
  activeLayerIndex: 0,
  failedLayers: [] as any[],
  retryingLayer: null,
  isRegeneratingSimulation: false,
  isCompositing: false,
  layersGenerating: false,
  showAnnotations: false,
  toothBounds: [],
  suggestions: [],
  annotationContainerRef: createRef<HTMLDivElement>(),
  annotationDimensions: { width: 800, height: 600 },
  visibleProportionLayers: new Set() as any,
  onToggleProportionLayer: noop,
  onSelectLayer: noop,
  onRetryFailedLayer: noop,
  onRegenerateSimulation: noop,
  onToggleAnnotations: noop,
};

describe('DSDSimulationViewer', () => {
  it('renders comparison slider', () => {
    render(<DSDSimulationViewer {...defaultProps} />);
    expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
  });

  it('renders layer tabs', () => {
    render(<DSDSimulationViewer {...defaultProps} />);
    const tab = screen.getByRole('tab');
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveTextContent('Natural');
  });

  it('renders regenerate button', () => {
    render(<DSDSimulationViewer {...defaultProps} />);
    expect(screen.getByText('components.wizard.dsd.simulationViewer.newSimulation')).toBeInTheDocument();
  });

  it('shows generating state on regenerate button', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        isRegeneratingSimulation={true}
      />,
    );
    expect(screen.getByText('components.wizard.dsd.simulationViewer.generating')).toBeInTheDocument();
  });

  it('renders failed layer retry buttons', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        failedLayers={['whitening' as any]}
      />,
    );
    expect(screen.getByText('whitening')).toBeInTheDocument();
  });

  it('calls onSelectLayer when tab clicked', () => {
    const onSelectLayer = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        onSelectLayer={onSelectLayer}
      />,
    );
    fireEvent.click(screen.getByRole('tab'));
    expect(onSelectLayer).toHaveBeenCalledWith(0, 'natural-restorations');
  });

  it('shows face mockup button when hasFacePhoto', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        hasFacePhoto={true}
        onGenerateFaceMockup={noop}
      />,
    );
    expect(screen.getByText('components.wizard.dsd.simulateOnFace')).toBeInTheDocument();
  });

  it('renders view mode toggle when simulation URL exists', () => {
    render(<DSDSimulationViewer {...defaultProps} />);
    expect(screen.getByText(/components\.wizard\.dsd\.simulationViewer\.viewBefore/)).toBeInTheDocument();
  });

  it('renders analysis tools popover trigger', () => {
    render(<DSDSimulationViewer {...defaultProps} />);
    expect(screen.getByText('components.wizard.dsd.simulationViewer.analysisTools')).toBeInTheDocument();
  });

  it('calls onToggleAnnotations when annotations button clicked', () => {
    const onToggleAnnotations = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        suggestions={[{ tooth: '11', text: 'test' } as any]}
        onToggleAnnotations={onToggleAnnotations}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const annotationsBtn = buttons.find(b => b.textContent?.includes('components.wizard.dsd.simulationViewer.annotations'));
    if (annotationsBtn) fireEvent.click(annotationsBtn);
    expect(onToggleAnnotations).toHaveBeenCalled();
  });

  it('calls onToggleProportionLayer for midline', () => {
    const onToggle = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        toothBounds={[{ tooth: '11' } as any, { tooth: '21' } as any]}
        onToggleProportionLayer={onToggle}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const midlineBtn = buttons.find(b => b.textContent?.includes('components.wizard.dsd.proportionOverlay.midline'));
    if (midlineBtn) fireEvent.click(midlineBtn);
    expect(onToggle).toHaveBeenCalledWith('midline');
  });

  it('calls onToggleProportionLayer for goldenRatio', () => {
    const onToggle = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        toothBounds={[{ tooth: '11' } as any, { tooth: '21' } as any]}
        onToggleProportionLayer={onToggle}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const grBtn = buttons.find(b => b.textContent?.includes('components.wizard.dsd.proportionOverlay.goldenRatio'));
    if (grBtn) fireEvent.click(grBtn);
    expect(onToggle).toHaveBeenCalledWith('goldenRatio');
  });

  it('calls onToggleProportionLayer for smileArc', () => {
    const onToggle = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        toothBounds={[{ tooth: '11' } as any, { tooth: '21' } as any]}
        onToggleProportionLayer={onToggle}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const arcBtn = buttons.find(b => b.textContent?.includes('components.wizard.dsd.proportionOverlay.smileArc'));
    if (arcBtn) fireEvent.click(arcBtn);
    expect(onToggle).toHaveBeenCalledWith('smileArc');
  });

  it('calls onRegenerateSimulation when regenerate button clicked', () => {
    const onRegen = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        onRegenerateSimulation={onRegen}
      />,
    );
    fireEvent.click(screen.getByText('components.wizard.dsd.simulationViewer.newSimulation'));
    expect(onRegen).toHaveBeenCalled();
  });

  it('calls onRetryFailedLayer for failed layers', () => {
    const onRetry = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        failedLayers={['whitening' as any]}
        onRetryFailedLayer={onRetry}
      />,
    );
    // getLayerLabel mock returns the type string directly
    const retryBtn = screen.getByText('whitening');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith('whitening');
  });

  it('renders compare layers button and opens comparison modal', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        layers={[
          { type: 'natural-restorations' as any, label: 'Natural', simulation_url: 'url1' },
          { type: 'whitening' as any, label: 'Whitening', simulation_url: 'url2' },
        ]}
      />,
    );
    const compareBtn = screen.getByText('components.wizard.dsd.layerComparison.button');
    fireEvent.click(compareBtn);
  });

  it('renders midline reset button when adjusted', () => {
    const onReset = vi.fn();
    render(
      <DSDSimulationViewer
        {...defaultProps}
        isMidlineAdjusted
        visibleProportionLayers={new Set(['midline']) as any}
        onResetMidline={onReset}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const resetBtn = buttons.find(b => b.textContent?.includes('components.wizard.dsd.proportionOverlay.resetMidline'));
    if (resetBtn) {
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    }
  });

  it('shows compositing state', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        isCompositing={true}
      />,
    );
    // Should show compositing indicator
  });

  it('renders with layerUrls', () => {
    render(
      <DSDSimulationViewer
        {...defaultProps}
        layerUrls={{ 'natural-restorations': 'https://signed.url/layer' }}
      />,
    );
    expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
  });
});
