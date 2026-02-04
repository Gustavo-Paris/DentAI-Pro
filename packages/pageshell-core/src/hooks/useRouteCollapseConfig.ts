/**
 * useRouteCollapseConfig - Route-based sidebar collapse logic
 *
 * Determines if the current route should have the sidebar collapsed by default,
 * and whether to use stored user preference or respect route defaults.
 *
 * @module hooks/useRouteCollapseConfig
 */

'use client';

import { useMemo } from 'react';
import {
  type SidebarCollapseConfig,
  DEFAULT_SIDEBAR_COLLAPSE_CONFIG,
  matchesAnyPattern,
} from '../config/sidebarCollapseRoutes';

// =============================================================================
// Types
// =============================================================================

export interface UseRouteCollapseConfigOptions {
  /** Current pathname */
  pathname: string;
  /** Override default config */
  config?: Partial<SidebarCollapseConfig>;
}

export interface UseRouteCollapseConfigReturn {
  /** Whether the current route should have sidebar collapsed by default */
  isDefaultCollapsedRoute: boolean;
  /** Whether to use stored user preference (false for default-collapsed routes) */
  shouldUseStoredPreference: boolean;
  /** The effective config being used */
  effectiveConfig: SidebarCollapseConfig;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to determine sidebar collapse behavior based on current route.
 *
 * For routes in `defaultCollapsedRoutes`, the sidebar opens collapsed
 * and user preference is ignored (respectRouteDefault: true).
 *
 * For other routes, user preference is respected and persisted.
 *
 * @example
 * ```tsx
 * function SidebarContainer() {
 *   const pathname = usePathname();
 *   const { isDefaultCollapsedRoute, shouldUseStoredPreference } = useRouteCollapseConfig({
 *     pathname,
 *   });
 *
 *   const { isCollapsed } = useSidebarCollapse({
 *     defaultMode: isDefaultCollapsedRoute ? 'collapsed' : 'expanded',
 *     persist: shouldUseStoredPreference,
 *   });
 *
 *   return <Sidebar collapsed={isCollapsed} />;
 * }
 * ```
 */
export function useRouteCollapseConfig(
  options: UseRouteCollapseConfigOptions
): UseRouteCollapseConfigReturn {
  const { pathname, config } = options;

  // Merge with defaults
  const effectiveConfig = useMemo(
    (): SidebarCollapseConfig => ({
      ...DEFAULT_SIDEBAR_COLLAPSE_CONFIG,
      ...config,
    }),
    [config]
  );

  // Check if current route is in default-collapsed list
  const isDefaultCollapsedRoute = useMemo(
    () => matchesAnyPattern(pathname, effectiveConfig.defaultCollapsedRoutes),
    [pathname, effectiveConfig.defaultCollapsedRoutes]
  );

  // Determine if we should use stored preference
  // If respectRouteDefault is true and route has a default, ignore user preference
  const shouldUseStoredPreference = useMemo(() => {
    if (!effectiveConfig.respectRouteDefault) {
      return true; // Always use stored preference
    }
    return !isDefaultCollapsedRoute; // Only use stored for non-default routes
  }, [effectiveConfig.respectRouteDefault, isDefaultCollapsedRoute]);

  return {
    isDefaultCollapsedRoute,
    shouldUseStoredPreference,
    effectiveConfig,
  };
}
