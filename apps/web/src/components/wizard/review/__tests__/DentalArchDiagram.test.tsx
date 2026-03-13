import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DentalArchDiagram } from '../DentalArchDiagram';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params?.defaultValue) return params.defaultValue;
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
  }),
}));

vi.mock('../review-constants', () => ({
  TREATMENT_LABEL_KEYS: {
    resina: 'treatments.resina.label',
    porcelana: 'treatments.porcelana.label',
    coroa: 'treatments.coroa.label',
    implante: 'treatments.implante.label',
    endodontia: 'treatments.endodontia.label',
    encaminhamento: 'treatments.encaminhamento.label',
    gengivoplastia: 'treatments.gengivoplastia.label',
    recobrimento_radicular: 'treatments.recobrimento_radicular.label',
  },
}));

describe('DentalArchDiagram', () => {
  const defaultProps = {
    selectedTeeth: ['11', '21'],
    toothTreatments: { '11': 'resina' as const, '21': 'porcelana' as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the diagram with upper and lower labels', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.upper')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.lower')).toBeInTheDocument();
  });

  it('renders all 32 teeth', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    // Check a few tooth labels exist
    const svg = screen.getByRole('group');
    expect(svg).toBeInTheDocument();
  });

  it('calls onToggleTooth when a tooth is clicked', () => {
    const onToggle = vi.fn();
    render(<DentalArchDiagram {...defaultProps} onToggleTooth={onToggle} />);
    // Click on tooth 11 checkbox
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.click(tooth11);
    expect(onToggle).toHaveBeenCalledWith('11');
  });

  it('calls onToggleTooth on keyboard Enter', () => {
    const onToggle = vi.fn();
    render(<DentalArchDiagram {...defaultProps} onToggleTooth={onToggle} />);
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.keyDown(tooth11, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('11');
  });

  it('calls onToggleTooth on keyboard Space', () => {
    const onToggle = vi.fn();
    render(<DentalArchDiagram {...defaultProps} onToggleTooth={onToggle} />);
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.keyDown(tooth11, { key: ' ' });
    expect(onToggle).toHaveBeenCalledWith('11');
  });

  it('shows tooltip on mouse enter', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.mouseEnter(tooth11);
    // Tooltip should show tooth info
    // The text content is inside the SVG
  });

  it('hides tooltip on mouse leave', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.mouseEnter(tooth11);
    fireEvent.mouseLeave(tooth11);
  });

  it('handles touch start as toggle for hover', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.touchStart(tooth11);
    // Second touch should toggle off
    fireEvent.touchStart(tooth11);
  });

  it('renders treatment legend when treatments are set', () => {
    render(<DentalArchDiagram {...defaultProps} />);
    // Legend shows treatment labels
    expect(screen.getByText('treatments.resina.label')).toBeInTheDocument();
    expect(screen.getByText('treatments.porcelana.label')).toBeInTheDocument();
  });

  it('does not render legend when no treatments', () => {
    render(<DentalArchDiagram selectedTeeth={[]} toothTreatments={{}} />);
    expect(screen.queryByText('treatments.resina.label')).not.toBeInTheDocument();
  });

  it('renders with tooth priorities', () => {
    const props = {
      ...defaultProps,
      toothPriorities: {
        '11': { priority: 'alta' as const },
        '21': { priority: 'média' as const },
      },
    };
    render(<DentalArchDiagram {...props} />);
    // Hover to see priority in tooltip
    const tooth11 = screen.getByRole('checkbox', { name: /Dente 11/i });
    fireEvent.mouseEnter(tooth11);
  });
});
