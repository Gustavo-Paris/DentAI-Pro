'use client';

/**
 * MiniGauge Component
 *
 * Compact usage indicator with horizontal bar.
 * Shows glow effect when critical (>=90%).
 *
 * @module mini-gauge
 */

import { memo } from 'react';
import { cn, getGaugeStatus, getGaugeStatusClasses } from '@pageshell/core';
import { PageIcon } from '../page-icon';
import type { MiniGaugeProps } from './types';

/**
 * Default value formatter (simple number with 2 decimals)
 */
const defaultFormatValue = (value: number) => value.toFixed(2);

/**
 * MiniGauge - Compact usage indicator for limits
 *
 * Shows a sleek horizontal bar with glow effect when critical.
 * Memoized to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * <MiniGauge
 *   value={75.50}
 *   limit={100}
 *   percentage={75.5}
 *   label="Today"
 *   icon="clock"
 *   formatValue={(v) => formatUsd(v)}
 * />
 * ```
 */
export const MiniGauge = memo(function MiniGauge({
  value,
  limit,
  percentage,
  label,
  sublabel,
  icon,
  showGlow = true,
  formatValue = defaultFormatValue,
  formatLimit = defaultFormatValue,
  noLimitText = 'No limit set',
  className,
}: MiniGaugeProps) {
  const status = getGaugeStatus(percentage);
  const statusClasses = getGaugeStatusClasses(status);
  const isCritical = status === 'critical';

  return (
    <div
      className={cn(
        'mini-gauge rounded-lg p-3 bg-card border border-border',
        `mini-gauge-${status}`,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <PageIcon
              name={icon}
              className={cn('h-4 w-4', statusClasses.text)}
            />
          )}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        {isCritical && (
          <PageIcon
            name="alert-triangle"
            className="h-4 w-4 text-destructive animate-pulse"
          />
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-foreground mb-1">
        {formatValue(value)}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className="text-xs text-muted-foreground mb-2">{sublabel}</div>
      )}

      {/* Progress bar and percentage */}
      {limit !== null ? (
        <>
          <div className="text-xs text-muted-foreground mb-2">
            de {formatLimit(limit)}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-border rounded-full overflow-hidden relative">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                statusClasses.bg
              )}
              style={{ width: `${Math.min(percentage ?? 0, 100)}%` }}
            />
            {/* Glow overlay when critical */}
            {showGlow && isCritical && (
              <div
                className="absolute inset-y-0 left-0 bg-destructive/30 blur-sm rounded-full"
                style={{ width: `${Math.min(percentage ?? 0, 100)}%` }}
              />
            )}
          </div>

          {/* Percentage */}
          <div className={cn('text-sm font-medium mt-1', statusClasses.text)}>
            {percentage !== null ? `${percentage.toFixed(0)}%` : '—'}
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">{noLimitText}</div>
      )}
    </div>
  );
});

MiniGauge.displayName = 'MiniGauge';
