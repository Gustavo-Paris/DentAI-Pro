import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';

// Mock @parisgroup-ai/pageshell/theme
vi.mock('@parisgroup-ai/pageshell/theme', () => ({
  PageShellProvider: ({ children, theme }: React.PropsWithChildren<{ theme: string }>) => (
    <div data-testid="pageshell-provider" data-theme={theme}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider>
        <div>App content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('should pass odonto-ai theme to PageShellProvider', () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    const provider = screen.getByTestId('pageshell-provider');
    expect(provider.dataset.theme).toBe('odonto-ai');
  });
});
