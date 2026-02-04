'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@pageshell/core';

/**
 * Alert item interface for dismissal tracking
 */
export interface DismissableAlert {
  /** Alert type/category */
  type: string;
  /** Alert message content */
  message: string;
}

/**
 * Options for useDismissedAlerts hook
 */
export interface UseDismissedAlertsOptions {
  /** Storage key for persisting dismissed alerts (default: 'dismissed-alerts') */
  storageKey?: string;
  /** Maximum number of alerts to store (default: 50) */
  maxStored?: number;
}

/**
 * Return type for useDismissedAlerts hook
 */
export interface UseDismissedAlertsReturn {
  /** Check if an alert has been dismissed */
  isDismissed: (alert: DismissableAlert) => boolean;
  /** Dismiss an alert (persists to localStorage) */
  dismiss: (alert: DismissableAlert) => void;
  /** Clear all dismissed alerts */
  clearAll: () => void;
  /** Number of dismissed alerts */
  dismissedCount: number;
}

/**
 * Generate a stable key for an alert based on its content
 */
function getAlertKey(alert: DismissableAlert): string {
  return `${alert.type}:${alert.message}`;
}

/**
 * Hook to persist dismissed alert state to localStorage.
 *
 * Uses a hash of alert content (type + message) for stable identification.
 * Automatically limits stored alerts to prevent unbounded growth.
 *
 * @param options - Configuration options
 * @returns Methods to check, dismiss, and clear alerts
 *
 * @example
 * ```tsx
 * function AlertList({ alerts }) {
 *   const { isDismissed, dismiss, clearAll } = useDismissedAlerts();
 *
 *   const visibleAlerts = alerts.filter(a => !isDismissed(a));
 *
 *   return (
 *     <div>
 *       {visibleAlerts.map((alert) => (
 *         <Alert
 *           key={`${alert.type}:${alert.message}`}
 *           onDismiss={() => dismiss(alert)}
 *         >
 *           {alert.message}
 *         </Alert>
 *       ))}
 *       <button onClick={clearAll}>Show all alerts again</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With custom storage key
 * ```tsx
 * const { isDismissed, dismiss } = useDismissedAlerts({
 *   storageKey: 'my-app-dismissed-alerts',
 *   maxStored: 100,
 * });
 * ```
 */
export function useDismissedAlerts(
  options: UseDismissedAlertsOptions = {}
): UseDismissedAlertsReturn {
  const { storageKey = 'dismissed-alerts', maxStored = 50 } = options;
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Read dismissed alerts from localStorage
  const readDismissed = useCallback((): Set<string> => {
    const parsed = safeGetItem<string[]>(storageKey);
    if (!parsed) return new Set();
    return new Set(Array.isArray(parsed) ? parsed : []);
  }, [storageKey]);

  // Write dismissed alerts to localStorage
  const writeDismissed = useCallback(
    (dismissedSet: Set<string>): void => {
      // Convert to array and limit size (keep most recent)
      const arr = Array.from(dismissedSet).slice(-maxStored);
      safeSetItem(storageKey, arr);
    },
    [storageKey, maxStored]
  );

  // Load dismissed alerts on mount
  useEffect(() => {
    setDismissed(readDismissed());
  }, [readDismissed]);

  // Check if an alert is dismissed
  const isDismissed = useCallback(
    (alert: DismissableAlert): boolean => {
      return dismissed.has(getAlertKey(alert));
    },
    [dismissed]
  );

  // Dismiss an alert
  const dismiss = useCallback(
    (alert: DismissableAlert): void => {
      const key = getAlertKey(alert);
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(key);
        writeDismissed(next);
        return next;
      });
    },
    [writeDismissed]
  );

  // Clear all dismissed alerts
  const clearAll = useCallback((): void => {
    setDismissed(new Set());
    safeRemoveItem(storageKey);
  }, [storageKey]);

  return {
    isDismissed,
    dismiss,
    clearAll,
    dismissedCount: dismissed.size,
  };
}
