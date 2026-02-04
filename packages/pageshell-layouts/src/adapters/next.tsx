/**
 * Next.js Adapter for @pageshell/layouts
 *
 * Provides pre-configured components that integrate with Next.js
 * routing and image optimization.
 *
 * @module adapters/next
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

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
 * Props for NextAppShell - extends AppShell but removes adapter props
 * since they're automatically provided by Next.js integration
 */
export interface NextAppShellProps
  extends Omit<AppShellProps, 'renderLink' | 'renderAvatar' | 'isActive'> {
  /**
   * Custom link renderer (optional - defaults to Next.js Link)
   */
  renderLink?: AppShellProps['renderLink'];

  /**
   * Custom avatar renderer (optional - defaults to Next.js Image)
   */
  renderAvatar?: AppShellProps['renderAvatar'];

  /**
   * Custom active state hook (optional - defaults to usePathname comparison)
   */
  isActive?: AppShellProps['isActive'];
}

/**
 * Default link renderer using Next.js Link
 */
function defaultRenderLink({
  item,
  className,
  children,
  onClick,
}: LinkRenderProps): ReactNode {
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/**
 * Default avatar renderer using Next.js Image
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
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover ${className}`}
    />
  );
}

/**
 * Next.js-integrated AppShell
 *
 * Pre-configured with Next.js Link, Image, and usePathname for active state.
 *
 * @example
 * ```tsx
 * import { NextAppShell } from '@pageshell/layouts/adapters/next';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <NextAppShell
 *       theme="creator"
 *       brand={{ icon: 'sparkles', title: 'Creator Portal' }}
 *       navigation={sections}
 *       user={currentUser}
 *     >
 *       {children}
 *     </NextAppShell>
 *   );
 * }
 * ```
 */
export function NextAppShell({
  renderLink,
  renderAvatar,
  isActive,
  ...props
}: NextAppShellProps) {
  const pathname = usePathname();

  const defaultIsActive = (href: string, exact?: boolean): boolean => {
    if (!pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  };

  return (
    <AppShell
      {...props}
      pathname={pathname ?? undefined}
      renderLink={renderLink ?? defaultRenderLink}
      renderAvatar={renderAvatar ?? defaultRenderAvatar}
      isActive={isActive ?? defaultIsActive}
    />
  );
}

/**
 * Pre-configured Admin Shell for Next.js
 */
export function NextAdminShell(
  props: Omit<NextAppShellProps, 'theme'>
) {
  return <NextAppShell {...props} theme="admin" />;
}

/**
 * Pre-configured Creator Shell for Next.js
 */
export function NextCreatorShell(
  props: Omit<NextAppShellProps, 'theme'>
) {
  return <NextAppShell {...props} theme="creator" />;
}

/**
 * Pre-configured Student Shell for Next.js
 */
export function NextStudentShell(
  props: Omit<NextAppShellProps, 'theme'>
) {
  return <NextAppShell {...props} theme="student" />;
}

/**
 * Hook to get the current pathname for active state
 * Re-exported for convenience
 */
export { usePathname } from 'next/navigation';
