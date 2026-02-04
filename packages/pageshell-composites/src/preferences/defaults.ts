/**
 * Preferences Defaults
 *
 * Default configuration values for PreferencesPage.
 *
 * @module preferences/defaults
 */

// =============================================================================
// PreferencesPage Defaults
// =============================================================================

/**
 * Default values for PreferencesPage component
 */
export const preferencesPageDefaults = {
  theme: 'admin' as const,
  containerVariant: 'shell' as const,
  optimistic: true,
  singleCard: false,
} as const;
