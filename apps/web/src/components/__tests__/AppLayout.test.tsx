import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppLayout from '../AppLayout';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

// Mock AuthContext
const mockSignOut = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@test.com' },
    session: { access_token: 'test-token' },
    loading: false,
    signOut: mockSignOut,
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Page Content</div>,
  useLocation: () => ({ pathname: '/dashboard' }),
  NavLink: ({ children, to, className, ...props }: any) => {
    const resolvedClass = typeof className === 'function' ? className({ isActive: to === '/dashboard' }) : className;
    return (
      <a href={to} className={resolvedClass} data-testid={`nav-${to}`} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock branding
vi.mock('@/lib/branding', () => ({
  BRAND_NAME: 'AURIA',
}));

// Mock CreditBadge
vi.mock('@/components/CreditBadge', () => ({
  CreditBadge: (props: any) => <span data-testid="credit-badge">Credits</span>,
}));

// Mock ThemeToggle
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

// Mock HelpButton
vi.mock('@/components/HelpButton', () => ({
  HelpButton: () => <button data-testid="help-button">Help</button>,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the brand name', () => {
    render(<AppLayout />);
    const brandElements = screen.getAllByText('AURIA');
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render the outlet for page content', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<AppLayout />);
    // Each nav item appears in both desktop sidebar and mobile bottom nav
    expect(screen.getAllByText('components.layout.home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('components.layout.evaluations').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('components.layout.patients').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('components.layout.inventory').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('components.layout.profile').length).toBeGreaterThanOrEqual(1);
  });

  it('should render navigation links in desktop sidebar and mobile bottom nav', () => {
    render(<AppLayout />);
    // Each nav item appears twice (desktop sidebar + mobile bottom nav)
    const homeLinks = screen.getAllByText('components.layout.home');
    expect(homeLinks.length).toBe(2);
  });

  it('should render credit badge', () => {
    render(<AppLayout />);
    const badges = screen.getAllByTestId('credit-badge');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('should render theme toggle', () => {
    render(<AppLayout />);
    const toggles = screen.getAllByTestId('theme-toggle');
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });

  it('should render help button', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
  });

  it('should render sign out buttons', () => {
    render(<AppLayout />);
    const signOutBtns = screen.getAllByLabelText('components.layout.signOut');
    expect(signOutBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('should call signOut when sign out button is clicked', () => {
    render(<AppLayout />);
    const signOutBtns = screen.getAllByLabelText('components.layout.signOut');
    fireEvent.click(signOutBtns[0]);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should render the mobile search button', () => {
    render(<AppLayout />);
    expect(screen.getByLabelText('components.layout.searchLabel')).toBeInTheDocument();
  });

  it('should dispatch open-global-search event when search is clicked', () => {
    const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
    render(<AppLayout />);
    fireEvent.click(screen.getByLabelText('components.layout.searchLabel'));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    dispatchSpy.mockRestore();
  });
});
