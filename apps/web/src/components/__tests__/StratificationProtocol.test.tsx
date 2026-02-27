import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StratificationProtocol from '../StratificationProtocol';

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
    }),
  };
});

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    Palette: ({ className }: { className?: string }) => <span data-testid="palette-icon" className={className} />,
    Layers: ({ className }: { className?: string }) => <span data-testid="layers-icon" className={className} />,
    Sparkles: ({ className }: { className?: string }) => <span data-testid="sparkles-icon" className={className} />,
  };
});

// Mock shadcn Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

// Mock shadcn Badge
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const fullProtocol = {
  color_analysis: {
    base_shade: 'A2',
    cervical: 'A3',
    body: 'A2',
    incisal: 'CT',
    effects: ['Opalescência', 'Halo incisal'],
  },
  stratification_layers: [
    { layer: 1, material: 'Resina opaca A3', thickness: '0.5mm', area: 'Parede palatina' },
    { layer: 2, material: 'Resina dentina A2', thickness: '1.0mm', area: 'Corpo' },
    { layer: 3, material: 'Resina esmalte CT', thickness: '0.3mm', area: 'Face vestibular' },
  ],
  texture_notes: 'Texturização com borracha abrasiva para simular periquimácias',
  surface_characteristics: ['Periquimácias', 'Brilho controlado', 'Micro-textura'],
  recommendations: 'Utilizar glicerina durante fotopolimerização final',
};

const minimalProtocol = {
  color_analysis: {
    base_shade: 'B1',
    cervical: 'B2',
    body: 'B1',
    incisal: 'TN',
    effects: [],
  },
  stratification_layers: [
    { layer: 1, material: 'Resina A2', thickness: '1.0mm', area: 'Corpo' },
  ],
  texture_notes: '',
  surface_characteristics: [],
  recommendations: '',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StratificationProtocol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('color analysis card', () => {
    it('should render color analysis section with icon', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
      expect(screen.getByText('components.stratification.colorAnalysis')).toBeInTheDocument();
    });

    it('should display base shade', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.baseShade')).toBeInTheDocument();
      // A2 appears in both base_shade and body, so use getAllByText
      const a2Elements = screen.getAllByText('A2');
      expect(a2Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display cervical shade', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.cervical')).toBeInTheDocument();
      // A3 appears in cervical shade and also in layer material "Resina opaca A3"
      const a3Elements = screen.getAllByText(/A3/);
      expect(a3Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display body shade', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.body')).toBeInTheDocument();
      // A2 is shared between base_shade and body — verify label is present
      const a2Elements = screen.getAllByText('A2');
      expect(a2Elements).toHaveLength(2); // base_shade + body
    });

    it('should display incisal shade', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.incisal')).toBeInTheDocument();
      expect(screen.getByText('CT')).toBeInTheDocument();
    });

    it('should render special effects as badges', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.specialEffects')).toBeInTheDocument();
      expect(screen.getByText('Opalescência')).toBeInTheDocument();
      expect(screen.getByText('Halo incisal')).toBeInTheDocument();

      const badges = screen.getAllByTestId('badge');
      // At minimum the 2 effects badges
      const effectBadges = badges.filter((b) => b.getAttribute('data-variant') === 'secondary');
      expect(effectBadges).toHaveLength(2);
    });

    it('should not render effects section when effects array is empty', () => {
      render(<StratificationProtocol protocol={minimalProtocol} />);

      expect(screen.queryByText('components.stratification.specialEffects')).not.toBeInTheDocument();
    });
  });

  describe('stratification layers card', () => {
    it('should render layers section with icon', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
      expect(screen.getByText('components.stratification.layerProtocol')).toBeInTheDocument();
    });

    it('should render correct number of layers', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      // Each layer has its layer number displayed
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display layer material names', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('Resina opaca A3')).toBeInTheDocument();
      expect(screen.getByText('Resina dentina A2')).toBeInTheDocument();
      expect(screen.getByText('Resina esmalte CT')).toBeInTheDocument();
    });

    it('should display layer thickness and area', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      // thickness • area pattern
      expect(screen.getByText(/0\.5mm/)).toBeInTheDocument();
      expect(screen.getByText(/Parede palatina/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0mm/)).toBeInTheDocument();
      expect(screen.getByText(/Corpo/)).toBeInTheDocument();
      expect(screen.getByText(/0\.3mm/)).toBeInTheDocument();
      expect(screen.getByText(/Face vestibular/)).toBeInTheDocument();
    });

    it('should render single layer when protocol has one layer', () => {
      render(<StratificationProtocol protocol={minimalProtocol} />);

      expect(screen.getByText('Resina A2')).toBeInTheDocument();
      // Only layer number 1 should appear
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('texture and finishing card', () => {
    it('should render texture/finishing section with icon', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
      expect(screen.getByText('components.stratification.textureFinishing')).toBeInTheDocument();
    });

    it('should display texture notes when present', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.textureNotes')).toBeInTheDocument();
      expect(screen.getByText('Texturização com borracha abrasiva para simular periquimácias')).toBeInTheDocument();
    });

    it('should not display texture notes when empty', () => {
      render(<StratificationProtocol protocol={minimalProtocol} />);

      expect(screen.queryByText('components.stratification.textureNotes')).not.toBeInTheDocument();
    });

    it('should display surface characteristics as badges', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.characteristics')).toBeInTheDocument();
      expect(screen.getByText('Periquimácias')).toBeInTheDocument();
      expect(screen.getByText('Brilho controlado')).toBeInTheDocument();
      expect(screen.getByText('Micro-textura')).toBeInTheDocument();

      const badges = screen.getAllByTestId('badge');
      const outlineBadges = badges.filter((b) => b.getAttribute('data-variant') === 'outline');
      expect(outlineBadges).toHaveLength(3);
    });

    it('should not display characteristics section when array is empty', () => {
      render(<StratificationProtocol protocol={minimalProtocol} />);

      expect(screen.queryByText('components.stratification.characteristics')).not.toBeInTheDocument();
    });

    it('should display recommendations when present', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByText('components.stratification.recommendations')).toBeInTheDocument();
      expect(screen.getByText('Utilizar glicerina durante fotopolimerização final')).toBeInTheDocument();
    });

    it('should not display recommendations when empty', () => {
      render(<StratificationProtocol protocol={minimalProtocol} />);

      expect(screen.queryByText('components.stratification.recommendations')).not.toBeInTheDocument();
    });
  });

  describe('overall structure', () => {
    it('should render three cards (color, layers, texture)', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(3);
    });

    it('should render all three section icons', () => {
      render(<StratificationProtocol protocol={fullProtocol} />);

      expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
      expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });
});
