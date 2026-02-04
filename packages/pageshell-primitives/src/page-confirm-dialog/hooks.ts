/**
 * PageConfirmDialog Hooks
 *
 * @module page-confirm-dialog
 */

'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// Countdown Hook
// =============================================================================

/**
 * Hook for countdown timer functionality
 */
export function useCountdown(seconds: number, isOpen: boolean) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!isOpen) {
      setRemaining(seconds);
      return;
    }

    if (remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, remaining, seconds]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRemaining(seconds);
    }
  }, [isOpen, seconds]);

  return remaining;
}
