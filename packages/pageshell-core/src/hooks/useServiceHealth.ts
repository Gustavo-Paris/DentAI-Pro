'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ServiceHealthStatus = 'healthy' | 'offline' | 'unknown' | 'checking';

export interface UseServiceHealthOptions {
  /**
   * Polling interval in milliseconds
   * @default 60000 (1 minute)
   */
  interval?: number;

  /**
   * Whether to start checking immediately
   * @default true
   */
  immediate?: boolean;

  /**
   * Callback when status changes
   */
  onStatusChange?: (status: ServiceHealthStatus, previousStatus: ServiceHealthStatus) => void;

  /**
   * Whether polling is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface UseServiceHealthReturn {
  /**
   * Current health status
   */
  status: ServiceHealthStatus;

  /**
   * Timestamp of last successful check
   */
  lastChecked: Date | null;

  /**
   * Whether a check is currently in progress
   */
  isChecking: boolean;

  /**
   * Last error from a failed check
   */
  error: Error | null;

  /**
   * Manually trigger a health check
   */
  refresh: () => Promise<void>;
}

/**
 * useServiceHealth - Service Health Polling Hook
 *
 * Provides polling-based health checking for services with automatic
 * status detection and change callbacks.
 *
 * @param checkFn - Async function that returns true if healthy
 * @param options - Configuration options
 *
 * @example Basic usage
 * ```tsx
 * const { status, lastChecked, refresh } = useServiceHealth(
 *   async () => {
 *     const res = await fetch('/api/health');
 *     return res.ok;
 *   },
 *   { interval: 30000 }
 * );
 * ```
 *
 * @example With status change callback
 * ```tsx
 * const { status } = useServiceHealth(
 *   checkHealthEndpoint,
 *   {
 *     onStatusChange: (newStatus, oldStatus) => {
 *       if (newStatus === 'offline' && oldStatus === 'healthy') {
 *         toast.error('Service went offline');
 *       }
 *     },
 *   }
 * );
 * ```
 */
export function useServiceHealth(
  checkFn: () => Promise<boolean>,
  options: UseServiceHealthOptions = {}
): UseServiceHealthReturn {
  const { interval = 60000, immediate = true, onStatusChange, enabled = true } = options;

  const [status, setStatus] = useState<ServiceHealthStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const previousStatusRef = useRef<ServiceHealthStatus>(status);
  const checkFnRef = useRef(checkFn);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep refs up to date
  useEffect(() => {
    checkFnRef.current = checkFn;
    onStatusChangeRef.current = onStatusChange;
  }, [checkFn, onStatusChange]);

  // Perform health check
  const performCheck = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setStatus('checking');
    setError(null);

    try {
      const healthy = await checkFnRef.current();
      const newStatus: ServiceHealthStatus = healthy ? 'healthy' : 'offline';

      setStatus(newStatus);
      setLastChecked(new Date());

      // Fire callback if status changed
      if (previousStatusRef.current !== newStatus && onStatusChangeRef.current) {
        onStatusChangeRef.current(newStatus, previousStatusRef.current);
      }
      previousStatusRef.current = newStatus;
    } catch (err) {
      setStatus('offline');
      setError(err instanceof Error ? err : new Error('Health check failed'));

      // Fire callback if status changed
      if (previousStatusRef.current !== 'offline' && onStatusChangeRef.current) {
        onStatusChangeRef.current('offline', previousStatusRef.current);
      }
      previousStatusRef.current = 'offline';
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // Initial check
  useEffect(() => {
    if (enabled && immediate) {
      performCheck();
    }
  }, [enabled, immediate, performCheck]);

  // Polling interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const id = setInterval(performCheck, interval);
    return () => clearInterval(id);
  }, [enabled, interval, performCheck]);

  return {
    status,
    lastChecked,
    isChecking,
    error,
    refresh: performCheck,
  };
}
