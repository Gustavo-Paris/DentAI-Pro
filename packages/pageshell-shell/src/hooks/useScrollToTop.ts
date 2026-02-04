'use client';

import { useEffect } from 'react';

/**
 * Scrolls to the top of the page when enabled.
 *
 * @param enabled - Whether to scroll to top (typically on mount)
 *
 * @example
 * useScrollToTop(true); // Always scroll on mount
 * useScrollToTop(shouldScroll); // Conditionally scroll
 */
export function useScrollToTop(enabled: boolean): void {
  useEffect(() => {
    if (enabled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [enabled]);
}
