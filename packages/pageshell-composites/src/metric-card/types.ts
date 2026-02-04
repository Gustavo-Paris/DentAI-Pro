/**
 * PageMetricCard Types
 *
 * Type definitions for the PageMetricCard composite component.
 * Used for displaying key metrics, stats, and KPIs in a consistent format.
 *
 * @module metric-card/types
 */

import type { ReactNode } from 'react';

// =============================================================================
// Color Types
// =============================================================================

/**
 * Semantic color variants for metric cards
 */
export type MetricCardColor =
  | 'primary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

/**
 * Status variants that affect styling
 */
export type MetricCardStatus = 'default' | 'warning' | 'destructive' | 'success';

// =============================================================================
// Trend Types
// =============================================================================

/**
 * Trend indicator configuration
 */
export interface MetricCardTrend {
  /** Trend direction */
  direction: 'up' | 'down' | 'neutral';
  /** Change value (percentage or absolute) */
  value: number;
  /** Optional label for the change */
  label?: string;
  /** Whether the trend is positive (default: up=positive, down=negative) */
  isPositive?: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * PageMetricCard component props
 */
export interface PageMetricCardProps {
  // === Core Display ===
  /** Icon name for the metric */
  icon?: string;
  /** Label describing the metric */
  label: string;
  /** The metric value to display */
  value: string | number;

  // === Optional Details ===
  /** Sublabel or unit (e.g., "tokens", "credits") */
  sublabel?: string;
  /** Additional description text */
  description?: string;

  // === Visual Variants ===
  /** Card variant */
  variant?: 'card' | 'compact' | 'inline' | 'detailed';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  color?: MetricCardColor;
  /** Status affecting card styling */
  status?: MetricCardStatus;

  // === Trend/Change ===
  /** Trend indicator */
  trend?: MetricCardTrend;

  // === Interactive ===
  /** Link URL (makes card clickable) */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Link text (shown at bottom) */
  linkLabel?: string;

  // === State ===
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;

  // === Detailed variant extras ===
  /** Progress percentage (0-100) for detailed variant */
  progress?: number;
  /** Items list for detailed variant */
  items?: Array<{ label: string; value: string | number }>;
  /** Issues/warnings list for detailed variant */
  issues?: string[];

  // === Styling ===
  /** Additional className */
  className?: string;
  /** Animation delay for staggered animations */
  animationDelay?: number | string;
  /** Custom children */
  children?: ReactNode;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Grid Props
// =============================================================================

/**
 * PageMetricGrid component props for displaying multiple metrics
 */
export interface PageMetricGridProps {
  /** Metric card configurations or React children */
  children: ReactNode;
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

// =============================================================================
// Skeleton Props
// =============================================================================

/**
 * PageMetricCardSkeleton component props
 */
export interface PageMetricCardSkeletonProps {
  /** Variant to match */
  variant?: 'card' | 'compact' | 'inline' | 'detailed';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon skeleton */
  showIcon?: boolean;
  /** Show trend skeleton */
  showTrend?: boolean;
  /** Show progress skeleton (detailed variant) */
  showProgress?: boolean;
  /** Additional className */
  className?: string;
}
