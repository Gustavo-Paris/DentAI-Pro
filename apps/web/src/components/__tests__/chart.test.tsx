import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
  type ChartConfig,
} from '../chart';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const config: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  expenses: {
    label: 'Expenses',
    theme: { light: '#ff0000', dark: '#cc0000' },
  },
};

describe('ChartContainer', () => {
  it('renders with config and children', () => {
    render(
      <ChartContainer config={config}>
        <div data-testid="chart-child">Chart content</div>
      </ChartContainer>,
    );
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('chart-child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartContainer config={config} className="custom-class">
        <div>Content</div>
      </ChartContainer>,
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('generates data-chart attribute', () => {
    const { container } = render(
      <ChartContainer config={config} id="test-chart">
        <div>Content</div>
      </ChartContainer>,
    );
    expect(container.querySelector('[data-chart="chart-test-chart"]')).toBeInTheDocument();
  });
});

describe('ChartStyle', () => {
  it('renders style element with CSS variables', () => {
    const { container } = render(<ChartStyle id="test" config={config} />);
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style!.innerHTML).toContain('--color-revenue');
  });

  it('returns null when no color config', () => {
    const noColorConfig: ChartConfig = {
      item: { label: 'Item' },
    };
    const { container } = render(<ChartStyle id="test" config={noColorConfig} />);
    expect(container.querySelector('style')).not.toBeInTheDocument();
  });
});

describe('ChartTooltipContent', () => {
  it('returns null when not active', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>,
    );
    // The tooltip content itself should not render, but ChartContainer wraps it
    expect(container.querySelector('.grid')).not.toBeInTheDocument();
  });

  it('renders when active with payload', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 1000,
              color: '#3b82f6',
              payload: { revenue: 1000 },
            },
          ]}
          label="Jan"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('hides label when hideLabel is true', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          hideLabel
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 500,
              color: '#3b82f6',
              payload: { revenue: 500 },
            },
          ]}
          label="Jan"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});

describe('ChartLegendContent', () => {
  it('returns null with no payload', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>,
    );
    // Only ChartContainer wrapper, no legend content
    expect(container.querySelectorAll('.flex.items-center.justify-center').length).toBe(0);
  });

  it('renders legend items with payload', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent
          payload={[
            { value: 'revenue', dataKey: 'revenue', color: '#3b82f6' },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders legend with verticalAlign top', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartLegendContent
          verticalAlign="top"
          payload={[
            { value: 'revenue', dataKey: 'revenue', color: '#3b82f6' },
          ]}
        />
      </ChartContainer>,
    );
    expect(container.querySelector('.pb-3')).toBeInTheDocument();
  });

  it('renders legend with hideIcon', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent
          hideIcon
          payload={[
            { value: 'revenue', dataKey: 'revenue', color: '#3b82f6' },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders legend with nameKey', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent
          nameKey="dataKey"
          payload={[
            { value: 'revenue', dataKey: 'revenue', color: '#3b82f6' },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('returns null with undefined payload', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={undefined as any} />
      </ChartContainer>,
    );
    expect(container.querySelectorAll('.flex.items-center.justify-center').length).toBe(0);
  });
});

describe('ChartTooltipContent - additional branches', () => {
  it('renders with indicator=line', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          indicator="line"
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 1000,
              color: '#3b82f6',
              payload: { revenue: 1000 },
            },
          ]}
          label="Jan"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders with indicator=dashed', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          indicator="dashed"
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 500,
              color: '#3b82f6',
              payload: { revenue: 500 },
            },
          ]}
          label="Feb"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders with hideIndicator', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          hideIndicator
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 750,
              color: '#3b82f6',
              payload: { revenue: 750 },
            },
          ]}
          label="Mar"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('750')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          color="#ff0000"
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 200,
              color: '#3b82f6',
              payload: { revenue: 200 },
            },
          ]}
          label="Apr"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders with labelFormatter', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 300,
              color: '#3b82f6',
              payload: { revenue: 300 },
            },
          ]}
          label="May"
          labelFormatter={(value) => `Custom: ${value}`}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Custom: May')).toBeInTheDocument();
  });

  it('renders with formatter', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 400,
              color: '#3b82f6',
              payload: { revenue: 400 },
            },
          ]}
          label="Jun"
          formatter={(value: any) => <span data-testid="custom-format">{value}</span>}
        />
      </ChartContainer>,
    );
    expect(screen.getByTestId('custom-format')).toBeInTheDocument();
  });

  it('renders with labelKey', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          labelKey="revenue"
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 600,
              color: '#3b82f6',
              payload: { revenue: 600 },
            },
          ]}
          label="Jul"
        />
      </ChartContainer>,
    );
    expect(screen.getAllByText('Revenue').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with nameKey', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          nameKey="dataKey"
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 800,
              color: '#3b82f6',
              payload: { revenue: 800 },
            },
          ]}
          label="Aug"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders with empty label and no labelKey', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 900,
              color: '#3b82f6',
              payload: { revenue: 900 },
            },
          ]}
        />
      </ChartContainer>,
    );
    expect(screen.getByText('900')).toBeInTheDocument();
  });

  it('renders with multiple payload items', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 1000,
              color: '#3b82f6',
              payload: { revenue: 1000, expenses: 500 },
            },
            {
              dataKey: 'expenses',
              name: 'expenses',
              value: 500,
              color: '#ff0000',
              payload: { revenue: 1000, expenses: 500 },
            },
          ]}
          label="Sep"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders with payload fill color', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active={true}
          payload={[
            {
              dataKey: 'revenue',
              name: 'revenue',
              value: 100,
              color: '#3b82f6',
              payload: { revenue: 100, fill: '#00ff00' },
            },
          ]}
          label="Oct"
        />
      </ChartContainer>,
    );
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});

describe('ChartContainer - additional branches', () => {
  it('renders without id (auto-generated)', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <div>Content</div>
      </ChartContainer>,
    );
    expect(container.querySelector('[data-chart]')).toBeInTheDocument();
  });
});

describe('ChartStyle - additional branches', () => {
  it('renders CSS with theme colors', () => {
    const themeConfig: ChartConfig = {
      revenue: {
        label: 'Revenue',
        theme: { light: '#0000ff', dark: '#0000cc' },
      },
    };
    const { container } = render(<ChartStyle id="test-theme" config={themeConfig} />);
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style!.innerHTML).toContain('--color-revenue');
  });

  it('renders CSS with mixed color and theme', () => {
    const mixedConfig: ChartConfig = {
      a: { label: 'A', color: '#ff0000' },
      b: { label: 'B', theme: { light: '#00ff00', dark: '#009900' } },
      c: { label: 'C' }, // no color config
    };
    const { container } = render(<ChartStyle id="test-mixed" config={mixedConfig} />);
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style!.innerHTML).toContain('--color-a');
    expect(style!.innerHTML).toContain('--color-b');
  });
});
