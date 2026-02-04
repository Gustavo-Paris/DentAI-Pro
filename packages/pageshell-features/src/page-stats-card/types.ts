/**
 * PageStatsCard Types
 *
 * @module page-stats-card/types
 */

import type { ReactNode, ComponentType } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Base Types
// =============================================================================

/** Link component type for framework-agnostic usage */
export type LinkComponentType = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

export type PageStatsCardSize = 'sm' | 'md' | 'lg';
export type PageStatsCardVariant = 'default' | 'portal';
export type PageStatsCardPortalVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'streak'
  | 'warning'
  | 'info'
  | 'success';

export type TrendDirection = 'up' | 'down' | 'neutral';

// =============================================================================
// Trend and Comparison Types
// =============================================================================

export interface PageStatsCardTrend {
  /** Percentage or absolute change value */
  value: number;
  /** Direction of the trend */
  direction: TrendDirection;
  /** Optional label (e.g., "vs last month") */
  label?: string;
}

export interface PageStatsCardComparison {
  /** Previous value for comparison */
  value: number | string;
  /** Label for the comparison (e.g., "mês anterior") */
  label: string;
}

// =============================================================================
// Badge Type
// =============================================================================

/** Badge configuration */
export interface PageBadge {
  /** Badge label */
  label: string;
  /** Badge variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'accent';
}

// =============================================================================
// Component Props
// =============================================================================

export interface PageStatsCardProps {
  /** Stat label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle */
  subtitle?: string;
  /** Subtitle color variant */
  subtitleColor?: 'default' | 'success' | 'warning' | 'error';
  /** Icon to display */
  icon?: IconProp;
  /** Show icon with background */
  iconBackground?: boolean;
  /** Prefix for value (e.g., "R$") */
  prefix?: string;
  /** Suffix for value (e.g., "%") */
  suffix?: string;
  /** Trend indicator */
  trend?: PageStatsCardTrend;
  /** Comparison with previous value */
  comparison?: PageStatsCardComparison;
  /** Tooltip text for the label */
  tooltip?: string;
  /** Card size variant */
  size?: PageStatsCardSize;
  /** Visual style variant */
  variant?: PageStatsCardVariant;
  /** Portal stat style variant */
  portalVariant?: PageStatsCardPortalVariant;
  /** Loading state */
  isLoading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Link href (makes card clickable) */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom content below the value */
  children?: ReactNode;
  /** Badge element (portal variant top-right) */
  badge?: PageBadge | ReactNode;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic usage (e.g., Next.js Link for prefetch) */
  LinkComponent?: LinkComponentType;
}

// =============================================================================
// Size Config Type
// =============================================================================

export interface SizeConfigItem {
  padding: string;
  labelSize: string;
  valueSize: string;
  iconSize: string;
  iconBgSize: string;
  subtitleSize: string;
  trendSize: string;
}
