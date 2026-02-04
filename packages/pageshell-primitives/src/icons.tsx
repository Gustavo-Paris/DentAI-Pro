/**
 * @pageshell/primitives - Icon Registry
 *
 * @deprecated This file is deprecated. Import from './icon-registry' instead.
 * This file exists for backward compatibility and will be removed in a future version.
 *
 * @module icons
 */

// Re-export everything from the modular version
export {
  // Registry
  iconRegistry,
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
  // Types
  type IconName,
  type IconProp,
  // Utilities
  resolveIcon,
  isValidIconName,
  getIconNames,
  isIconVariant,
  getAvailableIcons,
  // Categories
  iconCategories,
  type IconCategory,
  getIconCategories,
  getIconsInCategory,
} from './icon-registry';
