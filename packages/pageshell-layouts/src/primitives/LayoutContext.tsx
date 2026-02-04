/**
 * Layout Context
 *
 * Provides shared state for layout components (sidebar open/close, theme, etc.)
 * Split into multiple contexts for fine-grained updates and reduced re-renders.
 *
 * @module primitives/LayoutContext
 */

'use client';

import * as React from 'react';
import { PageShellProvider } from '@pageshell/theme';
import type {
  LayoutContextValue,
  LayoutTheme,
  UserProfile,
  RenderLink,
  RenderAvatar,
  IsActiveHook,
} from '../types';

// =============================================================================
// Context Types
// =============================================================================

/**
 * Sidebar state context value.
 * Changes frequently (open/close).
 */
interface SidebarStateValue {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

/**
 * Layout theme context value.
 * Changes rarely (theme switch, user update).
 */
interface LayoutThemeValue {
  theme: LayoutTheme;
  user?: UserProfile;
}

/**
 * Layout adapters context value.
 * Typically stable (render functions).
 */
export interface LayoutAdaptersValue {
  /** Render function for navigation links */
  renderLink: RenderLink;
  /** Render function for avatar images */
  renderAvatar?: RenderAvatar;
  /** Hook to check if route is active */
  isActive: IsActiveHook;
}

// =============================================================================
// Contexts
// =============================================================================

const SidebarStateContext = React.createContext<SidebarStateValue | null>(null);
const LayoutThemeContext = React.createContext<LayoutThemeValue | null>(null);
const LayoutAdaptersContext = React.createContext<LayoutAdaptersValue | null>(null);

// Display names for DevTools
SidebarStateContext.displayName = 'SidebarStateContext';
LayoutThemeContext.displayName = 'LayoutThemeContext';
LayoutAdaptersContext.displayName = 'LayoutAdaptersContext';

// =============================================================================
// Provider Props
// =============================================================================

export interface LayoutProviderProps {
  children: React.ReactNode;
  /** Theme preset */
  theme?: LayoutTheme;
  /** User profile data */
  user?: UserProfile;
  /** Default sidebar open state (mobile) */
  defaultSidebarOpen?: boolean;
  /** Render function for navigation links */
  renderLink: RenderLink;
  /** Render function for avatar images */
  renderAvatar?: RenderAvatar;
  /** Hook to check if route is active */
  isActive: IsActiveHook;
}

// =============================================================================
// Provider
// =============================================================================

/**
 * Layout provider component.
 *
 * Wrap your app or layout with this to enable layout context.
 * Uses split contexts for optimized re-renders:
 * - SidebarStateContext: sidebar open/close (changes frequently)
 * - LayoutThemeContext: theme and user (changes rarely)
 * - LayoutAdaptersContext: render adapters (typically stable)
 *
 * @example
 * ```tsx
 * import { LayoutProvider } from '@pageshell/layouts';
 * import { Link, useLocation } from 'react-router-dom';
 *
 * function MyLayout({ children }) {
 *   const { pathname } = useLocation();
 *
 *   return (
 *     <LayoutProvider
 *       theme="admin"
 *       renderLink={({ item, className, children, onClick }) => (
 *         <Link to={item.href} className={className} onClick={onClick}>
 *           {children}
 *         </Link>
 *       )}
 *       isActive={(href, exact) =>
 *         exact ? pathname === href : pathname?.startsWith(href)
 *       }
 *     >
 *       {children}
 *     </LayoutProvider>
 *   );
 * }
 * ```
 */
export function LayoutProvider({
  children,
  theme = 'default',
  user,
  defaultSidebarOpen = false,
  renderLink,
  renderAvatar,
  isActive,
}: LayoutProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(defaultSidebarOpen);

  // Sidebar actions (memoized, stable references)
  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const openSidebar = React.useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Sidebar state value (changes when sidebar opens/closes)
  const sidebarValue = React.useMemo<SidebarStateValue>(
    () => ({
      isSidebarOpen,
      toggleSidebar,
      openSidebar,
      closeSidebar,
    }),
    [isSidebarOpen, toggleSidebar, openSidebar, closeSidebar]
  );

  // Theme value (changes rarely)
  const themeValue = React.useMemo<LayoutThemeValue>(
    () => ({
      theme,
      user,
    }),
    [theme, user]
  );

  // Adapters value (typically stable)
  const adaptersValue = React.useMemo<LayoutAdaptersValue>(
    () => ({
      renderLink,
      renderAvatar,
      isActive,
    }),
    [renderLink, renderAvatar, isActive]
  );

  // Map LayoutTheme to PageShellTheme
  // LayoutTheme: 'default' | 'admin' | 'creator' | 'student'
  // PageShellTheme: 'admin' | 'creator' | 'student'
  const pageShellTheme = theme === 'default' ? 'student' : theme;

  return (
    <SidebarStateContext.Provider value={sidebarValue}>
      <LayoutThemeContext.Provider value={themeValue}>
        <LayoutAdaptersContext.Provider value={adaptersValue}>
          <PageShellProvider theme={pageShellTheme}>
            {children}
          </PageShellProvider>
        </LayoutAdaptersContext.Provider>
      </LayoutThemeContext.Provider>
    </SidebarStateContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access full layout context (combined).
 *
 * @deprecated Use specific hooks for better performance:
 * - `useSidebarState()` for sidebar open/close
 * - `useLayoutTheme()` for theme and user
 * - `useLayoutAdapters()` for render adapters
 *
 * @throws Error if used outside of LayoutProvider
 */
export function useLayout(): LayoutContextValue {
  const sidebarState = React.useContext(SidebarStateContext);
  const themeContext = React.useContext(LayoutThemeContext);

  if (!sidebarState || !themeContext) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }

  // Combine contexts for backwards compatibility
  return React.useMemo(
    () => ({
      ...sidebarState,
      ...themeContext,
    }),
    [sidebarState, themeContext]
  );
}

/**
 * Access sidebar state only.
 * Use this when you only need sidebar open/close state.
 * Won't re-render when theme/user changes.
 *
 * @throws Error if used outside of LayoutProvider
 */
export function useSidebarState(): SidebarStateValue {
  const context = React.useContext(SidebarStateContext);
  if (!context) {
    throw new Error('useSidebarState must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Access layout theme and user only.
 * Use this when you only need theme/user.
 * Won't re-render when sidebar opens/closes.
 *
 * @throws Error if used outside of LayoutProvider
 */
export function useLayoutTheme(): LayoutThemeValue {
  const context = React.useContext(LayoutThemeContext);
  if (!context) {
    throw new Error('useLayoutTheme must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Access layout adapters (renderLink, isActive, etc.)
 *
 * @throws Error if used outside of LayoutProvider
 */
export function useLayoutAdapters(): LayoutAdaptersValue {
  const context = React.useContext(LayoutAdaptersContext);
  if (!context) {
    throw new Error('useLayoutAdapters must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Check if a route is active.
 * Convenience hook that wraps the adapter.
 */
export function useIsActive(href: string, exact?: boolean): boolean {
  const { isActive } = useLayoutAdapters();
  return isActive(href, exact);
}
