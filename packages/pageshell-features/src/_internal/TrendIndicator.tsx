'use client';

/**
 * TrendIndicator - Shared component for displaying trend data
 *
 * Used by PageStats and PageStatsCard to show trend direction with icon.
 *
 * @internal This component is not exported from the package
 */

import { cn } from '@pageshell/core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface TrendData {
  /** Trend direction */
  direction: 'up' | 'down' | 'neutral';
  /** Trend value (percentage) */
  value: number;
  /** Optional label (e.g., "vs last month") */
  label?: string;
}

export interface TrendIndicatorProps {
  /** Trend data to display */
  trend: TrendData;
  /** Size class for the indicator (default: 'text-sm') */
  sizeClass?: string;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TREND_COLORS = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
} as const;

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

const TREND_SIGNS = {
  up: '+',
  down: '-',
  neutral: '',
} as const;

// =============================================================================
// Component
// =============================================================================

/**
 * Displays a trend indicator with direction icon, value, and optional label.
 *
 * @example
 * ```tsx
 * <TrendIndicator
 *   trend={{ direction: 'up', value: 12.5, label: 'vs last month' }}
 * />
 * ```
 */
export function TrendIndicator({
  trend,
  sizeClass = 'text-sm',
  className,
}: TrendIndicatorProps) {
  const TrendIcon = TREND_ICONS[trend.direction];
  const colorClass = TREND_COLORS[trend.direction];
  const sign = TREND_SIGNS[trend.direction];

  return (
    <div className={cn('flex items-center gap-1', sizeClass, colorClass, className)}>
      <TrendIcon className="h-3.5 w-3.5" />
      <span className="font-medium">
        {sign}
        {Math.abs(trend.value).toFixed(1)}%
      </span>
      {trend.label && (
        <span className="text-muted-foreground font-normal">{trend.label}</span>
      )}
    </div>
  );
}
