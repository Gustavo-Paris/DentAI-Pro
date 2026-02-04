'use client';

/**
 * Relative Time Hook
 *
 * Provides formatted relative time strings that update automatically.
 * Used for displaying elapsed time since an event.
 *
 * @module hooks/useRelativeTime
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Options for useRelativeTime hook
 */
export interface UseRelativeTimeOptions {
  /** Update interval in milliseconds (default: 1000ms) */
  updateInterval?: number;
  /** Locale for formatting (uses browser default if not specified) */
  locale?: string;
  /** Custom translation function for labels */
  t?: (key: string, params?: Record<string, number>) => string;
}

/**
 * Result from useRelativeTime hook
 */
export interface UseRelativeTimeResult {
  /** Formatted relative time string (e.g., "2 minutes ago") */
  formatted: string;
  /** Total elapsed seconds since timestamp */
  elapsedSeconds: number;
  /** Total elapsed minutes since timestamp */
  elapsedMinutes: number;
  /** Total elapsed hours since timestamp */
  elapsedHours: number;
  /** Whether the timestamp is in the past */
  isPast: boolean;
}

/**
 * Default English labels
 */
const DEFAULT_LABELS = {
  fewSeconds: 'a few seconds ago',
  oneMinute: '1 minute ago',
  minutes: (count: number) => `${count} minutes ago`,
  oneHour: '1 hour ago',
  hours: (count: number) => `${count} hours ago`,
  oneDay: '1 day ago',
  days: (count: number) => `${count} days ago`,
  future: 'in the future',
};

/**
 * Formats elapsed time into a human-readable string
 */
function formatElapsedTime(
  elapsedSeconds: number,
  t?: UseRelativeTimeOptions['t']
): string {
  if (elapsedSeconds < 0) {
    return t?.('future') ?? DEFAULT_LABELS.future;
  }

  if (elapsedSeconds < 60) {
    return t?.('fewSeconds') ?? DEFAULT_LABELS.fewSeconds;
  }

  if (elapsedSeconds < 120) {
    return t?.('oneMinute') ?? DEFAULT_LABELS.oneMinute;
  }

  if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60);
    return t?.('minutes', { count: minutes }) ?? DEFAULT_LABELS.minutes(minutes);
  }

  if (elapsedSeconds < 7200) {
    return t?.('oneHour') ?? DEFAULT_LABELS.oneHour;
  }

  if (elapsedSeconds < 86400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return t?.('hours', { count: hours }) ?? DEFAULT_LABELS.hours(hours);
  }

  if (elapsedSeconds < 172800) {
    return t?.('oneDay') ?? DEFAULT_LABELS.oneDay;
  }

  const days = Math.floor(elapsedSeconds / 86400);
  return t?.('days', { count: days }) ?? DEFAULT_LABELS.days(days);
}

/**
 * Hook for displaying relative time that updates automatically
 *
 * @param timestamp - The timestamp to calculate relative time from, or null
 * @param options - Configuration options
 * @returns Object with formatted time and elapsed values
 *
 * @example
 * ```tsx
 * function LastUpdated({ timestamp }) {
 *   const t = useTranslations('time');
 *   const { formatted } = useRelativeTime(timestamp, {
 *     t: (key, params) => t(key, params),
 *   });
 *
 *   return <span>Last updated: {formatted}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With auto-updating every second
 * function LiveTimer({ startTime }) {
 *   const { elapsedMinutes, elapsedSeconds, formatted } = useRelativeTime(startTime);
 *
 *   return (
 *     <div>
 *       <span>{formatted}</span>
 *       <span>{elapsedMinutes}m {elapsedSeconds % 60}s</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRelativeTime(
  timestamp: Date | string | number | null,
  options: UseRelativeTimeOptions = {}
): UseRelativeTimeResult {
  const { updateInterval = 1000, t } = options;

  const calculateElapsed = useCallback((): UseRelativeTimeResult => {
    if (!timestamp) {
      return {
        formatted: '',
        elapsedSeconds: 0,
        elapsedMinutes: 0,
        elapsedHours: 0,
        isPast: false,
      };
    }

    const timestampDate = timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

    const now = new Date();
    const diffMs = now.getTime() - timestampDate.getTime();
    const elapsedSeconds = Math.floor(diffMs / 1000);

    return {
      formatted: formatElapsedTime(elapsedSeconds, t),
      elapsedSeconds: Math.abs(elapsedSeconds),
      elapsedMinutes: Math.floor(Math.abs(elapsedSeconds) / 60),
      elapsedHours: Math.floor(Math.abs(elapsedSeconds) / 3600),
      isPast: elapsedSeconds >= 0,
    };
  }, [timestamp, t]);

  const [result, setResult] = useState<UseRelativeTimeResult>(calculateElapsed);

  useEffect(() => {
    if (!timestamp) return;

    // Initial calculation
    setResult(calculateElapsed());

    // Set up interval for updates
    const interval = setInterval(() => {
      setResult(calculateElapsed());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [timestamp, updateInterval, calculateElapsed]);

  return result;
}
