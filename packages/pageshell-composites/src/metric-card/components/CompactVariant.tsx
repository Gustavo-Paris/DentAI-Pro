/**
 * CompactVariant Component
 *
 * Pill-style compact metric display.
 *
 * @module metric-card/components/CompactVariant
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { PageMetricCardProps } from '../types';
import { colorClasses, statusClasses } from '../constants';
import { TrendIndicator } from './TrendIndicator';

export function CompactVariant({
  icon,
  value,
  sublabel,
  color = 'primary',
  status = 'default',
  trend,
  className,
  testId,
}: PageMetricCardProps) {
  const colors = colorClasses[color];
  const statusClass = statusClasses[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'bg-muted/60',
        statusClass,
        className
      )}
      data-testid={testId}
    >
      {icon && (
        <PageIcon name={icon} className={cn('h-4 w-4', colors.icon.split(' ')[1])} />
      )}
      <span className={cn('font-mono font-bold', colors.value)}>{value}</span>
      {sublabel && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {sublabel}
        </span>
      )}
      {trend && <TrendIndicator trend={trend} size="sm" />}
    </div>
  );
}

CompactVariant.displayName = 'CompactVariant';
