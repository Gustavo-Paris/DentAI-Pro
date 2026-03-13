import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@sentry/react', () => ({
  default: { captureException: vi.fn() },
  captureException: vi.fn(),
}));

vi.mock('@/lib/lazy-retry', () => ({
  lazyRetry: () => {
    const Comp = () => <div data-testid="lazy-page" />;
    Comp.displayName = 'LazyPage';
    return Comp;
  },
}));

vi.mock('@/lib/i18n', () => ({
  default: { t: (k: string) => k, language: 'pt-BR' },
}));

vi.mock('@/lib/constants', () => ({
  QUERY_STALE_TIMES: { SHORT: 30000 },
  QUERY_GC_TIMES: { DEFAULT: 600000 },
}));

vi.mock('@/data', () => ({
  evaluations: { searchRecent: vi.fn(() => Promise.resolve([])) },
}));

vi.mock('@/components/GlobalSearch', () => ({
  GlobalSearch: () => null,
}));

vi.mock('@/components/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/core', () => ({
  PageShellI18nProvider: ({ children }: any) => <div>{children}</div>,
  PT_BR_MESSAGES: {},
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/CookieConsent', () => ({
  default: () => null,
}));

vi.mock('@/components/PostHogProvider', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/KeyboardShortcuts', () => ({
  KeyboardShortcuts: () => null,
}));

vi.mock('@/components/OfflineBanner', () => ({
  OfflineBanner: () => null,
}));

vi.mock('@/components/AppLayout', () => ({
  default: () => <div data-testid="app-layout" />,
}));

vi.mock('@/pages/Terms', () => ({
  default: () => <div data-testid="terms" />,
}));

vi.mock('@/pages/Privacy', () => ({
  default: () => <div data-testid="privacy" />,
}));

describe('App', () => {
  it('renders without crashing', async () => {
    const App = (await import('../../App')).default;
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
