/**
 * TrendIndicator Component
 *
 * @module page-stats
 */

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@pageshell/core';
import type { StatTrend } from '../types';

// =============================================================================
// Component
// =============================================================================

const trendColors = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

const TrendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function TrendIndicator({ trend }: { trend: StatTrend }) {
  const TrendIcon = TrendIcons[trend.direction];
  const sign = trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : '';

  return (
    <div className={cn('flex items-center gap-1 text-sm', trendColors[trend.direction])}>
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
