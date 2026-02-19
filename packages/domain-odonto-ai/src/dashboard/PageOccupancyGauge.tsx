'use client';

/**
 * PageOccupancyGauge - Occupancy gauge visualization
 *
 * Displays a circular gauge showing the occupied/total ratio. Color
 * transitions from green (low) to yellow (medium) to red (high) as
 * occupancy increases.
 *
 * @example
 * ```tsx
 * <PageOccupancyGauge
 *   data={{ total: 10, occupied: 7, label: 'Chairs' }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { OccupancyData } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageOccupancyGaugeProps {
  /** Occupancy data */
  data: OccupancyData;
  /** Size of the gauge in pixels */
  size?: number;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getOccupancyColor(ratio: number): string {
  if (ratio < 0.5) return 'text-emerald-500';
  if (ratio < 0.75) return 'text-amber-500';
  return 'text-red-500';
}

function getStrokeColor(ratio: number): string {
  if (ratio < 0.5) return '#10b981';
  if (ratio < 0.75) return '#f59e0b';
  return '#ef4444';
}

function getStatusLabel(ratio: number): string {
  if (ratio < 0.5) return tPageShell('domain.odonto.dashboard.occupancy.low', 'Low');
  if (ratio < 0.75) return tPageShell('domain.odonto.dashboard.occupancy.medium', 'Moderate');
  return tPageShell('domain.odonto.dashboard.occupancy.high', 'High');
}

// =============================================================================
// Component
// =============================================================================

export function PageOccupancyGauge({
  data,
  size = 120,
  className,
}: PageOccupancyGaugeProps) {
  const ratio = data.total > 0 ? data.occupied / data.total : 0;
  const percentage = Math.round(ratio * 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);
  const center = size / 2;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <PageIcon name="pie-chart" className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {tPageShell('domain.odonto.dashboard.occupancy.title', 'Occupancy')}
        </h3>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            {/* Filled arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={getStrokeColor(ratio)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold', getOccupancyColor(ratio))}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats below */}
        <div className="mt-3 text-center">
          <p className="text-sm font-medium">
            {data.occupied}/{data.total}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.label ?? tPageShell('domain.odonto.dashboard.occupancy.defaultLabel', 'Chairs')}
            {' '}&middot;{' '}
            {getStatusLabel(ratio)}
          </p>
        </div>
      </div>
    </div>
  );
}
