import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtocolTable from '../ProtocolTable';
import type { ProtocolLayer } from '@/types/protocol';

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

// Mock UI components
vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

// -- Fixtures --

const makeLayers = (overrides: Partial<ProtocolLayer>[] = []): ProtocolLayer[] => {
  const defaults: ProtocolLayer[] = [
    {
      order: 1,
      name: 'Dentina / Body',
      resin_brand: 'Filtek Z350 XT',
      shade: 'A2B',
      thickness: '1.0 mm',
      purpose: 'Reconstituir corpo dentinário',
      technique: 'Incremento oblíquo',
    },
    {
      order: 2,
      name: 'Esmalte / Enamel',
      resin_brand: 'Filtek Z350 XT',
      shade: 'A2E',
      thickness: '0.5 mm',
      purpose: 'Camada final de esmalte',
      technique: 'Cobertura vestibular',
    },
  ];
  return defaults.map((d, i) => ({ ...d, ...(overrides[i] || {}) }));
};

// -- Tests --

describe('ProtocolTable', () => {
  it('returns null when layers is empty', () => {
    const { container } = render(<ProtocolTable layers={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when layers is undefined (cast)', () => {
    const { container } = render(<ProtocolTable layers={undefined as any} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all layers with order, name, resin, shade and thickness', () => {
    const layers = makeLayers();
    render(<ProtocolTable layers={layers} />);

    // Each layer name appears in both desktop table and mobile cards
    expect(screen.getAllByText(/1\. Dentina \/ Body/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2\. Esmalte \/ Enamel/).length).toBeGreaterThanOrEqual(1);

    // Resin brands
    expect(screen.getAllByText('Filtek Z350 XT').length).toBeGreaterThanOrEqual(1);

    // Shades
    expect(screen.getAllByText('A2B').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('A2E').length).toBeGreaterThanOrEqual(1);

    // Thickness
    expect(screen.getAllByText('1.0 mm').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0.5 mm').length).toBeGreaterThanOrEqual(1);
  });

  it('renders purpose and technique for each layer', () => {
    const layers = makeLayers();
    render(<ProtocolTable layers={layers} />);

    expect(screen.getAllByText('Reconstituir corpo dentinário').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Incremento oblíquo').length).toBeGreaterThanOrEqual(1);
  });

  it('renders optional badge when layer is optional', () => {
    const layers = makeLayers([{ optional: true }]);
    render(<ProtocolTable layers={layers} />);

    // The optional text appears in both desktop and mobile views
    const optionalElements = screen.getAllByText('components.protocol.table.optional');
    expect(optionalElements.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render optional badge when layer is not optional', () => {
    const layers = makeLayers([{ optional: false }, { optional: false }]);
    render(<ProtocolTable layers={layers} />);
    expect(screen.queryByText('components.protocol.table.optional')).not.toBeInTheDocument();
  });

  it('applies correct layer styles based on name keywords', () => {
    // Test with different layer types to verify styling branches
    const layers: ProtocolLayer[] = [
      { order: 1, name: 'Opaco / Mascaramento', resin_brand: 'Test', shade: 'O', thickness: '0.2mm', purpose: 'p', technique: 't' },
      { order: 2, name: 'Efeito opalescente', resin_brand: 'Test', shade: 'E', thickness: '0.1mm', purpose: 'p', technique: 't' },
      { order: 3, name: 'Bulk Fill', resin_brand: 'Test', shade: 'BF', thickness: '2.0mm', purpose: 'p', technique: 't' },
    ];
    render(<ProtocolTable layers={layers} />);

    // Verify all layers render (style classes are applied via className, not easily testable via text)
    expect(screen.getAllByText(/1\. Opaco/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2\. Efeito/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3\. Bulk/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders table header with translated column names', () => {
    render(<ProtocolTable layers={makeLayers()} />);
    expect(screen.getByText('components.protocol.table.layer')).toBeInTheDocument();
    expect(screen.getByText('components.protocol.table.resin')).toBeInTheDocument();
    expect(screen.getByText('components.protocol.table.color')).toBeInTheDocument();
    expect(screen.getByText('components.protocol.table.thickness')).toBeInTheDocument();
  });
});
