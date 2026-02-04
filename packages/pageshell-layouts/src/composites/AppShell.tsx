/**
 * AppShell Composite
 *
 * Complete layout shell with sidebar, header, and main content area.
 * Framework-agnostic with render props for links and routing.
 *
 * Supports optional enhanced sidebar features:
 * - Search (Cmd+K)
 * - Favorites (pinned items)
 * - Recent items
 *
 * @module composites/AppShell
 */

'use client';

import * as React from 'react';
import {
  cn,
  type HeaderBehaviorConfig,
  type SidebarCollapseConfig,
} from '@pageshell/core';
import {
  LayoutProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarBrand,
  SidebarNav,
  UserMenu,
  QuickSwitch,
  Header,
  SidebarSearch,
  SidebarFavorites,
  SidebarRecent,
  CollapsibleSidebar,
  CollapsibleSidebarHeader,
  CollapsibleSidebarContent,
  CollapsibleSidebarFooter,
  CollapsibleNavItem,
} from '../primitives';
import type {
  NavSection,
  UserProfile,
  UserMenuItem,
  BrandConfig,
  QuickSwitchConfig,
  LayoutTheme,
  RenderLink,
  RenderAvatar,
  IsActiveHook,
} from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for enhanced sidebar features.
 * All features are opt-in and disabled by default.
 */
export interface SidebarFeaturesConfig {
  /**
   * Enable search (Cmd+K / Ctrl+K)
   */
  search?: {
    enabled: boolean;
    /** Show inline in header instead of dialog trigger (default: false) */
    inline?: boolean;
    /** Placeholder text */
    placeholder?: string;
  };

  /**
   * Enable favorites/pinned items
   */
  favorites?: {
    enabled: boolean;
    /** localStorage key (default: '{theme}-sidebar-favorites') */
    storageKey?: string;
    /** Maximum items (default: 10) */
    maxItems?: number;
    /** Section label */
    label?: string;
  };

  /**
   * Enable recent items tracking
   */
  recent?: {
    enabled: boolean;
    /** localStorage key (default: '{theme}-sidebar-recent') */
    storageKey?: string;
    /** Maximum items (default: 5) */
    maxItems?: number;
    /** Section label */
    label?: string;
    /** Paths to exclude */
    excludePaths?: string[];
  };
}

