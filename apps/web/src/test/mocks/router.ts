import { vi } from 'vitest';

/**
 * Shared mock factory for react-router-dom.
 *
 * Usage:
 *   vi.mock('react-router-dom', () => mockRouter({ pathname: '/dashboard' }));
 *
 * Provides: Outlet, useLocation, useNavigate, NavLink, useParams, Link
 */
export function mockRouter(options: { pathname?: string } = {}) {
  const { pathname = '/' } = options;
  const navigate = vi.fn();

  return {
    Outlet: () => null,
    useLocation: () => ({ pathname }),
    useNavigate: () => navigate,
    useParams: () => ({}),
    NavLink: ({ children, to, className, ...props }: Record<string, unknown>) => {
      const resolvedClass =
        typeof className === 'function'
          ? (className as (opts: { isActive: boolean }) => string)({ isActive: to === pathname })
          : className;
      return { type: 'a', props: { href: to, className: resolvedClass, ...props }, children };
    },
    Link: ({ children, to, ...props }: Record<string, unknown>) => {
      return { type: 'a', props: { href: to, ...props }, children };
    },
    __navigate: navigate,
  };
}
