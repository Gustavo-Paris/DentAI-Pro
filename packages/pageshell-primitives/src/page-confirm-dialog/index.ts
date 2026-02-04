/**
 * PageConfirmDialog Module
 *
 * @module page-confirm-dialog
 */

// Main component
export { PageConfirmDialog } from './PageConfirmDialogComponent';

// Types
export type {
  PageConfirmDialogProps,
  PageConfirmDialogTheme,
  PageConfirmDialogVariant,
  ConfirmDialogMutation,
} from './types';

// Constants (for extension)
export { getVariantConfig, type VariantConfig } from './constants';

// Hooks (for extension)
export { useCountdown } from './hooks';
