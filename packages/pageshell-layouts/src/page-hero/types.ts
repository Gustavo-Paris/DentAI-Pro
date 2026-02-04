/**
 * PageHero Types
 *
 * Unified type definitions for the consolidated PageHero component.
 * Supports 4 variants: progress, balance, welcome, tiers
 *
 * ADR-0033: Domain Primitive Consolidation
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// Re-export IconProp for convenience
export type { IconProp };

/** Color variants for inline stats */
export type HeroStatVariant = 'default' | 'warning' | 'info' | 'accent' | 'success' | 'primary';

/** Inline stat item displayed in hero sections */
export interface PageHeroInlineStat {
  /** Icon - string variant (e.g., "flame", "clock") or component */
  icon: IconProp;
  /** Value to display (number or string) */
  value: string | number;
  /** Label after the value */
  label: string;
  /** Color variant */
  variant?: HeroStatVariant;
}

/** Action button configuration */
export interface PageHeroAction {
  /** Action label */
  label: string;
  /** Action href */
  href: string;
  /** Action icon */
  icon?: IconProp;
  /** Action variant */
  variant?: 'primary' | 'outline';
}

/** Tier counts for badges */
export interface TierCounts {
  bronze: number;
  silver: number;
  gold: number;
}

// =============================================================================
// Base Props (shared across variants)
// =============================================================================

export interface PageHeroBaseProps {
  /** Animation delay index (for staggered animations) */
  animationDelay?: number;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Variant-Specific Props
// =============================================================================

/** Props for variant="progress" */
export interface PageHeroProgressVariantProps {
  variant: 'progress';
  /** Current value */
  value: number;
  /** Maximum value */
  max: number;
  /** Title - static string or function receiving (value, max) */
  title: string | ((value: number, max: number) => string);
  /** Subtitle - static string or function receiving (value, max) */
  subtitle?: string | ((value: number, max: number) => string);
  /** Inline stats displayed below subtitle */
  inlineStats?: PageHeroInlineStat[];
  /** Progress indicator component (RadialProgress, etc.) */
  progressIndicator?: ReactNode;
  /** Style variant for CSS classes */
  styleVariant?: 'achievements' | 'progress' | 'badges';
}

/** Props for variant="balance" */
export interface PageHeroBalanceVariantProps {
  variant: 'balance';
  /** Total available credits/balance */
  balance: number;
  /** Distribution text (e.g., "3 mentores") */
  distribution?: string;
  /** Warning for expiring items */
  warning?: {
    value: number;
    label: string;
  };
  /** Visual element (coin stack, etc.) */
  visual?: ReactNode;
  /** Title override - defaults to "Voce tem X creditos disponiveis" */
  title?: string | ((balance: number) => string);
  /** Subtitle override */
  subtitle?: string | ((balance: number, distribution?: string) => string);
}

/** Props for variant="welcome" */
export interface PageHeroWelcomeVariantProps {
  variant: 'welcome';
  /** Hero icon */
  icon?: IconProp;
  /** Badge text above title */
  badge?: string;
  /** Hero title */
  title: string;
  /** Hero subtitle/description */
  subtitle: string;
  /** Primary action */
  primaryAction?: PageHeroAction;
  /** Secondary action */
  secondaryAction?: PageHeroAction;
}

/** Props for variant="tiers" */
export interface PageHeroTiersVariantProps {
  variant: 'tiers';
  /** Number of earned badges */
  earned: number;
  /** Total number of badges */
  total: number;
  /** Count of badges by tier */
  tierCounts: TierCounts;
  /** Title - static string or function receiving (earned, total) */
  title?: string | ((earned: number, total: number) => string);
  /** Subtitle - static string or function receiving (earned, total) */
  subtitle?: string | ((earned: number, total: number) => string);
}

// =============================================================================
// Discriminated Union
// =============================================================================

export type PageHeroProps = PageHeroBaseProps &
  (
    | PageHeroProgressVariantProps
    | PageHeroBalanceVariantProps
    | PageHeroWelcomeVariantProps
    | PageHeroTiersVariantProps
  );

// =============================================================================
// Type Guards
// =============================================================================

export function isProgressVariant(
  props: PageHeroProps
): props is PageHeroBaseProps & PageHeroProgressVariantProps {
  return props.variant === 'progress';
}

export function isBalanceVariant(
  props: PageHeroProps
): props is PageHeroBaseProps & PageHeroBalanceVariantProps {
  return props.variant === 'balance';
}

export function isWelcomeVariant(
  props: PageHeroProps
): props is PageHeroBaseProps & PageHeroWelcomeVariantProps {
  return props.variant === 'welcome';
}

export function isTiersVariant(
  props: PageHeroProps
): props is PageHeroBaseProps & PageHeroTiersVariantProps {
  return props.variant === 'tiers';
}
