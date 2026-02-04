'use client';

/**
 * Sidebar Component
 *
 * Theme-aware sidebar container for portal layouts.
 * Uses a slot-based design - provide your own navigation component.
 *
 * @module portal/Sidebar
 *
 * @example Basic usage with navigation slot
 * ```tsx
 * <Sidebar
 *   theme="creator"
 *   isOpen={isOpen}
 *   onClose={close}
 * >
 *   <SidebarNavigation
 *     brand={brand}
 *     sections={sections}
 *     userProfile={userProfile}
 *     userMenuLinks={menuLinks}
 *     onSignOut={signOut}
 *   />
 * </Sidebar>
 * ```
 *
 * @example With configuration helper
 * ```tsx
 * const sidebarProps = useSidebarConfig({
 *   user,
 *   theme: 'creator',
 *   config: creatorSidebarConfig,
 * });
 *
 * <Sidebar theme="creator" isOpen={isOpen} onClose={close}>
 *   <SidebarNavigation {...sidebarProps} />
 * </Sidebar>
 * ```
 */

import type { ReactNode, ComponentType, SVGProps } from 'react';
import type { PageShellTheme } from '@pageshell/theme';

// =============================================================================
// Types
// =============================================================================

/**
 * Icon component type (compatible with Lucide icons)
 */
export type SidebarIconProp = string | ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

/**
 * Brand configuration for sidebar header
 */
export interface PortalSidebarBrand {
  /** Brand icon */
  icon: SidebarIconProp;
  /** Brand title */
  title: string;
  /** Brand subtitle */
  subtitle: string;
}

/**
 * Quick switch link configuration
 */
export interface PortalQuickSwitch {
  /** Link label */
  label: string;
  /** Link href */
  href: string;
  /** Link icon */
  icon: SidebarIconProp;
  /** Optional badge */
  badge?: string;
}

/**
 * Navigation item
 */
export interface PortalNavItem {
  /** Item label */
  label: string;
  /** Item href */
  href: string;
  /** Item icon */
  icon?: SidebarIconProp;
  /** Optional badge */
  badge?: string;
  /** Is item active */
  active?: boolean;
}

/**
 * Navigation section
 */
export interface PortalNavSection {
  /** Section title */
  title?: string;
  /** Section items */
  items: PortalNavItem[];
}

/**
 * User menu link
 */
export interface PortalUserMenuLink {
  /** Link label */
  label: string;
  /** Link href */
  href: string;
  /** Link icon */
  icon?: SidebarIconProp;
}

/**
 * User data for sidebar
 */
export interface PortalSidebarUser {
  /** User ID */
  id: string;
  /** Username */
  username?: string;
  /** Display name */
  name: string;
  /** Email */
  email?: string;
  /** Avatar image URL */
  image?: string;
}

/**
 * Sidebar configuration
 */
export interface PortalSidebarConfig {
  /** Brand configuration */
  brand: PortalSidebarBrand;
  /** Navigation sections */
  sections: PortalNavSection[];
  /** User role label */
  userRole: string;
  /** User role icon */
  userRoleIcon: SidebarIconProp;
  /** Quick switch link */
  quickSwitch?: PortalQuickSwitch;
  /** User menu links (receives username for dynamic links) */
  getUserMenuLinks: (username: string) => PortalUserMenuLink[];
}

/**
 * Sidebar component props
 */
export interface PortalSidebarProps {
  /** Theme variant */
  theme: PageShellTheme;
  /** Navigation content (use your own SidebarNavigation component) */
  children: ReactNode;
  /** Mobile drawer open state */
  isOpen?: boolean;
  /** Callback when mobile drawer should close */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Theme to NavId mapping
// =============================================================================

const themeNavIds: Record<PageShellTheme, string> = {
  default: 'portal-sidebar-nav-default',
  admin: 'portal-sidebar-nav-admin',
  creator: 'portal-sidebar-nav-creator',
  student: 'portal-sidebar-nav-student',
};

// =============================================================================
// Sidebar Component
// =============================================================================

/**
 * Sidebar container component
 *
 * This is a minimal container that provides theme context.
 * The actual navigation is provided via children slot.
 */
export function PortalSidebar({
  theme,
  children,
  isOpen,
  onClose,
  className,
}: PortalSidebarProps) {
  const navId = themeNavIds[theme];

  return (
    <aside
      id={navId}
      className={className}
      data-theme={theme}
      data-open={isOpen}
      aria-label="Main navigation"
    >
      {children}
    </aside>
  );
}

PortalSidebar.displayName = 'PortalSidebar';

// =============================================================================
// Helper Hook
// =============================================================================

/**
 * Options for usePortalSidebarConfig hook
 */
export interface UsePortalSidebarConfigOptions {
  /** User data */
  user: PortalSidebarUser;
  /** Theme variant */
  theme: PageShellTheme;
  /** Sidebar configuration */
  config: PortalSidebarConfig;
}

/**
 * Return value from usePortalSidebarConfig hook
 */
export interface PortalSidebarNavigationProps {
  /** Brand configuration */
  brand: PortalSidebarBrand;
  /** Navigation ID for aria-labelledby */
  navId: string;
  /** Navigation sections */
  sections: PortalNavSection[];
  /** User profile data */
  userProfile: {
    name: string;
    email?: string;
    image?: string;
    role: string;
    roleIcon: SidebarIconProp;
  };
  /** User menu links */
  userMenuLinks: PortalUserMenuLink[];
  /** Quick switch link */
  quickSwitch?: PortalQuickSwitch;
}

/**
 * Helper to build navigation props from config
 *
 * @example
 * ```tsx
 * const navProps = useSidebarConfig({
 *   user,
 *   theme: 'creator',
 *   config: creatorSidebarConfig,
 * });
 *
 * <SidebarNavigation {...navProps} onSignOut={signOut} />
 * ```
 */
export function usePortalSidebarConfig({
  user,
  theme,
  config,
}: UsePortalSidebarConfigOptions): PortalSidebarNavigationProps {
  const username = user.username || user.id;
  const navId = themeNavIds[theme];

  return {
    brand: config.brand,
    navId,
    sections: config.sections,
    userProfile: {
      name: user.name,
      email: user.email,
      image: user.image,
      role: config.userRole,
      roleIcon: config.userRoleIcon,
    },
    userMenuLinks: config.getUserMenuLinks(username),
    quickSwitch: config.quickSwitch,
  };
}
