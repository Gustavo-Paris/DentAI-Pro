import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CementationProtocolCard } from '../CementationProtocolCard';

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        if (params) return `${key}(${JSON.stringify(params)})`;
        return key;
      },
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

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e: any) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Crown: ({ className }: any) => <span data-testid="icon-crown" className={className} />,
  Droplets: ({ className }: any) => <span data-testid="icon-droplets" className={className} />,
  Sparkles: ({ className }: any) => <span data-testid="icon-sparkles" className={className} />,
  CheckCircle: ({ className }: any) => <span data-testid="icon-check" className={className} />,
  AlertTriangle: ({ className }: any) => <span data-testid="icon-alert" className={className} />,
  ClipboardCheck: ({ className }: any) => <span data-testid="icon-clipboard" className={className} />,
}));

// -- Fixtures --

function makeProtocol(overrides: Record<string, unknown> = {}) {
  return {
    ceramic_treatment: [
      { order: 1, step: 'Aplicar ácido fluorídrico 5%', material: 'Condac Porcelana', time: '20s' },
      { order: 2, step: 'Aplicar silano', material: 'Silano Angelus', time: '60s', technique: 'Camada ativa' },
    ],
    tooth_treatment: [
      { order: 1, step: 'Condicionamento ácido', material: 'Ácido fosfórico 37%', time: '15s' },
    ],
    cementation: {
      cement_type: 'Cimento resinoso fotopolimerizável',
      cement_brand: 'Variolink Esthetic LC',
      shade: 'Neutral',
      light_curing_time: '40s por face',
      technique: 'Aplicar em camada fina na peça e assentar',
    },
    finishing: [
      { order: 1, step: 'Remoção de excessos', material: 'Lâmina 12' },
    ],
    post_operative: ['Evitar alimentos duros por 24h', 'Retorno em 7 dias'],
    checklist: ['Verificar adaptação marginal', 'Checar oclusão'],
    alerts: ['Não usar cimento dual neste caso'],
    warnings: ['Atenção à margem gengival'],
    confidence: 'alta' as const,
    ...overrides,
  };
}

// -- Tests --

describe('CementationProtocolCard', () => {
  it('renders the title and confidence badge', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('components.protocol.cementation.title')).toBeInTheDocument();
    expect(screen.getByText('components.protocol.cementation.confidence({"level":"alta"})')).toBeInTheDocument();
  });

  it('renders ceramic treatment steps in correct order', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Aplicar ácido fluorídrico 5%')).toBeInTheDocument();
    expect(screen.getByText('Aplicar silano')).toBeInTheDocument();
    expect(screen.getByText('Condac Porcelana')).toBeInTheDocument();
  });

  it('renders tooth treatment steps', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Condicionamento ácido')).toBeInTheDocument();
    expect(screen.getByText('Ácido fosfórico 37%')).toBeInTheDocument();
  });

  it('renders cementation details', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Cimento resinoso fotopolimerizável')).toBeInTheDocument();
    expect(screen.getByText('Variolink Esthetic LC')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('40s por face')).toBeInTheDocument();
  });

  it('renders post-operative instructions', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Evitar alimentos duros por 24h')).toBeInTheDocument();
    expect(screen.getByText('Retorno em 7 dias')).toBeInTheDocument();
  });

  it('renders alerts section', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Não usar cimento dual neste caso')).toBeInTheDocument();
  });

  it('renders warnings section', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Atenção à margem gengival')).toBeInTheDocument();
  });

  it('hides alerts section when alerts is empty', () => {
    render(<CementationProtocolCard protocol={makeProtocol({ alerts: [] })} />);
    expect(screen.queryByText('components.protocol.cementation.doNot')).not.toBeInTheDocument();
  });

  it('hides warnings section when warnings is empty', () => {
    render(<CementationProtocolCard protocol={makeProtocol({ warnings: [] })} />);
    expect(screen.queryByText('components.protocol.cementation.attentionPoints')).not.toBeInTheDocument();
  });

  it('hides post-operative section when empty', () => {
    render(<CementationProtocolCard protocol={makeProtocol({ post_operative: [] })} />);
    expect(screen.queryByText('components.protocol.cementation.postOperative')).not.toBeInTheDocument();
  });

  it('hides preparation steps when not provided', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.queryByText('components.protocol.cementation.prepSteps')).not.toBeInTheDocument();
  });

  it('shows preparation steps when provided', () => {
    const protocol = makeProtocol({
      preparation_steps: [
        { order: 1, step: 'Limpeza com pedra pomes', material: 'Pedra pomes' },
      ],
    });
    render(<CementationProtocolCard protocol={protocol} />);
    expect(screen.getByText('components.protocol.cementation.prepSteps')).toBeInTheDocument();
    expect(screen.getByText('Limpeza com pedra pomes')).toBeInTheDocument();
  });

  it('renders checklist with checkboxes', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Verificar adaptação marginal')).toBeInTheDocument();
    expect(screen.getByText('Checar oclusão')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('calls onProgressChange when checklist item is toggled', () => {
    const onProgressChange = vi.fn();
    render(
      <CementationProtocolCard
        protocol={makeProtocol()}
        checkedIndices={[]}
        onProgressChange={onProgressChange}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(onProgressChange).toHaveBeenCalledWith([0]);
  });

  it('removes index from checkedIndices on uncheck', () => {
    const onProgressChange = vi.fn();
    render(
      <CementationProtocolCard
        protocol={makeProtocol()}
        checkedIndices={[0, 1]}
        onProgressChange={onProgressChange}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // The mock Checkbox calls onCheckedChange(e.target.checked) on change
    // Simulating uncheck by clicking on a checked checkbox
    fireEvent.click(checkboxes[0]);
    expect(onProgressChange).toHaveBeenCalledWith([1]);
  });

  it('renders step technique when provided', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    expect(screen.getByText('Camada ativa')).toBeInTheDocument();
  });

  it('renders step time when provided', () => {
    render(<CementationProtocolCard protocol={makeProtocol()} />);
    // Time values are prefixed with the clock emoji in the component
    expect(screen.getAllByText(/20s/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/60s/).length).toBeGreaterThanOrEqual(1);
  });
});
