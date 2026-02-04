/**
 * PageTabs Module
 *
 * @package @pageshell/layouts
 */

// Main components
export { PageTabs } from './PageTabsComponent';
export { PageTab } from './PageTab';

// Types
export type {
  PageTabsVariant,
  PageTabsOrientation,
  PageTabsSize,
  PageTabProps,
  PageTabsProps,
  TabDefinition,
} from './types';

// Constants (for advanced customization)
export { sizeConfig, contentAnimationClasses } from './constants';

// Utilities (for advanced customization)
export { getTabListClasses, getTabButtonClasses } from './utils';
