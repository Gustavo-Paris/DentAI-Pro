/**
 * React Router Adapter for @pageshell/layouts
 *
 * Provides pre-configured components that integrate with React Router
 * routing and standard image elements.
 *
 * @module adapters/react-router
 */

'use client';

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AppShell } from '../composites/AppShell';
import type { AppShellProps, SidebarFeaturesConfig } from '../composites/AppShell';
import type { LinkRenderProps, AvatarRenderProps } from '../types';

// Re-export types for convenience
export type { SidebarFeaturesConfig } from '../composites/AppShell';

// Re-export themed shells for convenience
export {
  AdminShell,
  CreatorShell,
  StudentShell,
} from '../composites/ThemedShells';

/**
 * Props for RouterAppShell - extends AppShell but removes adapter props
 * since they're automatically provided by React Router integration
 */
export interface RouterAppShellProps
  extends Omit<AppShellProps, 'renderLink' | 'renderAvatar' | 'isActive'> {
  /**
   * Custom link renderer (optional - defaults to React Router Link)
   */
  renderLink?: AppShellProps['renderLink'];

  /**
   * Custom avatar renderer (optional - defaults to standard img)
   */
  renderAvatar?: AppShellProps['renderAvatar'];

  /**
   * Custom active state hook (optional - defaults to useLocation comparison)
   */
  isActive?: AppShellProps['isActive'];
}

/**
 * Default link renderer using React Router Link
 */
function defaultRenderLink({
  item,
  className,
  children,
  onClick,
}: LinkRenderProps): ReactNode {
  return (
    <Link to={item.href} className={className} onClick={onClick}>
      {children as any}
    </Link>
  );
}

/**
 * Default avatar renderer using standard img element
 */
function defaultRenderAvatar({
  src,
  alt,
  width,
  height,
  className,
}: AvatarRenderProps): ReactNode {
  if (!src) {
    // Fallback to initials
    const initials = alt
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className={`flex items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium ${className}`}
        style={{ width, height }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover ${className}`}
    />
  );
}

/**
 * React Router-integrated AppShell
 *
 * Pre-configured with React Router Link, standard img, and useLocation for active state.
 *
 * @example
 * ```tsx
 * import { RouterAppShell } from '@pageshell/layouts/adapters/react-router';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <RouterAppShell
 *       theme="creator"
 *       brand={{ icon: 'sparkles', title: 'Creator Portal' }}
 *       navigation={sections}
 *       user={currentUser}
 *     >
 *       {children}
 *     </RouterAppShell>
 *   );
 * }
 * ```
 */
export function RouterAppShell({
  renderLink,
  renderAvatar,
  isActive,
  ...props
}: RouterAppShellProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const defaultIsActive = (href: string, exact?: boolean): boolean => {
    if (!pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  };

  return (
    <AppShell
      {...props}
      pathname={pathname}
      renderLink={renderLink ?? defaultRenderLink}
      renderAvatar={renderAvatar ?? defaultRenderAvatar}
      isActive={isActive ?? defaultIsActive}
    />
  );
}

/**
 * Pre-configured Admin Shell for React Router
 */
export function RouterAdminShell(
  props: Omit<RouterAppShellProps, 'theme'>
) {
  return <RouterAppShell {...props} theme="admin" />;
}

/**
 * Pre-configured Creator Shell for React Router
 */
export function RouterCreatorShell(
  props: Omit<RouterAppShellProps, 'theme'>
) {
  return <RouterAppShell {...props} theme="creator" />;
}

/**
 * Pre-configured Student Shell for React Router
 */
export function RouterStudentShell(
  props: Omit<RouterAppShellProps, 'theme'>
) {
  return <RouterAppShell {...props} theme="student" />;
}

/**
 * Hook to get the current pathname for active state detection.
 * Wraps useLocation().pathname to provide a usePathname-compatible API.
 */
export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}
