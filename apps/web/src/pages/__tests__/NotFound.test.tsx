import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';
import translations from '@/locales/pt-BR.json';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <span data-testid="arrow-left" className={className} />
  ),
  SearchX: ({ className }: { className?: string }) => (
    <span data-testid="search-x" className={className} />
  ),
}));

vi.mock('@parisgroup-ai/pageshell/primitives', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  };
});

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let value: unknown = translations;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      return (value as string) ?? key;
    },
    i18n: { language: 'pt-BR' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  withTranslation: () => (Component: any) => Component,
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
