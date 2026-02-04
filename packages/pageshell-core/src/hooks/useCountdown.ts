'use client';

/**
 * useCountdown Hook
 *
 * Manages countdown timer for expiration scenarios (payments, sessions, etc.).
 * Updates every second and provides isExpired flag.
 *
 * @example
 * ```tsx
 * // Unix timestamp (seconds)
 * const { minutes, seconds, isExpired } = useCountdown(expirationTimestamp);
 *
 * // Date object
 * const { minutes, seconds, isExpired } = useCountdown(expirationDate);
 *
 * // With custom interval
 * const { hours, minutes, seconds, isExpired } = useCountdown(expirationTimestamp, {
 *   interval: 500, // Update every 500ms
 *   includeHours: true,
 * });
 * ```
 *
 * @module hooks/useCountdown
 */

import { useState, useEffect, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseCountdownOptions {
  /**
   * Update interval in milliseconds.
   * @default 1000
   */
  interval?: number;
  /**
   * Whether to include hours in the return value.
   * When true, the hook returns hours, minutes, seconds.
   * When false (default), it only returns minutes and seconds.
   * @default false
   */
  includeHours?: boolean;
  /**
   * Callback when countdown reaches zero.
   */
  onExpire?: () => void;
}

export interface UseCountdownReturn {
  /** Hours remaining (only when includeHours is true) */
  hours: number;
  /** Minutes remaining */
  minutes: number;
  /** Seconds remaining */
  seconds: number;
  /** Total seconds remaining */
  totalSeconds: number;
  /** Whether the countdown has expired */
  isExpired: boolean;
  /** Formatted time string (MM:SS or HH:MM:SS) */
  formatted: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert expiration input to Unix timestamp in seconds
 */
function toUnixTimestamp(expiresAt: number | Date): number {
  if (expiresAt instanceof Date) {
    return Math.floor(expiresAt.getTime() / 1000);
  }
  // If the number is in milliseconds (13+ digits), convert to seconds
  if (expiresAt > 9999999999) {
    return Math.floor(expiresAt / 1000);
  }
  return expiresAt;
}

/**
 * Format number with leading zero
 */
function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for countdown timer functionality
 *
 * @param expiresAt - Expiration time as Unix timestamp (seconds or milliseconds) or Date object
 * @param options - Configuration options
 * @returns Countdown state with time values and formatted string
 */
export function useCountdown(
  expiresAt: number | Date,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const { interval = 1000, includeHours = false, onExpire } = options;

  const targetTimestamp = useMemo(() => toUnixTimestamp(expiresAt), [expiresAt]);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, targetTimestamp - now);
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, targetTimestamp - now);
    };

    // Set initial value
    setTimeLeft(calculateTimeLeft());

    // Update at specified interval
    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(intervalId);
        onExpire?.();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [targetTimestamp, interval, onExpire]);

  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeLeft / 3600);
  const minutes = includeHours
    ? Math.floor((timeLeft % 3600) / 60)
    : Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0;

  // Build formatted string
  const formatted = includeHours
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds: timeLeft,
    isExpired,
    formatted,
  };
}

export default useCountdown;
