/**
 * useScrollDirection - Detects scroll direction for hide/show header behavior
 *
 * Features:
 * - Detects scroll up/down direction
 * - Configurable threshold to avoid flickering
 * - Can be disabled for specific routes (e.g., chat)
 * - Optimized with passive event listener
 *
 * @module hooks/useScrollDirection
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export type ScrollDirection = 'up' | 'down' | 'idle';

export interface UseScrollDirectionOptions {
  /** Minimum scroll delta to trigger direction change (default: 10) */
  threshold?: number;
  /** Minimum scroll position to start hiding (default: 100) */
  hideAfter?: number;
  /** Disable scroll detection (header always visible) */
  disabled?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean) => void;
}

export interface UseScrollDirectionReturn {
  /** Current scroll direction */
  direction: ScrollDirection;
  /** Whether header should be visible */
  isHeaderVisible: boolean;
  /** Current scroll Y position */
  scrollY: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_THRESHOLD = 10;
const DEFAULT_HIDE_AFTER = 100;

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to detect scroll direction for mobile header hide/show behavior.
 *
 * @example
 * ```tsx
 * function MobileHeader() {
 *   const { isHeaderVisible } = useScrollDirection();
 *
 *   return (
 *     <header className={cn(
 *       "fixed top-0 transition-transform",
 *       !isHeaderVisible && "-translate-y-full"
 *     )}>
 *       ...
 *     </header>
 *   );
 * }
 * ```
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const {
    threshold = DEFAULT_THRESHOLD,
    hideAfter = DEFAULT_HIDE_AFTER,
    disabled = false,
    onVisibilityChange,
  } = options;

  // =============================================================================
  // State
  // =============================================================================

  const [direction, setDirection] = useState<ScrollDirection>('idle');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // =============================================================================
  // Callbacks
  // =============================================================================

  const updateVisibility = useCallback(
    (visible: boolean) => {
      setIsHeaderVisible(visible);
      onVisibilityChange?.(visible);
    },
    [onVisibilityChange]
  );

  // =============================================================================
  // Effect
  // =============================================================================

  useEffect(() => {
    // If disabled, ensure header is always visible
    if (disabled) {
      setDirection('idle');
      updateVisibility(true);
      return;
    }

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        setScrollY(currentY);

        // Only update if scroll delta exceeds threshold
        if (Math.abs(diff) >= threshold) {
          if (diff > 0 && currentY > hideAfter) {
            // Scrolling down and past threshold - hide
            setDirection('down');
            updateVisibility(false);
          } else if (diff < 0) {
            // Scrolling up - show
            setDirection('up');
            updateVisibility(true);
          }

          lastScrollY.current = currentY;
        }

        // Always show when at top
        if (currentY <= hideAfter) {
          updateVisibility(true);
        }

        ticking.current = false;
      });
    };

    // Initialize
    lastScrollY.current = window.scrollY;
    setScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, hideAfter, disabled, updateVisibility]);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    direction,
    isHeaderVisible,
    scrollY,
  };
}
