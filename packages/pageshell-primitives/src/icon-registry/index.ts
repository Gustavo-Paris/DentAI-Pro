/**
 * @pageshell/primitives - Icon Registry Module
 *
 * Declarative icon system for PageShell composites.
 * Allows using string names instead of importing Lucide directly.
 *
 * @example
 * ```tsx
 * // Declarative (string)
 * emptyState={{ icon: 'sparkles', title: '...' }}
 *
 * // Or ComponentType (custom icons)
 * emptyState={{ icon: MyCustomIcon, title: '...' }}
 * ```
 *
 * @module icons
 */

// Registry
export {
  iconRegistry,
  // Category-specific registries for selective imports
  actionIcons,
  navigationIcons,
  statusIcons,
  contentIcons,
  userIcons,
  dataIcons,
  financeIcons,
  timeIcons,
  mediaIcons,
  miscIcons,
  communicationIcons,
} from './registry';

// Types
export type { IconName, IconProp } from './types';

// Utilities
export {
  resolveIcon,
  isValidIconName,
  getIconNames,
  isIconVariant,
  getAvailableIcons,
} from './utils';

// Categories
export {
  iconCategories,
  type IconCategory,
  getIconCategories,
  getIconsInCategory,
} from './categories';
