/**
 * PageAlert Module
 *
 * @module page-alert
 */

// Main components
export { PageAlert, PageAlertGroup } from './PageAlertComponent';

// Types
export type {
  PageAlertProps,
  PageAlertGroupProps,
  PageAlertVariant,
  PageAlertAction,
} from './types';

// Constants (for extension)
export {
  ANIMATION_DURATION_NORMAL,
  defaultIcons,
  variantStyles,
  gapClasses,
} from './constants';

// Utils (for extension)
export {
  DefaultLink,
  isDismissedPersisted,
  persistDismissed,
} from './utils';
