import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
}));

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

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock('@/components/HelpButton', () => ({
  HelpButton: () => <button data-testid="help-button">Help</button>,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = {};
  });

  it('should render ReactRouterAppShell with odonto-ai theme', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-theme', 'odonto-ai');
  });

  it('should pass brand config with BRAND_NAME', () => {
    render(<AppLayout />);
    expect(capturedProps.brand).toEqual(
      expect.objectContaining({ title: 'ToSmile.ai', href: '/dashboard' })
    );
  });

  it('should pass 5 navigation items', () => {
    render(<AppLayout />);
    const sections = capturedProps.navigation as Array<{ items: unknown[] }>;
    expect(sections).toHaveLength(1);
    expect(sections[0].items).toHaveLength(5);
  });

  it('should pass navigation items with correct hrefs', () => {
    render(<AppLayout />);
    const items = (capturedProps.navigation as Array<{ items: Array<{ href: string }> }>)[0].items;
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toEqual(['/dashboard', '/evaluations', '/patients', '/inventory', '/profile']);
  });

  it('should pass user profile from auth context', () => {
    render(<AppLayout />);
    expect(capturedProps.user).toEqual({
      name: 'Dr. Test',
      email: 'test@test.com',
      image: 'https://example.com/avatar.jpg',
    });
  });

  it('should pass signOut callback', () => {
    render(<AppLayout />);
    expect(capturedProps.onSignOut).toBe(mockSignOut);
  });

  it('should render Outlet as children', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should render CreditBadge in footer and headerRight', () => {
    render(<AppLayout />);
    const badges = screen.getAllByTestId('credit-badge');
    expect(badges.length).toBe(2);
  });

  it('should render ThemeToggle', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should render HelpButton', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
  });
});
