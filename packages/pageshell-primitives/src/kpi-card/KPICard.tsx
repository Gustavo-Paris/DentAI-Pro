'use client';

/**
 * KPICard - Reusable KPI/Stats Card Primitive
 *
 * Visual component for displaying key metrics with optional trends.
 * Framework-agnostic and doesn't depend on PageShellContext.
 *
 * @module @pageshell/primitives/kpi-card
 *
 * @example Basic usage
 * ```tsx
 * <KPICard
 *   label="Total Users"
 *   value={1234}
 *   icon={Users}
 * />
 * ```
 *
 * @example With trend
 * ```tsx
 * <KPICard
 *   label="Revenue"
 *   value="R$ 12.450"
 *   trend={{ value: 12.5, direction: 'up' }}
 *   icon={DollarSign}
 * />
 * ```
 *
 * @example With formatting
 * ```tsx
 * <KPICard
 *   label="Conversion Rate"
 *   value={85.7}
 *   format="percent"
 *   trend={{ value: 5.2, direction: 'up', label: 'vs last week' }}
 * />
 * ```
 *
 * @example Clickable
 * ```tsx
 * <KPICard
 *   label="Active Courses"
 *   value={42}
 *   onClick={() => navigate('/courses')}
 *   icon={BookOpen}
 * />
 * ```
 *
 * @example Loading state
 * ```tsx
 * <KPICard
 *   label="Loading..."
 *   value={0}
 *   isLoading
 * />
 * ```
 *
 * @example Custom color
 * ```tsx
 * <KPICard
 *   label="Premium Users"
 *   value={567}
 *   color="#8b5cf6"
 *   icon={Crown}
 * />
 * ```
 */

import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn, formatValue, type ValueFormat } from '@pageshell/core';
import { Card } from '../card';

// =============================================================================
// Types
// =============================================================================

/**
 * KPI card size variant
 */
export type KPICardSize = 'sm' | 'md' | 'lg';

/**
 * Trend direction
 */
export type KPITrendDirection = 'up' | 'down' | 'neutral';

/**
 * Trend configuration
 */
export interface KPITrend {
  /** Percentage or absolute change value */
  value: number;
  /** Direction of the trend */
  direction: KPITrendDirection;
  /** Optional label (e.g., "vs last month") */
  label?: string;
}

/**
 * Comparison configuration
 */
export interface KPIComparison {
  /** Previous value for comparison */
  value: number | string;
  /** Label for the comparison (e.g., "previous month") */
  label: string;
}

/**
 * KPICard props
 */
export interface KPICardProps {
  /** Metric label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Value format type */
  format?: ValueFormat;
  /** Prefix for value (e.g., "R$") */
  prefix?: string;
  /** Suffix for value (e.g., "%") */
  suffix?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Subtitle color variant */
  subtitleColor?: 'default' | 'success' | 'warning' | 'error';
  /** Icon component */
  icon?: LucideIcon;
  /** Show icon with background */
  iconBackground?: boolean;
  /** Icon/accent color (CSS color value) */
  color?: string;
  /** Trend indicator */
  trend?: KPITrend;
  /** Comparison with previous value */
  comparison?: KPIComparison;
  /** Card size variant */
  size?: KPICardSize;
  /** Loading state */
  isLoading?: boolean;
  /** Click handler (makes card interactive) */
  onClick?: () => void;
  /** Custom content below the value */
  children?: ReactNode;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Size Configurations
// =============================================================================

const sizeConfig = {
  sm: {
    padding: 'p-4',
    labelSize: 'text-xs',
    valueSize: 'text-xl',
    iconSize: 'h-6 w-6',
    iconBgSize: 'p-2',
    subtitleSize: 'text-xs',
    trendSize: 'text-xs',
  },
  md: {
    padding: 'p-5',
    labelSize: 'text-sm',
    valueSize: 'text-2xl',
    iconSize: 'h-8 w-8',
    iconBgSize: 'p-2.5',
    subtitleSize: 'text-sm',
    trendSize: 'text-sm',
  },
  lg: {
    padding: 'p-6',
    labelSize: 'text-sm',
    valueSize: 'text-3xl',
    iconSize: 'h-10 w-10',
    iconBgSize: 'p-3',
    subtitleSize: 'text-sm',
    trendSize: 'text-sm',
  },
};

// =============================================================================
// Trend Indicator Component
// =============================================================================

function TrendIndicator({
  trend,
  size,
}: {
  trend: KPITrend;
  size: KPICardSize;
}) {
  const config = sizeConfig[size];

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend.direction];

