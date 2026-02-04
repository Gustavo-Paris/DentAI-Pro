import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

const mockSetTheme = vi.fn();
let mockTheme = 'system';

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
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
    mockTheme = 'system';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-monitor')).toBeInTheDocument();
  });

  it('should render sun icon in light mode', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
  });

  it('should render moon icon in dark mode', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
  });

  it('should cycle theme on click: system → light', () => {
    mockTheme = 'system';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should cycle theme on click: light → dark', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should cycle theme on click: dark → system', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('should have accessible aria-label', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Tema: Escuro')).toBeInTheDocument();
  });
});
