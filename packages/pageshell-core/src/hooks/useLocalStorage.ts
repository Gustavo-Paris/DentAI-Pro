/**
 * useLocalStorage - Generic localStorage persistence hook
 *
 * Features:
 * - Type-safe storage with generics
 * - SSR-safe (returns initial value during SSR)
 * - Cross-tab synchronization via storage events
 * - Error handling for localStorage failures
 * - Optional serializer/deserializer for custom types
 *
 * @module hooks/useLocalStorage
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseLocalStorageOptions<T> {
  /** Custom serializer (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Custom deserializer (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Sync across browser tabs (default: true) */
  syncTabs?: boolean;
}

export type UseLocalStorageReturn<T> = [
  /** Current value */
  T,
  /** Set value (or remove if undefined) */
  (value: T | ((prev: T) => T)) => void,
  /** Remove value from storage */
  () => void,
];

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for persisting state in localStorage with cross-tab sync.
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if nothing in storage
 * @param options - Configuration options
 *
 * @example Basic usage
 * ```tsx
 * const [name, setName] = useLocalStorage('user-name', 'Guest');
 * ```
 *
 * @example With objects
 * ```tsx
 * const [settings, setSettings] = useLocalStorage('app-settings', {
 *   theme: 'dark',
 *   notifications: true,
 * });
 * ```
 *
 * @example With custom serializer (for Date, Map, etc.)
 * ```tsx
 * const [lastVisit, setLastVisit] = useLocalStorage('last-visit', new Date(), {
 *   serializer: (date) => date.toISOString(),
 *   deserializer: (str) => new Date(str),
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncTabs = true,
  } = options;

  // =============================================================================
  // State
  // =============================================================================

  // Always start with initialValue to avoid hydration mismatch.
  // localStorage will be read in useEffect after hydration.
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializer(item);
        setStoredValue(parsed);
      }
    } catch {
      // localStorage not available or parse error - keep initialValue
    }
    setIsHydrated(true);
  }, [key, deserializer]);

  // =============================================================================
  // Actions
  // =============================================================================

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function (like useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          localStorage.setItem(key, serializer(valueToStore));
        }
      } catch {
        // localStorage not available or quota exceeded
      }
    },
    [key, serializer, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore errors
    }
  }, [key, initialValue]);

  // =============================================================================
  // Cross-tab Sync
  // =============================================================================

  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) {
        return;
      }

      try {
        if (e.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(deserializer(e.newValue));
        }
      } catch {
        // Invalid JSON, ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, deserializer, syncTabs]);

  // =============================================================================
  // Return
  // =============================================================================

  return [storedValue, setValue, removeValue];
}
