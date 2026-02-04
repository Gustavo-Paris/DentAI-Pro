/**
 * Wizard Defaults
 *
 * Default configuration values for WizardPage and EnhancedWizardPage.
 *
 * @module wizard/defaults
 */

// =============================================================================
// Simple WizardPage Defaults
// =============================================================================

/**
 * Default values for WizardPage component
 *
 * Note: WizardPage uses a specialized full-screen layout with WizardBackground.
 * The containerVariant is included for API consistency but has limited effect.
 */
export const wizardPageDefaults = {
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  background: 'none' as const,
  keyboardNavigation: true,
  showKeyboardHints: true,
  scrollToTop: false,
  showStepIndicator: true,
  labels: {
    next: 'Next',
    previous: 'Previous',
    complete: 'Complete',
    cancel: 'Cancel',
  },
};

// =============================================================================
// EnhancedWizardPage Defaults
// =============================================================================

/**
 * Default values for EnhancedWizardPage component
 *
 * Note: EnhancedWizardPage uses a specialized full-screen layout with WizardBackground.
 * The containerVariant is included for API consistency but has limited effect.
 */
export const enhancedWizardPageDefaults = {
  theme: 'creator' as const,
  containerVariant: 'shell' as const,
  background: 'gradient-mesh' as const,
  showProgress: true,
  progressVariant: 'steps' as const,
  showStepCount: true,
  backLabel: 'Back',
  nextLabel: 'Continue',
  completeLabel: 'Complete',
  skipLabel: 'Skip',
  enableKeyboardNav: false,
  scrollToTop: false,
};

// =============================================================================
// LocalStorage Helpers
// =============================================================================

interface StoredWizardProgress<T> {
  step: number;
  data?: Partial<T>;
  timestamp: number;
}

/**
 * Load wizard progress from localStorage
 */
export function loadWizardProgress<T>(key: string): StoredWizardProgress<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredWizardProgress<T>;
    // Expire after 7 days
    if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
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
export function saveWizardProgress<T>(key: string, step: number, data?: Partial<T>): void {
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
export function clearWizardProgress(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}
