import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CaseSummaryBox from '../CaseSummaryBox';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { User: S, MapPin: S, Layers: S, Palette: S, Info: S };
});

vi.mock('@/lib/treatment-config', () => ({
  getTreatmentConfig: (type: string) => ({
    showCavityInfo: type === 'resina',
    icon: (p: any) => <span data-testid="treatment-icon" {...p} />,
    labelKey: `treatments.${type}.label`,
  }),
}));

vi.mock('@/lib/clinical-enums', () => ({
  tEnum: (_t: any, _ns: string, val: string) => val,
}));

describe('CaseSummaryBox', () => {
  const baseProps = {
    patientAge: 35,
    tooth: '11',
    region: 'Anterior Superior',
    toothColor: 'A2',
    aestheticLevel: 'alto',
    bruxism: false,
    stratificationNeeded: true,
  };

  it('renders patient info', () => {
    render(<CaseSummaryBox {...baseProps} />);
    expect(screen.getByText('components.protocol.caseSummary.title')).toBeInTheDocument();
    expect(screen.getByText(/components\.protocol\.caseSummary\.yearsOld/)).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('Anterior Superior')).toBeInTheDocument();
  });

  it('renders cavity info for resina', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        treatmentType="resina"
        cavityClass="Classe III"
        restorationSize="grande"
      />,
    );
    expect(screen.getByText('Classe III')).toBeInTheDocument();
  });

  it('renders treatment type for non-resina', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        treatmentType="porcelana"
      />,
    );
    const matches = screen.getAllByText('treatments.porcelana.label');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows bruxism badge when true', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        bruxism
      />,
    );
    expect(screen.getByText('components.protocol.caseSummary.bruxism')).toBeInTheDocument();
  });

  it('handles GENGIVO tooth', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        tooth="GENGIVO"
        treatmentType="gengivoplastia"
      />,
    );
    expect(screen.getByText('components.protocol.caseSummary.gingiva')).toBeInTheDocument();
  });

  it('shows target shade for whitening', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        treatmentType="porcelana"
        whiteningGoal="whitening_hollywood"
      />,
    );
    expect(screen.getByText('BL1/BL2/BL3')).toBeInTheDocument();
  });

  it('shows secondary photos', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        secondaryPhotos={{ angle45: 'photo45.jpg', face: 'face.jpg' }}
      />,
    );
    const images = screen.getAllByRole('presentation');
    expect(images.length).toBe(2);
  });

  it('shows indication reason for non-resina', () => {
    render(
      <CaseSummaryBox
        {...baseProps}
        treatmentType="endodontia"
        indicationReason="pulpite_irreversivel"
      />,
    );
    // t() mock appends defaultValue param as JSON
    expect(screen.getByText('indicationReasons.pulpite_irreversivel:{"defaultValue":"pulpite_irreversivel"}')).toBeInTheDocument();
  });
});
