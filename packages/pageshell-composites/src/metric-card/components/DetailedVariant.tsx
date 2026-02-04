/**
 * DetailedVariant Component
 *
 * Expanded metric display with progress and items.
 *
 * @module metric-card/components/DetailedVariant
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { PageMetricCardProps } from '../types';
import { colorClasses, statusClasses } from '../constants';

export function DetailedVariant({
  icon,
  label,
  value,
  description,
  color = 'primary',
  status = 'default',
  progress,
  items,
  issues,
  className,
  testId,
}: PageMetricCardProps) {
  const colors = colorClasses[color];
  const statusClass = statusClasses[status];

  const progressColor =
    status === 'success'
      ? 'bg-success'
      : status === 'destructive'
        ? 'bg-destructive'
        : 'bg-warning';

  return (
    <div
      className={cn(
        'rounded-lg p-4 border',
        colors.icon.split(' ')[0],
        statusClass,
        className
      )}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <PageIcon name={icon} className={cn('h-5 w-5', colors.icon.split(' ')[1])} />
        )}
        <span className="font-medium text-foreground">{label}</span>
      </div>

      {/* Value */}
      <div className={cn('text-2xl font-bold font-mono mb-2', colors.value)}>
        {value}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}

      {/* Items list */}
      {items && items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', progressColor)}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Issues list */}
      {issues && issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Issues</p>
          <ul className="space-y-1">
            {issues.map((issue) => (
              <li
                key={issue}
                className="text-xs text-muted-foreground flex items-start gap-1"
              >
                <span className="text-destructive">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

DetailedVariant.displayName = 'DetailedVariant';
