import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Mock shadcn components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: React.PropsWithChildren) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentPropsWithoutRef<'button'>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Home: () => <span data-testid="home-icon" />,
}));

// A component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
  });

  it('should report error to Sentry', async () => {
    const Sentry = await import('@sentry/react');
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          componentStack: expect.any(String),
        }),
      })
    );
  });

  it('should show reload and home buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Recarregar/)).toBeInTheDocument();
    expect(screen.getByText(/Início/)).toBeInTheDocument();
  });
});
