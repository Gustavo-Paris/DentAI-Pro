/**
 * TrendIndicator Component
 *
 * Shows trend direction with icon and percentage.
 *
 * @module metric-card/components/TrendIndicator
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { MetricCardTrend } from '../types';

export interface TrendIndicatorProps {
  trend: MetricCardTrend;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ trend, size = 'md' }: TrendIndicatorProps) {
  const isPositive = trend.isPositive ?? trend.direction === 'up';
  const iconName = trend.direction === 'up' ? 'trending-up' : 'trending-down';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  if (trend.direction === 'neutral') {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        isPositive ? 'text-success' : 'text-destructive'
      )}
    >
      <PageIcon name={iconName} className={iconSize} />
      <span>
        {isPositive ? '+' : ''}
        {trend.value}%
      </span>
      {trend.label && (
        <span className="text-muted-foreground ml-1">{trend.label}</span>
      )}
    </span>
  );
}

TrendIndicator.displayName = 'TrendIndicator';
