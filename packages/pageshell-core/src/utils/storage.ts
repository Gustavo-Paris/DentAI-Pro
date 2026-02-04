/**
 * Safe Storage Utilities
 *
 * SSR-safe localStorage operations with JSON serialization.
 * Used by hooks like useLocalStorage, useFormDraft, useDismissedAlerts.
 *
 * Features:
 * - SSR-safe (returns null/false on server)
 * - JSON serialization built-in
 * - Silent error handling (localStorage can be disabled)
 *
 * @example
 * ```ts
 * import { safeGetItem, safeSetItem, safeRemoveItem } from '@pageshell/core';
 *
 * const data = safeGetItem<MyType>('my-key');
 * safeSetItem('my-key', { foo: 'bar' });
 * safeRemoveItem('my-key');
 * ```
 */

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely get and parse JSON from localStorage
 *
 * @param key - localStorage key
 * @returns Parsed value or null if not found/invalid
 */
export function safeGetItem<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch {
    // Invalid JSON or localStorage disabled
    return null;
  }
}

/**
 * Safely stringify and set value in localStorage
 *
 * @param key - localStorage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage full or disabled
    return false;
  }
}

/**
 * Safely remove item from localStorage
 *
 * @param key - localStorage key to remove
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    // localStorage disabled
    return false;
  }
}

/**
 * Safely get raw string from localStorage (without JSON parsing)
 *
 * @param key - localStorage key
 * @returns Raw string value or null if not found
 */
export function safeGetRaw(key: string): string | null {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set raw string in localStorage (without JSON stringification)
 *
 * @param key - localStorage key
 * @param value - Raw string value to store
 * @returns true if successful, false otherwise
 */
export function safeSetRaw(key: string, value: string): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
