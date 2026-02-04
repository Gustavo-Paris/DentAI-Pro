/**
 * InlineVariant Component
 *
 * Row-style inline metric display.
 *
 * @module metric-card/components/InlineVariant
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { PageMetricCardProps } from '../types';
import { colorClasses } from '../constants';
import { TrendIndicator } from './TrendIndicator';

export function InlineVariant({
  icon,
  label,
  value,
  sublabel,
  color = 'primary',
  trend,
  className,
  testId,
}: PageMetricCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn('flex items-center justify-between py-2', className)}
      data-testid={testId}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <PageIcon name={icon} className={cn('h-4 w-4', colors.icon.split(' ')[1])} />
        )}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('font-mono font-medium', colors.value)}>{value}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
        {trend && <TrendIndicator trend={trend} size="sm" />}
      </div>
    </div>
  );
}

InlineVariant.displayName = 'InlineVariant';
