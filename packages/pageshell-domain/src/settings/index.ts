/**
 * Settings Domain Module
 *
 * Settings-related domain components for settings pages.
 *
 * @module settings
 */

export { SettingsHeroCard } from './SettingsHeroCard';
export { SettingsNavigationCard } from './SettingsNavigationCard';
export { SettingsFeaturedCard } from './SettingsFeaturedCard';
export { SettingsActionCard } from './SettingsActionCard';
export { SettingsNavigationGrid } from './SettingsNavigationGrid';
export { SettingsPageComposite } from './SettingsPageComposite';

export type {
  // Common types
  SettingsTheme,
  SettingsIconColor,
  ActionCardVariant,
  SettingsGridVariant,
  // Hero card
  SettingsHeroStat,
  SettingsHeroCardProps,
  // Navigation card
  SettingsNavigationCardProps,
  // Featured card
  SettingsFeaturedCardProps,
  // Action card
  SettingsActionCardProps,
  // Grid
  SettingsCardItem,
  SettingsActionItem,
  SettingsNavigationGridProps,
  // Page composite
  SettingsPageCategorySection,
  SettingsPageQuickActionsSection,
  SettingsPageFooter,
  SettingsPageCompositeProps,
} from './types';
