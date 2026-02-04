/**
 * Form Defaults
 *
 * Default configuration values for FormPage and FormModal.
 *
 * @module form/defaults
 */

// =============================================================================
// FormPage Defaults
// =============================================================================

/**
 * Default values for FormPage component
 */
export const formPageDefaults = {
  theme: 'default' as const,
  containerVariant: 'shell' as const,
  submitText: 'Save',
  cancelText: 'Cancel',
  loadingText: 'Saving...',
  backLabel: 'Back',
  warnOnUnsavedChanges: true,
} as const;

// =============================================================================
// FormModal Defaults
// =============================================================================

/**
 * Default values for FormModal component
 */
export const formModalDefaults = {
  theme: 'default' as const,
  size: 'md' as const,
  submitText: 'Save',
  cancelText: 'Cancel',
  loadingText: 'Saving...',
  closeOnSuccess: true,
  resetOnClose: true,
  variant: 'default' as const,
  animateFields: false,
  showErrorSummary: false,
  mobileMode: 'modal' as const,
  autoFocus: true,
  redirectDelay: 0,
} as const;
