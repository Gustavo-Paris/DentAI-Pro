import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DSDAnalysisView } from '../DSDAnalysisView';
import type { DSDResult, DSDAnalysis } from '@/types/dsd';
import { createRef } from 'react';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return {
    Smile: S, Loader2: S, RefreshCw: S, Lightbulb: S, AlertCircle: S,
    Zap: S, ArrowRight: S, CheckCircle: S, XCircle: S,
    Palette: S, Check: S, Eye: S, User: S, Ruler: S, Ratio: S,
    SmilePlus: S, Columns2: S, SlidersHorizontal: S, SplitSquareHorizontal: S,
    Image: S, ImageOff: S, Info: S, GripVertical: S, ZoomIn: S, ZoomOut: S, Maximize: S,
    Crown: S, Stethoscope: S, ArrowUpRight: S, CircleX: S, HeartPulse: S,
    ChevronDown: S, ChevronUp: S, Minus: S, X: S, Sparkles: S,
  };
});

vi.mock('@/components/dsd/ProportionsCard', () => ({
  ProportionsCard: () => <div data-testid="proportions-card" />,
}));

vi.mock('../DSDSimulationViewer', () => ({
  default: () => <div data-testid="simulation-viewer" />,
}));

vi.mock('../DSDWhiteningComparison', () => ({
  DSDWhiteningComparison: () => <div data-testid="whitening-comparison" />,
}));

vi.mock('@/components/skeletons', () => ({
  ComponentSkeleton: () => <div data-testid="skeleton" />,
}));

const baseAnalysis: DSDAnalysis = {
  confidence: 'alta',
  facial_midline: 'centrada',
  dental_midline: 'alinhada',
  smile_line: 'media',
  buccal_corridor: 'adequado',
  occlusal_plane: 'nivelado',
  golden_ratio_compliance: 85,
  symmetry_score: 90,
  suggestions: [
    { tooth: '11', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'resina' },
  ],
  observations: ['Observation 1'],
};

const baseResult: DSDResult = {
  analysis: baseAnalysis,
};

const noop = vi.fn();

const defaultProps = {
  result: baseResult,
  imageBase64: 'data:image/jpeg;base64,abc',
  simulationImageUrl: 'sim.jpg',
  isSimulationGenerating: false,
  simulationError: false,
  layers: [{ type: 'natural-restorations' as const, label: 'Natural', simulation_url: 'url' }],
  activeLayerIndex: 0,
  layersGenerating: false,
  layerGenerationProgress: 0,
  failedLayers: [] as any[],
  retryingLayer: null,
  isRegeneratingSimulation: false,
  isCompositing: false,
  showAnnotations: false,
  toothBounds: [],
  annotationContainerRef: createRef<HTMLDivElement>(),
  annotationDimensions: { width: 800, height: 600 },
  visibleProportionLayers: new Set() as any,
  onToggleProportionLayer: noop,
  showWhiteningComparison: false,
  whiteningComparison: {},
  isComparingWhitening: false,
  determineLayersNeeded: () => ['natural-restorations' as const],
  onSelectLayer: noop,
  onRetryFailedLayer: noop,
  onRegenerateSimulation: noop,
  onToggleAnnotations: noop,
  onGenerateWhiteningComparison: noop,
  onCloseWhiteningComparison: noop,
  onSelectWhiteningLevel: noop,
  onGenerateAllLayers: noop,
  onRetry: noop,
  onContinue: noop,
  gingivoplastyApproved: null,
  gingivoConfidence: 'none' as const,
  onApproveGingivoplasty: noop,
  onDiscardGingivoplasty: noop,
};

