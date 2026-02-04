import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="theme-provider" data-attribute={props.attribute} data-default-theme={props.defaultTheme}>
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

  it('should pass correct props to NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );
    const provider = screen.getByTestId('theme-provider');
    expect(provider.dataset.attribute).toBe('class');
    expect(provider.dataset.defaultTheme).toBe('system');
  });
});
