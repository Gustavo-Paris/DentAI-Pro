import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <span data-testid="arrow-left" className={className} />
  ),
}));

describe('NotFound', () => {
  it('should render text in Portuguese', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
    expect(screen.getByText(/endereço que você tentou acessar/)).toBeInTheDocument();
  });

  it('should have a link back to home in Portuguese', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const link = screen.getByText('Voltar ao início');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('should NOT contain English text', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.queryByText('Page not found')).not.toBeInTheDocument();
    expect(screen.queryByText('Return to Home')).not.toBeInTheDocument();
  });
});
