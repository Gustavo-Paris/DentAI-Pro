/**
 * PageMetricGrid Component
 *
 * A responsive grid wrapper for displaying multiple PageMetricCards.
 *
 * @module metric-card
 *
 * @example Basic usage
 * ```tsx
 * <PageMetricGrid columns={4}>
 *   <PageMetricCard icon="cpu" label="Input" value="1.2M" />
 *   <PageMetricCard icon="zap" label="Output" value="850K" />
 *   <PageMetricCard icon="activity" label="Requests" value="1234" />
 *   <PageMetricCard icon="calculator" label="Cost" value="$12.50" />
 * </PageMetricGrid>
 * ```
 *
 * @example With gap variant
 * ```tsx
 * <PageMetricGrid columns={3} gap="lg">
 *   {metrics.map(m => <PageMetricCard key={m.id} {...m} />)}
 * </PageMetricGrid>
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import type { PageMetricGridProps } from './types';

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function PageMetricGrid({
  children,
  columns = 4,
  gap = 'md',
  className,
}: PageMetricGridProps) {
  return (
    <div
      className={cn('grid', columnClasses[columns], gapClasses[gap], className)}
    >
      {children}
    </div>
  );
}

PageMetricGrid.displayName = 'PageMetricGrid';
