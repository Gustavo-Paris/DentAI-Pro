/**
 * useDismissState Hook
 *
 * Manages dismissible state with optional localStorage persistence and expiry.
 * Used by AlertBanner and similar dismissible components.
 *
 * @module hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseDismissStateOptions {
  /** Storage key for persistence (omit for non-persistent dismiss) */
  persistKey?: string;
  /** Duration in ms before dismissed state expires (default: never) */
  expiryMs?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export interface UseDismissStateReturn {
  /** Whether the content is dismissed */
  isDismissed: boolean;
  /** Whether the exit animation is playing */
  isExiting: boolean;
  /** Call to dismiss the content */
  dismiss: () => void;
  /** Call to reset dismissed state */
  reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_PREFIX = 'tostudy:alert-dismissed:';
const ANIMATION_DURATION = 150;

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing dismissible state with optional persistence
 *
 * @example Basic usage (no persistence)
 * ```tsx
 * const { isDismissed, dismiss } = useDismissState();
 *
 * if (isDismissed) return null;
 * return <Alert onDismiss={dismiss} />;
 * ```
 *
 * @example With persistence
 * ```tsx
 * const { isDismissed, dismiss } = useDismissState({
 *   persistKey: 'low-balance-alert',
 * });
 * ```
 *
 * @example With expiry
 * ```tsx
 * const { isDismissed, dismiss } = useDismissState({
 *   persistKey: 'promo-banner',
 *   expiryMs: 24 * 60 * 60 * 1000, // 24 hours
 * });
 * ```
 */
export function useDismissState(
  options: UseDismissStateOptions = {}
): UseDismissStateReturn {
  const { persistKey, expiryMs, onDismiss } = options;

  const [isDismissed, setIsDismissed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (!persistKey) {
      setIsHydrated(true);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${persistKey}`);
      if (stored) {
        const dismissedAt = parseInt(stored, 10);
        if (!isNaN(dismissedAt)) {
          // Check if expired
          if (expiryMs && Date.now() - dismissedAt >= expiryMs) {
            // Expired, clear storage
            localStorage.removeItem(`${STORAGE_PREFIX}${persistKey}`);
            setIsDismissed(false);
          } else {
            // Still valid
            setIsDismissed(true);
          }
        }
      }
    } catch {
      // localStorage not available
    }

    setIsHydrated(true);
  }, [persistKey, expiryMs]);

  const dismiss = useCallback(() => {
    // Start exit animation
    setIsExiting(true);

    // After animation, update state
    setTimeout(() => {
      setIsDismissed(true);
      setIsExiting(false);

      // Persist if key provided
      if (persistKey) {
        try {
          localStorage.setItem(
            `${STORAGE_PREFIX}${persistKey}`,
            Date.now().toString()
          );
        } catch {
          // localStorage not available
        }
      }

      onDismiss?.();
    }, ANIMATION_DURATION);
  }, [persistKey, onDismiss]);

  const reset = useCallback(() => {
    setIsDismissed(false);
    setIsExiting(false);

    if (persistKey) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${persistKey}`);
      } catch {
        // localStorage not available
      }
    }
  }, [persistKey]);

  return {
    // During SSR/hydration, show content (prevent flicker)
    isDismissed: isHydrated ? isDismissed : false,
    isExiting,
    dismiss,
    reset,
  };
}
