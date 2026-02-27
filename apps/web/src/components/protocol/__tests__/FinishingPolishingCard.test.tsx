import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FinishingPolishingCard from '../FinishingPolishingCard';
import type { FinishingProtocol } from '@/types/protocol';

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
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

vi.mock('lucide-react', () => ({
  Sparkles: ({ className }: any) => <span data-testid="icon-sparkles" className={className} />,
}));

// -- Fixtures --

function makeFinishingProtocol(overrides: Partial<FinishingProtocol> = {}): FinishingProtocol {
  return {
    contouring: [
      { order: 1, tool: 'Ponta diamantada FF', grit: '30 \u00b5m', speed: 'Alta rotação', time: '15-20s', tip: 'Movimentos leves e contínuos' },
    ],
    polishing: [
      { order: 1, tool: 'Disco Sof-Lex laranja', speed: 'Baixa rotação', time: '20s', tip: 'Sem pressão excessiva' },
      { order: 2, tool: 'Disco Sof-Lex amarelo', grit: 'Superfino', speed: 'Baixa rotação', time: '20s', tip: 'Brilho final' },
    ],
    final_glaze: 'Biscover LV - fotopolimerizar 20s',
    maintenance_advice: 'Repolir a cada 12 meses em retornos periódicos',
    ...overrides,
  };
}

// -- Tests --

describe('FinishingPolishingCard', () => {
  it('returns null when protocol is undefined (cast)', () => {
    const { container } = render(<FinishingPolishingCard protocol={undefined as any} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the card title', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText('components.protocol.finishingPolishing.title')).toBeInTheDocument();
  });

  it('renders contouring section with steps', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText('components.protocol.finishingPolishing.contouring')).toBeInTheDocument();
    expect(screen.getByText('Ponta diamantada FF')).toBeInTheDocument();
    expect(screen.getByText('30 \u00b5m')).toBeInTheDocument();
  });

  it('renders polishing section with steps', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText('components.protocol.finishingPolishing.sequentialPolishing')).toBeInTheDocument();
    expect(screen.getByText('Disco Sof-Lex laranja')).toBeInTheDocument();
    expect(screen.getByText('Disco Sof-Lex amarelo')).toBeInTheDocument();
  });

  it('renders final glaze when provided', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText('components.protocol.finishingPolishing.finalGlaze')).toBeInTheDocument();
    expect(screen.getByText('Biscover LV - fotopolimerizar 20s')).toBeInTheDocument();
  });

  it('hides final glaze when not provided', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol({ final_glaze: undefined })} />);
    expect(screen.queryByText('components.protocol.finishingPolishing.finalGlaze')).not.toBeInTheDocument();
  });

  it('renders maintenance advice', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText('components.protocol.finishingPolishing.maintenance')).toBeInTheDocument();
    expect(screen.getByText('Repolir a cada 12 meses em retornos periódicos')).toBeInTheDocument();
  });

  it('hides contouring section when empty', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol({ contouring: [] })} />);
    expect(screen.queryByText('components.protocol.finishingPolishing.contouring')).not.toBeInTheDocument();
  });

  it('hides polishing section when empty', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol({ polishing: [] })} />);
    expect(screen.queryByText('components.protocol.finishingPolishing.sequentialPolishing')).not.toBeInTheDocument();
  });

  it('renders step grit badge only when grit is provided', () => {
    const protocol = makeFinishingProtocol({
      contouring: [],
      polishing: [
        { order: 1, tool: 'No-grit tool', speed: 'Low', time: '10s', tip: 'Be gentle' },
      ],
    });
    render(<FinishingPolishingCard protocol={protocol} />);
    // The tool renders but no grit badge should appear
    expect(screen.getByText('No-grit tool')).toBeInTheDocument();
    const badges = screen.queryAllByTestId('badge');
    expect(badges.length).toBe(0);
  });

  it('renders step tips', () => {
    render(<FinishingPolishingCard protocol={makeFinishingProtocol()} />);
    expect(screen.getByText(/Movimentos leves e contínuos/)).toBeInTheDocument();
    expect(screen.getByText(/Sem pressão excessiva/)).toBeInTheDocument();
  });
});
