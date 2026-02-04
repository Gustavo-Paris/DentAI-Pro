/**
 * useMobileHeaderBehavior - Combined hook for mobile header hide/show behavior
 *
 * Combines scroll direction detection with route-based exceptions.
 * For chat/messaging routes, headers stay always visible.
 * For other routes, headers hide on scroll down and show on scroll up.
 *
 * @module hooks/useMobileHeaderBehavior
 */

'use client';

import { useMemo } from 'react';
import { useScrollDirection, type UseScrollDirectionOptions } from './useScrollDirection';
import {
  type HeaderBehaviorConfig,
  DEFAULT_HEADER_BEHAVIOR_CONFIG,
  matchesAnyPattern,
} from '../config/headerBehaviorRoutes';

// =============================================================================
// Types
// =============================================================================

export interface UseMobileHeaderBehaviorOptions {
  /** Current pathname */
  pathname: string;
  /** Override default header behavior config */
  config?: Partial<HeaderBehaviorConfig>;
  /** Override scroll detection options */
  scrollOptions?: Omit<UseScrollDirectionOptions, 'disabled'>;
}

export interface UseMobileHeaderBehaviorReturn {
  /** Whether the header should be visible */
  isHeaderVisible: boolean;
  /** Whether this route has always-visible headers */
  isAlwaysVisibleRoute: boolean;
  /** Current scroll direction */
  scrollDirection: 'up' | 'down' | 'idle';
  /** Current scroll Y position */
  scrollY: number;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage mobile header visibility based on scroll and route.
 *
 * @example
 * ```tsx
 * function MobileLayout() {
 *   const pathname = usePathname();
 *   const { isHeaderVisible } = useMobileHeaderBehavior({ pathname });
 *
 *   return (
 *     <>
 *       <MobileHeader isVisible={isHeaderVisible} />
 *       <PageHeader isVisible={isHeaderVisible} />
 *       <main className="pt-28">{children}</main>
 *     </>
 *   );
 * }
 * ```
 */
export function useMobileHeaderBehavior(
  options: UseMobileHeaderBehaviorOptions
): UseMobileHeaderBehaviorReturn {
  const { pathname, config, scrollOptions } = options;

  // Merge with defaults
  const effectiveConfig = useMemo(
    (): HeaderBehaviorConfig => ({
      ...DEFAULT_HEADER_BEHAVIOR_CONFIG,
      ...config,
    }),
    [config]
  );

  // Check if current route should always have visible headers
  const isAlwaysVisibleRoute = useMemo(
    () => matchesAnyPattern(pathname, effectiveConfig.alwaysVisibleRoutes),
    [pathname, effectiveConfig.alwaysVisibleRoutes]
  );

  // Use scroll direction hook with disabled flag for always-visible routes
  const { isHeaderVisible, direction, scrollY } = useScrollDirection({
    ...scrollOptions,
    disabled: isAlwaysVisibleRoute,
  });

  return {
    isHeaderVisible: isAlwaysVisibleRoute ? true : isHeaderVisible,
    isAlwaysVisibleRoute,
    scrollDirection: direction,
    scrollY,
  };
}
