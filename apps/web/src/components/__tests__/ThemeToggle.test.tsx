import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

const mockSetColorMode = vi.fn();
let mockColorMode = 'system';

vi.mock('@parisgroup-ai/pageshell/theme', () => ({
  usePageShellColorMode: () => ({ colorMode: mockColorMode, setColorMode: mockSetColorMode }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentPropsWithoutRef<'button'>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div data-testid="tooltip-content">{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Sun: () => <span data-testid="icon-sun" />,
  Moon: () => <span data-testid="icon-moon" />,
  Monitor: () => <span data-testid="icon-monitor" />,
}));

describe('ThemeToggle', () => {
  it('should render with system icon by default', () => {
    mockColorMode = 'system';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-monitor')).toBeInTheDocument();
  });

  it('should render sun icon in light mode', () => {
    mockColorMode = 'light';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
  });

  it('should render moon icon in dark mode', () => {
    mockColorMode = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
  });

  it('should cycle theme on click: system → light', () => {
    mockColorMode = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetColorMode).toHaveBeenCalledWith('light');
  });

  it('should cycle theme on click: light → dark', () => {
    mockColorMode = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetColorMode).toHaveBeenCalledWith('dark');
  });

  it('should cycle theme on click: dark → system', () => {
    mockColorMode = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetColorMode).toHaveBeenCalledWith('system');
  });

  it('should have accessible aria-label', () => {
    mockColorMode = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Tema: Escuro')).toBeInTheDocument();
  });
});
