import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '../AppLayout';

// Capture props passed to ReactRouterAppShell
let capturedProps: Record<string, unknown> = {};

vi.mock('@parisgroup-ai/pageshell/layouts/adapters/react-router', () => ({
  ReactRouterAppShell: (props: any) => {
    capturedProps = props;
    return (
      <div data-testid="app-shell" data-theme={props.theme}>
        {props.footer}
        {props.headerRight}
        {props.themeToggle}
        {props.children}
      </div>
    );
  },
}));

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Page Content</div>,
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
    }),
  };
});

const mockSignOut = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@test.com',
      user_metadata: { full_name: 'Dr. Test', avatar_url: 'https://example.com/avatar.jpg' },
    },
    session: { access_token: 'test-token' },
    loading: false,
    signOut: mockSignOut,
  }),
}));

vi.mock('@/lib/branding', () => ({
  BRAND_NAME: 'ToSmile.ai',
}));

vi.mock('@/components/CreditBadge', () => ({
  CreditBadge: (props: any) => <span data-testid="credit-badge">Credits</span>,
}));

vi.mock('@/components/SidebarCredits', () => ({
  SidebarCredits: () => <span data-testid="sidebar-credits">Sidebar Credits</span>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock('@/components/HelpButton', () => ({
  HelpButton: () => <button data-testid="help-button">Help</button>,
}));

vi.mock('@/data/profiles', () => ({
  getByUserId: vi.fn().mockResolvedValue(null),
  getAvatarPublicUrl: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/constants', () => ({
  QUERY_STALE_TIMES: { SHORT: 30_000, MEDIUM: 300_000, LONG: 600_000 },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = {};
  });

  it('should render ReactRouterAppShell with odonto-ai theme', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-theme', 'odonto-ai');
  });

  it('should pass brand config with BRAND_NAME', () => {
    renderWithProviders(<AppLayout />);
    expect(capturedProps.brand).toEqual(
      expect.objectContaining({ href: '/dashboard', logoSrc: '/logo.svg' })
    );
  });

  it('should pass navigation items across 2 sections', () => {
    renderWithProviders(<AppLayout />);
    const sections = capturedProps.navigation as Array<{ items: unknown[] }>;
    expect(sections).toHaveLength(2);
    expect(sections[0].items).toHaveLength(4);
    expect(sections[1].items).toHaveLength(3);
  });

  it('should pass navigation items with correct hrefs', () => {
    renderWithProviders(<AppLayout />);
    const sections = capturedProps.navigation as Array<{ items: Array<{ href: string }> }>;
    const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    expect(allHrefs).toEqual(['/dashboard', '/evaluations', '/patients', '/inventory', '/profile', '/profile?tab=assinatura', 'mailto:suporte@tosmile.ai']);
  });

  it('should pass user profile from auth context', () => {
    renderWithProviders(<AppLayout />);
    expect(capturedProps.user).toEqual({
      name: 'Dr. Test',
      email: 'test@test.com',
      image: 'https://example.com/avatar.jpg',
    });
  });

  it('should pass signOut callback', () => {
    renderWithProviders(<AppLayout />);
    expect(capturedProps.onSignOut).toBe(mockSignOut);
  });

  it('should render Outlet as children', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should render CreditBadge in headerRight and SidebarCredits in footer', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('credit-badge')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-credits')).toBeInTheDocument();
  });

  it('should render ThemeToggle', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should render HelpButton', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
  });
});