  const sign = trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : '';

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        config.trendSize,
        trendColors[trend.direction]
      )}
    >
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

// =============================================================================
// Loading Skeleton
// =============================================================================

function KPICardSkeleton({ size }: { size: KPICardSize }) {
  const config = sizeConfig[size];

  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className={cn('h-4 bg-muted rounded w-24', config.labelSize)} />
          <div className={cn('h-8 bg-muted rounded w-20', config.valueSize)} />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div
          className={cn('rounded-full bg-muted', config.iconBgSize, config.iconSize)}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function KPICard({
  label,
  value,
  format,
  prefix,
  suffix,
  subtitle,
  subtitleColor = 'default',
  icon: Icon,
  iconBackground = false,
  color,
  trend,
  comparison,
  size = 'md',
  isLoading = false,
  onClick,
  children,
  testId,
}: KPICardProps) {
  const sizeStyles = sizeConfig[size];

  const subtitleColorClass = {
    default: 'text-muted-foreground',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
  }[subtitleColor];

  // Format the value
  const formattedValue = format ? formatValue(value, format) : value;

  // Format with prefix/suffix
  const displayValue = (
    <>
      {prefix && <span className="text-muted-foreground mr-0.5">{prefix}</span>}
      {formattedValue}
      {suffix && <span className="text-muted-foreground ml-0.5">{suffix}</span>}
    </>
  );

  // Is card interactive
  const isInteractive = Boolean(onClick);

  // Card classes
  const cardClasses = cn(
    sizeStyles.padding,
    isInteractive && [
      'cursor-pointer transition-all duration-200',
      'hover:shadow-md hover:border-primary/30',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
      'group',
    ]
  );

  // Card content
  const content = (
    <>
      {isLoading ? (
        <KPICardSkeleton size={size} />
      ) : (
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Label and Value */}
          <div className="flex-1 min-w-0">
            {/* Label */}
            <p
              className={cn(
                sizeStyles.labelSize,
                'font-medium text-muted-foreground'
              )}
            >
              {label}
            </p>

            {/* Value */}
            <p
              className={cn(
                sizeStyles.valueSize,
                'font-bold text-foreground mt-1 tabular-nums'
              )}
            >
              {displayValue}
            </p>

            {/* Trend indicator */}
            {trend && (
              <div className="mt-2">
                <TrendIndicator trend={trend} size={size} />
              </div>
            )}

            {/* Comparison */}
            {comparison && !trend && (
              <p
                className={cn('mt-2', sizeStyles.subtitleSize, 'text-muted-foreground')}
              >
                <span className="font-medium">{comparison.value}</span>{' '}
                <span>{comparison.label}</span>
              </p>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className={cn('mt-2', sizeStyles.subtitleSize, subtitleColorClass)}>
                {subtitle}
              </p>
            )}

            {/* Custom children */}
            {children && <div className="mt-3">{children}</div>}
          </div>

          {/* Right side: Icon */}
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 transition-transform',
                isInteractive && 'group-hover:scale-110',
                iconBackground && [
                  'rounded-xl',
                  sizeStyles.iconBgSize,
                  // Use theme primary color when no custom color is provided
                  !color && 'bg-primary/10',
                ]
              )}
              style={
                iconBackground && color
                  ? { backgroundColor: `${color}15` }
                  : undefined
              }
            >
              <Icon
                className={cn(
                  sizeStyles.iconSize,
                  // Use theme primary color when no custom color is provided
                  !color && iconBackground && 'text-primary'
                )}
                style={color ? { color } : undefined}
              />
            </div>
          )}
        </div>
      )}
    </>
  );

  // Render as button if onClick provided
  if (onClick) {
    return (
      <Card
        className={cardClasses}
        data-testid={testId}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </Card>
    );
  }

  // Render as static card
  return (
    <Card className={cardClasses} data-testid={testId}>
      {content}
    </Card>
  );
}

KPICard.displayName = 'KPICard';

// =============================================================================
// Convenience Components
// =============================================================================

/**
 * KPICardGroup - Wrapper for a row of KPI cards
 */
export interface KPICardGroupProps {
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Children KPI cards */
  children: ReactNode;
}

export function KPICardGroup({
  columns = 4,
  children,
}: KPICardGroupProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns])}>
      {children}
    </div>
  );
}

KPICardGroup.displayName = 'KPICardGroup';
