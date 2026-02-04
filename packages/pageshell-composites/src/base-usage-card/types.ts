/**
 * BaseUsageCard Types
 *
 * @module base-usage-card/types
 */

import type { IconName } from '@pageshell/primitives';
import type { ReactNode } from 'react';

/**
 * Header configuration for usage cards
 */
export interface UsageCardHeaderConfig {
  /** Icon name from PageShell */
  icon?: IconName;
  /** @deprecated Use `icon` instead */
  iconName?: IconName;
  /** Card title */
  title: string;
  /** Card subtitle/description */
  subtitle: string;
  /** Optional content on the right side of the header */
  headerRight?: ReactNode;
  /** CSS class for header container */
  headerClassName?: string;
  /** CSS class for icon container */
  iconClassName?: string;
  /** CSS class for title */
  titleClassName?: string;
  /** CSS class for subtitle */
  subtitleClassName?: string;
}

/**
 * Empty state configuration
 */
export interface UsageCardEmptyConfig {
  /** Icon name for empty state */
  icon?: IconName;
  /** @deprecated Use `icon` instead */
  iconName?: IconName;
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** @deprecated Use `description` instead */
  subtitle?: string;
  /** CSS class for empty state container */
  className?: string;
}

/**
 * Props for UsageCardHeader component
 */
export interface UsageCardHeaderProps extends UsageCardHeaderConfig {}

/**
 * Props for UsageCardEmpty component
 */
export interface UsageCardEmptyProps extends UsageCardEmptyConfig {}

/**
 * Props for BaseUsageCard component
 */
export interface BaseUsageCardProps {
  /** Header configuration */
  header: UsageCardHeaderConfig;
  /** Card content */
  children: ReactNode;
  /** CSS class for card */
  className?: string;
  /** Show gradient overlay (default: false) */
  showGradient?: boolean;
  /** Empty state configuration - renders instead of children when isEmpty is true */
  emptyState?: UsageCardEmptyConfig;
  /** Whether the card is in empty state */
  isEmpty?: boolean;
  /** Loading state - renders instead of children when isLoading is true */
  loadingContent?: ReactNode;
  /** Whether the card is loading */
  isLoading?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
