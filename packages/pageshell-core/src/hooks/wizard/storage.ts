/**
 * Wizard Storage Utilities
 *
 * LocalStorage helpers for resumable wizard progress.
 *
 * @module hooks/wizard
 */

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_EXPIRY_DAYS = 7;

// =============================================================================
// Types
// =============================================================================

export interface StoredWizardProgress<T> {
  step: number;
  data?: Partial<T>;
  timestamp: number;
}

// =============================================================================
// Storage Functions
// =============================================================================

/**
 * Load wizard progress from localStorage
 */
export function loadProgress<T>(key: string, expiryDays: number): StoredWizardProgress<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredWizardProgress<T>;
    // Check expiry
    const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > expiryMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save wizard progress to localStorage
 */
export function saveProgress<T>(key: string, step: number, data?: Partial<T>): void {
  if (typeof window === 'undefined') return;
  try {
    const progress: StoredWizardProgress<T> = {
      step,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear wizard progress from localStorage
 */
export function clearStoredProgress(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}
