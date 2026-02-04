'use client';

import { useEffect, useRef } from 'react';

/**
 * useInterval - Declarative Interval Hook
 *
 * Provides a declarative way to use setInterval in React components.
 * Automatically cleans up interval on unmount or when delay changes.
 * Pass null for delay to pause the interval.
 *
 * @param callback - Function to call on each interval
 * @param delay - Interval delay in milliseconds (null to pause)
 *
 * @example Basic usage
 * ```tsx
 * const [count, setCount] = useState(0);
 * useInterval(() => setCount(c => c + 1), 1000);
 * ```
 *
 * @example With pause/resume
 * ```tsx
 * const [isRunning, setIsRunning] = useState(true);
 * useInterval(() => tick(), isRunning ? 1000 : null);
 * ```
 *
 * @example Dynamic delay
 * ```tsx
 * const [delay, setDelay] = useState(1000);
 * useInterval(() => tick(), delay); // Adjusts automatically
 * ```
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<(() => void) | undefined>(undefined);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
