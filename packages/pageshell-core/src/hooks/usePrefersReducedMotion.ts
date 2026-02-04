'use client';

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';

function getInitialState(): boolean {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia(QUERY).matches;
}

/**
 * Hook to detect if user prefers reduced motion
 *
 * Respects the user's system-level accessibility preference for reduced motion.
 * Returns true when the user has requested reduced motion, allowing components
 * to disable or simplify animations accordingly.
 *
 * @returns true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <div
 *       style={{
 *         transition: prefersReducedMotion ? 'none' : 'transform 0.3s ease',
 *       }}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches);
    };

    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
}
