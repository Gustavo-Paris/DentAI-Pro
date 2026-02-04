/**
 * Settings Domain Types
 *
 * Type definitions for settings-related domain components.
 *
 * @module settings/types
 */

import type { ReactNode } from 'react';

// =============================================================================
// Common Types
// =============================================================================

/**
 * Settings theme variant
 */
export type SettingsTheme = 'dash' | 'creator';

/**
 * Icon color for settings components
 */
export type SettingsIconColor =
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'cyan'
  | 'red'
  | 'green';

/**
 * Visual style variant for action cards
 */
export type ActionCardVariant = 'card' | 'flat' | 'glow';

/**
 * Grid variant type
 */
export type SettingsGridVariant = 'card' | 'action';

// =============================================================================
// Hero Card Types
// =============================================================================

/**
 * Stat item for hero card
 */
export interface SettingsHeroStat {
  /** Stat icon */
  icon: string;
  /** Stat value */
  value: string | number;
  /** Stat label */
  label: string;
}

/**
 * SettingsHeroCard component props
 */
export interface SettingsHeroCardProps {
  /** User information */
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  /** Status badge */
  status?: {
    verified?: boolean;
    label?: string;
    icon?: string;
  };
  /** Stats to display */
  stats?: SettingsHeroStat[];
  /** Animation delay class */
  animationDelay?: string;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Navigation Card Types
// =============================================================================

/**
 * SettingsNavigationCard component props
 */
export interface SettingsNavigationCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Navigation link (required if not disabled) */
  href?: string;
  /** Icon to display */
  icon: string;
  /** Theme variant */
  theme: SettingsTheme;
  /** Icon color */
  iconColor?: SettingsIconColor;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Text to show when disabled */
  disabledText?: string;
  /** Link text for enabled cards */
  linkText?: string;
  /** Status badge text */
  statusText?: string;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Featured Card Types
// =============================================================================

/**
 * SettingsFeaturedCard component props
 */
export interface SettingsFeaturedCardProps {
  /** Badge configuration */
  badge?: {
    text: string;
    icon?: string;
  };
  /** Main icon */
  icon: string;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Action button */
  action: {
    label: string;
    href: string;
    icon?: string;
  };
  /** Animation delay class */
  animationDelay?: string;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Action Card Types
// =============================================================================

/**
 * SettingsActionCard component props
 */
export interface SettingsActionCardProps {
  /** Action label */
  label: string;
  /** Navigation link */
  href: string;
  /** Icon */
  icon: string;
  /** Theme variant */
  theme: SettingsTheme;
  /** Visual style variant */
  variant?: ActionCardVariant;
  /** Icon color */
  iconColor?: SettingsIconColor;
  /** Additional className for the icon container */
  iconClassName?: string;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Grid Types
// =============================================================================

/**
 * Card item for navigation grid (without theme)
 */
export type SettingsCardItem = Omit<SettingsNavigationCardProps, 'theme'>;

/**
 * Action item for navigation grid (without theme)
 */
export type SettingsActionItem = Omit<SettingsActionCardProps, 'theme'>;

/**
 * SettingsNavigationGrid component props
 */
export interface SettingsNavigationGridProps {
  /** Grid variant */
  variant?: SettingsGridVariant;
  /** Cards/actions to render */
  cards: SettingsCardItem[] | SettingsActionItem[];
  /** Theme for all items */
  theme: SettingsTheme;
  /** Visual style for action variant */
  actionVariant?: ActionCardVariant;
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Page Composite Types
// =============================================================================

/**
 * Category section configuration
 */
export interface SettingsPageCategorySection {
  /** Section title */
  title: string;
  /** Section icon */
  icon?: string;
  /** Category cards */
  cards: SettingsCardItem[];
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Quick actions section configuration
 */
export interface SettingsPageQuickActionsSection {
  /** Section title */
  title: string;
  /** Section icon */
  icon?: string;
  /** Action cards */
  cards: SettingsActionItem[];
  /** Visual variant */
  variant?: ActionCardVariant;
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Footer section configuration
 */
export interface SettingsPageFooter {
  /** Footer icon */
  icon: string;
  /** Footer title */
  title: string;
  /** Footer description */
  description: string;
}

/**
 * SettingsPageComposite component props
 */
export interface SettingsPageCompositeProps {
  /** Theme variant */
  theme: SettingsTheme;
  /** Hero section configuration */
  hero: Omit<SettingsHeroCardProps, 'animationDelay' | 'className'>;
  /** Featured card configuration (optional) */
  featured?: Omit<SettingsFeaturedCardProps, 'animationDelay' | 'className'>;
  /** Categories section configuration */
  categories: SettingsPageCategorySection;
  /** Quick actions section configuration (optional) */
  quickActions?: SettingsPageQuickActionsSection;
  /** Footer info section (optional) */
  footer?: SettingsPageFooter;
  /** Additional className */
  className?: string;
}