export interface AppShellProps {
  children: React.ReactNode;
  /** Theme preset */
  theme?: LayoutTheme;
  /** Brand configuration */
  brand: BrandConfig;
  /** Navigation sections */
  navigation: NavSection[];
  /** User profile */
  user?: UserProfile;
  /** User menu items */
  userMenuItems?: UserMenuItem[];
  /** Sign out handler */
  onSignOut?: () => void;
  /** Quick switch config */
  quickSwitch?: QuickSwitchConfig;
  /** Theme toggle component */
  themeToggle?: React.ReactNode;
  /** Footer content (above user menu) */
  footer?: React.ReactNode;
  /** Header right slot */
  headerRight?: React.ReactNode;
  /** Additional class for main content */
  className?: string;
  /** Render function for links (required for framework integration) */
  renderLink: RenderLink;
  /** Render function for avatar images */
  renderAvatar?: RenderAvatar;
  /** Hook to check if route is active */
  isActive: IsActiveHook;
  /**
   * Enhanced sidebar features configuration.
   * All features are opt-in and disabled by default.
   */
  sidebarFeatures?: SidebarFeaturesConfig;
  /** Current pathname for route-based behaviors */
  pathname?: string;
  /** Enable mobile header hide on scroll (default: false) */
  mobileHeaderHideOnScroll?: boolean;
  /** Mobile header behavior configuration */
  mobileHeaderConfig?: Partial<HeaderBehaviorConfig>;
  /** Enable collapsible sidebar (default: false) */
  collapsibleSidebar?: boolean;
  /** Sidebar collapse configuration */
  sidebarCollapseConfig?: Partial<SidebarCollapseConfig>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Complete application shell with sidebar navigation.
 *
 * @example
 * ```tsx
 * import { AppShell } from '@pageshell/layouts';
 * import Link from 'next/link';
 * import Image from 'next/image';
 * import { usePathname } from 'next/navigation';
 *
 * function Layout({ children }) {
 *   const pathname = usePathname();
 *
 *   return (
 *     <AppShell
 *       theme="admin"
 *       brand={{
 *         icon: "shield",
 *         title: "Admin Portal",
 *         subtitle: "Manage everything",
 *       }}
 *       navigation={[
 *         {
 *           label: "Menu",
 *           items: [
 *             { title: "Dashboard", href: "/admin", icon: "home" },
 *             { title: "Users", href: "/admin/users", icon: "users" },
 *           ],
 *         },
 *       ]}
 *       user={currentUser}
 *       onSignOut={handleSignOut}
 *       renderLink={({ item, className, children, onClick }) => (
 *         <Link href={item.href} className={className} onClick={onClick}>
 *           {children}
 *         </Link>
 *       )}
 *       renderAvatar={({ src, alt, width, height, className }) => (
 *         <Image src={src} alt={alt} width={width} height={height} className={className} />
 *       )}
 *       isActive={(href, exact) =>
 *         exact ? pathname === href : pathname?.startsWith(href)
 *       }
 *       sidebarFeatures={{
 *         search: { enabled: true },
 *         favorites: { enabled: true },
 *         recent: { enabled: true },
 *       }}
 *     >
 *       {children}
 *     </AppShell>
 *   );
 * }
 * ```
 */
export function AppShell({
  children,
  theme = 'default',
  brand,
  navigation,
  user,
  userMenuItems,
  onSignOut,
  quickSwitch,
  themeToggle,
  footer,
  headerRight,
  className,
  renderLink,
  renderAvatar,
  isActive,
  sidebarFeatures,
  pathname,
  mobileHeaderHideOnScroll = false,
  mobileHeaderConfig,
  collapsibleSidebar = false,
  sidebarCollapseConfig,
}: AppShellProps) {
  // Derive storage key prefix from theme for unique per-portal storage
  const storagePrefix = `${theme}-sidebar`;

  // Check if any enhanced features are enabled
  const hasSearch = sidebarFeatures?.search?.enabled;
  const hasFavorites = sidebarFeatures?.favorites?.enabled;
  const hasRecent = sidebarFeatures?.recent?.enabled;
  const searchInline = hasSearch && sidebarFeatures?.search?.inline;

  return (
    <LayoutProvider
      theme={theme}
      user={user}
      renderLink={renderLink}
      renderAvatar={renderAvatar}
      isActive={isActive}
    >
      <div className="min-h-screen flex" data-theme={theme}>
        {/* Sidebar - Regular or Collapsible */}
        {collapsibleSidebar ? (
          <CollapsibleSidebar
            aria-label={`${brand.title} navigation`}
            pathname={pathname}
            routeConfig={sidebarCollapseConfig}
            storageKey={`${storagePrefix}-collapse-mode`}
          >
            <CollapsibleSidebarHeader>
              <SidebarBrand {...brand} />

              {/* Search (inline mode in header) */}
              {searchInline && (
                <div className="mt-3">
                  <SidebarSearch
                    sections={navigation}
                    inline
                    placeholder={sidebarFeatures?.search?.placeholder}
                  />
                </div>
              )}
            </CollapsibleSidebarHeader>

            <CollapsibleSidebarContent>
              {/* Search (dialog trigger mode) */}
              {hasSearch && !searchInline && (
                <div className="px-3 mb-4">
                  <SidebarSearch
                    sections={navigation}
                    placeholder={sidebarFeatures?.search?.placeholder}
                  />
                </div>
              )}

              {/* Favorites section */}
              {hasFavorites && (
                <div className="mb-4">
                  <SidebarFavorites
                    storageKey={
                      sidebarFeatures?.favorites?.storageKey ??
                      `${storagePrefix}-favorites`
                    }
                    maxItems={sidebarFeatures?.favorites?.maxItems}
                    label={sidebarFeatures?.favorites?.label}
                  />
                </div>
              )}

              {/* Recent items section */}
              {hasRecent && (
                <div className="mb-4">
                  <SidebarRecent
                    storageKey={
                      sidebarFeatures?.recent?.storageKey ??
                      `${storagePrefix}-recent`
                    }
                    maxItems={sidebarFeatures?.recent?.maxItems}
                    label={sidebarFeatures?.recent?.label}
                    excludePaths={sidebarFeatures?.recent?.excludePaths}
                  />
                </div>
              )}

              {/* Main navigation */}
              <SidebarNav sections={navigation} />
            </CollapsibleSidebarContent>

            <CollapsibleSidebarFooter>
              {/* Custom footer content */}
              {footer && (
                <div className="mb-3 pb-3 border-b border-sidebar-border">
                  {footer}
                </div>
              )}

              {/* User menu */}
              {user && (
                <UserMenu
                  user={user}
                  items={userMenuItems}
                  onSignOut={onSignOut}
                  themeToggle={themeToggle}
                />
              )}

              {/* Quick switch */}
              {quickSwitch && (
                <div className="mt-3">
                  <QuickSwitch {...quickSwitch} />
                </div>
              )}
            </CollapsibleSidebarFooter>
          </CollapsibleSidebar>
        ) : (
          <Sidebar aria-label={`${brand.title} navigation`}>
            <SidebarHeader>
              <SidebarBrand {...brand} />

              {/* Search (inline mode in header) */}
              {searchInline && (
                <div className="mt-3">
                  <SidebarSearch
                    sections={navigation}
                    inline
                    placeholder={sidebarFeatures?.search?.placeholder}
                  />
                </div>
              )}
            </SidebarHeader>

            <SidebarContent>
              {/* Search (dialog trigger mode) */}
              {hasSearch && !searchInline && (
                <div className="px-3 mb-4">
                  <SidebarSearch
                    sections={navigation}
                    placeholder={sidebarFeatures?.search?.placeholder}
                  />
                </div>
              )}

              {/* Favorites section */}
              {hasFavorites && (
                <div className="mb-4">
                  <SidebarFavorites
                    storageKey={
                      sidebarFeatures?.favorites?.storageKey ??
                      `${storagePrefix}-favorites`
                    }
                    maxItems={sidebarFeatures?.favorites?.maxItems}
                    label={sidebarFeatures?.favorites?.label}
                  />
                </div>
              )}

              {/* Recent items section */}
              {hasRecent && (
                <div className="mb-4">
                  <SidebarRecent
                    storageKey={
                      sidebarFeatures?.recent?.storageKey ??
                      `${storagePrefix}-recent`
                    }
                    maxItems={sidebarFeatures?.recent?.maxItems}
                    label={sidebarFeatures?.recent?.label}
                    excludePaths={sidebarFeatures?.recent?.excludePaths}
                  />
                </div>
              )}

              {/* Main navigation */}
              <SidebarNav sections={navigation} />
            </SidebarContent>

            <SidebarFooter>
              {/* Custom footer content */}
              {footer && (
                <div className="mb-3 pb-3 border-b border-sidebar-border">
                  {footer}
                </div>
              )}

              {/* User menu */}
              {user && (
                <UserMenu
                  user={user}
                  items={userMenuItems}
                  onSignOut={onSignOut}
                  themeToggle={themeToggle}
                />
              )}

              {/* Quick switch */}
              {quickSwitch && (
                <div className="mt-3">
                  <QuickSwitch {...quickSwitch} />
                </div>
              )}
            </SidebarFooter>
          </Sidebar>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <Header
            brand={brand}
            right={headerRight}
            hideOnScroll={mobileHeaderHideOnScroll}
            pathname={pathname}
            headerBehaviorConfig={mobileHeaderConfig}
          />

          {/* Page content - add top padding for fixed mobile header + safe area */}
          <main
            className={cn(
              'flex-1 p-4 md:p-6',
              // Mobile: add padding for fixed header (3.5rem) + safe area + base padding (1rem)
              'pt-[calc(1rem+3.5rem+env(safe-area-inset-top,0px))] md:pt-6',
              className
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
