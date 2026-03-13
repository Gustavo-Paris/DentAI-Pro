import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProportionsCard } from '../ProportionsCard';
import type { DSDAnalysis } from '@/types/dsd';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

vi.mock('lucide-react', () => {
  const S = (props: any) => <span data-testid="icon" {...props} />;
  return {
    Check: S, X: S, AlertCircle: S, Minus: S,
    ChevronDown: S, ChevronUp: S,
    Layers: S, Crown: S, Stethoscope: S, ArrowUpRight: S,
    CircleX: S, Smile: S, HeartPulse: S,
  };
});

vi.mock('@/lib/treatment-config', () => ({
  getTreatmentConfig: () => ({
    showCavityInfo: false,
    icon: (p: any) => <span {...p} />,
    labelKey: 'mock',
  }),
}));

const baseAnalysis: DSDAnalysis = {
  confidence: 'alta',
  facial_midline: 'centrada',
  dental_midline: 'alinhada',
  smile_line: 'média',
  buccal_corridor: 'adequado',
  occlusal_plane: 'nivelado',
  golden_ratio_compliance: 85,
  symmetry_score: 90,
  suggestions: [],
  observations: [],
};

describe('ProportionsCard', () => {
  it('renders with good values', () => {
    render(<ProportionsCard analysis={baseAnalysis} />);
    expect(screen.getByText('components.dsd.proportions.title')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('shows pre-treatment note when scores are low', () => {
    const lowScores = { ...baseAnalysis, golden_ratio_compliance: 50, symmetry_score: 40 };
    render(<ProportionsCard analysis={lowScores} />);
    expect(screen.getByText('components.dsd.proportions.preTreatmentNote')).toBeInTheDocument();
  });

  it('shows lip thickness when present', () => {
    const withLip = { ...baseAnalysis, lip_thickness: 'fino' as const };
    render(<ProportionsCard analysis={withLip} />);
    expect(screen.getByText('components.dsd.proportions.lipThickness')).toBeInTheDocument();
  });

  it('shows overbite when sim', () => {
    const withOverbite = { ...baseAnalysis, overbite_suspicion: 'sim' as const };
    render(<ProportionsCard analysis={withOverbite} />);
    expect(screen.getByText('components.dsd.proportions.overbite')).toBeInTheDocument();
  });

  it('hides overbite when indeterminado', () => {
    const withOverbite = { ...baseAnalysis, overbite_suspicion: 'indeterminado' as const };
    render(<ProportionsCard analysis={withOverbite} />);
    expect(screen.queryByText('components.dsd.proportions.overbite')).not.toBeInTheDocument();
  });

  it('shows buccal corridor ortho note for excessivo', () => {
    const excessivo = { ...baseAnalysis, buccal_corridor: 'excessivo' as const };
    render(<ProportionsCard analysis={excessivo} />);
    expect(screen.getByText('components.dsd.proportions.buccalCorridorOrthoNote')).toBeInTheDocument();
  });

  it('shows gingival zenith patterns when gengivoplastia suggested', () => {
    const withGingivo = {
      ...baseAnalysis,
      suggestions: [{ tooth: '11', current_issue: 'x', proposed_change: 'y', treatment_indication: 'gengivoplastia' }],
    };
    render(<ProportionsCard analysis={withGingivo} />);
    expect(screen.getByText('components.dsd.proportions.gingivalZenithTitle')).toBeInTheDocument();
  });

  it('shows measurable observations', () => {
    const withObs = {
      ...baseAnalysis,
      observations: ['Desvio de 2.5mm para esquerda', 'Normal text'],
    };
    render(<ProportionsCard analysis={withObs} />);
    expect(screen.getByText('components.dsd.proportions.measurableData')).toBeInTheDocument();
    expect(screen.getByText('Desvio de 2.5mm para esquerda')).toBeInTheDocument();
  });

  it('toggles reference values', () => {
    render(<ProportionsCard analysis={baseAnalysis} />);
    const button = screen.getByText('components.dsd.proportions.referenceValues');
    fireEvent.click(button);
    expect(screen.getByText('components.dsd.proportions.refGoldenRatio')).toBeInTheDocument();
  });
});
