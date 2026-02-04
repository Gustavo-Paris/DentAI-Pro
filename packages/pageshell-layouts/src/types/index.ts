/**
 * Layout Types
 *
 * Core types for PageShell layout components.
 * Framework-agnostic design using render props.
 *
 * @module types
 */

import type { ComponentType, ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Navigation Types
// =============================================================================

/**
 * Single navigation item
 */
export interface NavItem {
  /** Display title */
  title: string;
  /** Navigation path/URL */
  href: string;
  /** Icon (Lucide component or PageIcon name) */
  icon?: IconProp;
  /** Match exactly (default: prefix match) */
  exact?: boolean;
  /** Badge content (number or "new") */
  badge?: number | 'new';
  /** Disabled state */
  disabled?: boolean;
  /** External link (opens in new tab) */
  external?: boolean;
}

/**
 * Navigation section with optional label
 */
export interface NavSection {
  /** Section label (optional header) */
  label?: string;
  /** Items in this section */
  items: NavItem[];
  /** Collapsible state */
  collapsible?: boolean;
  /** Default collapsed */
  defaultCollapsed?: boolean;
}

// =============================================================================
// User Types
// =============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  /** User ID */
  id?: string;
  /** Display name */
  name?: string | null;
  /** Email address */
  email?: string | null;
  /** Avatar URL */
  image?: string | null;
  /** Role label (e.g., "Creator", "Admin") */
  role?: string;
  /** Role icon */
  roleIcon?: IconProp;
}

/**
 * User menu link item
 */
export interface UserMenuItem {
  /** Display label */
  label: string;
  /** Navigation path */
  href: string;
  /** Icon */
  icon?: IconProp;
  /** Separator before this item */
  separator?: boolean;
}

// =============================================================================
// Brand Types
// =============================================================================

/**
 * Brand configuration for sidebar header
 */
export interface BrandConfig {
  /** Brand icon */
  icon: IconProp;
  /** Brand title */
  title: string;
  /** Brand subtitle */
  subtitle?: string;
  /** Click handler or href */
  href?: string;
  onClick?: () => void;
}

// =============================================================================
// Quick Switch Types
// =============================================================================

/**
 * Quick switch link (e.g., "View as Student")
 */
export interface QuickSwitchConfig {
  /** Display label */
  label: string;
  /** Navigation path */
  href: string;
  /** Icon */
  icon?: IconProp;
  /** Badge text */
  badge?: string;
}

// =============================================================================
// Render Props (Framework Agnostic)
// =============================================================================

/**
 * Props passed to link render function
 */
export interface LinkRenderProps {
  /** The navigation item */
  item: NavItem;
  /** Whether this item is currently active */
  isActive: boolean;
  /** CSS classes to apply */
  className: string;
  /** Children (item content) */
  children: ReactNode;
  /** onClick handler for mobile close */
  onClick?: () => void;
}

/**
 * Props passed to avatar render function
 */
export interface AvatarRenderProps {
  /** Image source URL */
  src: string;
  /** Alt text */
  alt: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** CSS class */
  className: string;
}

/**
 * Framework adapter for rendering navigation links
 * Return a custom Link component (e.g., Next.js Link)
 */
export type RenderLink = (props: LinkRenderProps) => ReactNode;

/**
 * Framework adapter for rendering avatar images
 * Return a custom Image component (e.g., Next.js Image)
 */
export type RenderAvatar = (props: AvatarRenderProps) => ReactNode;

/**
 * Hook for determining active route
 * Return true if the given href matches current route
 */
export type IsActiveHook = (href: string, exact?: boolean) => boolean;

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Layout theme preset names
 */
export type LayoutTheme = 'default' | 'admin' | 'creator' | 'student';

// =============================================================================
// Layout Context
// =============================================================================

/**
 * Layout context value passed to children
 */
export interface LayoutContextValue {
  /** Whether sidebar is open (mobile) */
  isSidebarOpen: boolean;
  /** Toggle sidebar (mobile) */
  toggleSidebar: () => void;
  /** Open sidebar (mobile) */
  openSidebar: () => void;
  /** Close sidebar (mobile) */
  closeSidebar: () => void;
  /** Current theme */
  theme: LayoutTheme;
  /** User profile (if authenticated) */
  user?: UserProfile;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Base props shared by layout components
 */
export interface LayoutBaseProps {
  /** Theme preset */
  theme?: LayoutTheme;
  /** Additional CSS class */
  className?: string;
}
