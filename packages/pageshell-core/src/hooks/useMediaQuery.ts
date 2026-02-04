'use client';

import { useEffect, useState } from 'react';

/**
 * useMediaQuery - Responsive Media Query Hook
 *
 * Provides reactive media query matching for responsive components.
 * Updates automatically when viewport changes.
 *
 * @example Basic usage
 * ```tsx
 * const isLarge = useMediaQuery('(min-width: 1024px)');
 * ```
 *
 * @example Using convenience hooks
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR safety - window doesn't exist on server
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience hook for mobile detection (max-width: 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Convenience hook for tablet detection (min-width: 769px and max-width: 1024px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Convenience hook for desktop detection (min-width: 1025px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Common breakpoint queries for convenience
 * Matches Tailwind CSS breakpoints
 */
export const BREAKPOINTS = {
  /** Mobile: max-width 639px */
  mobile: '(max-width: 639px)',
  /** Small: min-width 640px (sm) */
  sm: '(min-width: 640px)',
  /** Medium: min-width 768px (md) */
  md: '(min-width: 768px)',
  /** Large: min-width 1024px (lg) */
  lg: '(min-width: 1024px)',
  /** Extra large: min-width 1280px (xl) */
  xl: '(min-width: 1280px)',
  /** 2XL: min-width 1536px (2xl) */
  '2xl': '(min-width: 1536px)',
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
