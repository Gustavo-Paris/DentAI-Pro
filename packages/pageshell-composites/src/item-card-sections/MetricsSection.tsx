'use client';

/**
 * MetricsSection Component
 *
 * Reusable metrics display for cards with label/value pairs and optional icons.
 *
 * @module item-card-sections
 */

import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { MetricsSectionProps, MetricItem } from './types';

/**
 * Individual metric item component
 */
function MetricItemDisplay({
  item,
  compact,
}: {
  item: MetricItem;
  compact?: boolean;
}) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className={cn(compact ? 'flex items-center gap-1' : '')}>
      {item.icon && (
        <PageIcon
          name={item.icon}
          className={cn('h-4 w-4', compact ? '' : 'mb-1', 'text-muted-foreground')}
        />
      )}
      <span className="text-muted-foreground text-sm">{item.label}</span>
      <span
        className={cn(
          'font-medium',
          compact ? 'ml-1' : 'ml-0 block',
          item.trend && trendColors[item.trend]
        )}
      >
        {item.value}
        {item.suffix && (
          <span className="text-muted-foreground text-xs ml-0.5">
            {item.suffix}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * MetricsSection - Displays a grid of metrics
 *
 * @example
 * ```tsx
 * <MetricsSection
 *   title="Performance"
 *   items={[
 *     { label: 'Sold', value: 12, icon: 'shopping-cart' },
 *     { label: 'Pending', value: 5, icon: 'clock' },
 *     { label: 'Revenue', value: '$1,234', icon: 'dollar-sign' },
 *   ]}
 *   columns={2}
 * />
 * ```
 */
export function MetricsSection({
  items,
  title,
  columns = 2,
  className,
  compact = false,
}: MetricsSectionProps) {
  if (items.length === 0) return null;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('pt-2 border-t border-border', className)}>
      {title && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <PageIcon name="trending-up" className="h-4 w-4" />
          {title}
        </div>
      )}
      <div className={cn('grid gap-2 text-sm', gridCols[columns])}>
        {items.map((item, index) => (
          <MetricItemDisplay key={index} item={item} compact={compact} />
        ))}
      </div>
    </div>
  );
}

MetricsSection.displayName = 'MetricsSection';