describe('DSDAnalysisView', () => {
  it('renders title and confidence badge', () => {
    render(<DSDAnalysisView {...defaultProps} />);
    expect(screen.getByText('components.wizard.dsd.analysisView.title')).toBeInTheDocument();
    expect(screen.getByText(/components\.wizard\.dsd\.analysisView\.confidence/)).toBeInTheDocument();
  });

  it('renders proportions card', () => {
    render(<DSDAnalysisView {...defaultProps} />);
    expect(screen.getByTestId('proportions-card')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<DSDAnalysisView {...defaultProps} />);
    expect(screen.getByText(/components\.wizard\.dsd\.analysisView\.retryAnalysis/)).toBeInTheDocument();
    expect(screen.getByText(/components\.wizard\.dsd\.analysisView\.continueToReview/)).toBeInTheDocument();
  });

  it('calls onContinue when continue button clicked', () => {
    const onContinue = vi.fn();
    render(<DSDAnalysisView {...defaultProps} onContinue={onContinue} />);
    fireEvent.click(screen.getByText(/components\.wizard\.dsd\.analysisView\.continueToReview/));
    expect(onContinue).toHaveBeenCalled();
  });

  it('shows limitations alert for low confidence', () => {
    const lowResult = { ...baseResult, analysis: { ...baseAnalysis, confidence: 'baixa' as const } };
    render(<DSDAnalysisView {...defaultProps} result={lowResult} />);
    expect(screen.getByText('components.wizard.dsd.analysisView.limitationsTitle')).toBeInTheDocument();
  });

  it('shows overbite alert', () => {
    const overResult = { ...baseResult, analysis: { ...baseAnalysis, overbite_suspicion: 'sim' as const } };
    render(<DSDAnalysisView {...defaultProps} result={overResult} />);
    expect(screen.getByText('components.wizard.dsd.analysisView.overbiteSuspicion')).toBeInTheDocument();
  });

  it('shows gingivoplasty approval card when recommended', () => {
    render(
      <DSDAnalysisView
        {...defaultProps}
        gingivoConfidence="recommended"
      />,
    );
    expect(screen.getByText('components.wizard.dsd.analysisView.gingivoplastyDetected')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.dsd.analysisView.approveGingivoplasty')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.dsd.analysisView.discardGingivoplasty')).toBeInTheDocument();
  });

  it('shows approved gingivoplasty confirmation', () => {
    render(
      <DSDAnalysisView
        {...defaultProps}
        gingivoplastyApproved={true}
        gingivoConfidence="recommended"
      />,
    );
    expect(screen.getByText('components.wizard.dsd.analysisView.gingivoplastyApproved')).toBeInTheDocument();
  });

  it('shows discarded gingivoplasty confirmation', () => {
    render(
      <DSDAnalysisView
        {...defaultProps}
        gingivoplastyApproved={false}
        gingivoConfidence="recommended"
      />,
    );
    expect(screen.getByText('components.wizard.dsd.analysisView.gingivoplastyDiscarded')).toBeInTheDocument();
  });

  it('shows simulation generating card', () => {
    render(
      <DSDAnalysisView
        {...defaultProps}
        isSimulationGenerating={true}
        simulationImageUrl={null}
        layers={[]}
      />,
    );
    expect(screen.getByText(/components\.wizard\.dsd\.analysisView\.generatingLayerOf/)).toBeInTheDocument();
  });

  it('shows simulation error card', () => {
    render(
      <DSDAnalysisView
        {...defaultProps}
        simulationError={true}
        simulationImageUrl={null}
        layers={[]}
      />,
    );
    expect(screen.getByText('components.wizard.dsd.analysisView.simulationAutoError')).toBeInTheDocument();
  });

  it('renders observations', () => {
    render(<DSDAnalysisView {...defaultProps} />);
    expect(screen.getByText('Observation 1')).toBeInTheDocument();
  });

  it('renders suggestions card', () => {
    render(<DSDAnalysisView {...defaultProps} />);
    expect(screen.getByText('components.wizard.dsd.analysisView.treatmentSuggestions')).toBeInTheDocument();
  });

  it('shows attention observations', () => {
    const attentionResult = {
      ...baseResult,
      analysis: {
        ...baseAnalysis,
        observations: ['ATENCAO: Desalinhamento importante'],
      },
    };
    render(<DSDAnalysisView {...defaultProps} result={attentionResult} />);
    expect(screen.getByText('components.wizard.dsd.analysisView.attentionPoints')).toBeInTheDocument();
  });
});
