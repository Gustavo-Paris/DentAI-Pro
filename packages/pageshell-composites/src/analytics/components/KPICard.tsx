/**
 * AnalyticsPage KPI Card
 *
 * KPI metric card component for AnalyticsPage.
 *
 * @module analytics/components/KPICard
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Card, resolveIcon } from '@pageshell/primitives';
import type { AnalyticsKPI } from '../types';
import { formatKPIValue, KPI_ICON_COLOR_CLASSES } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface KPICardProps<T = unknown> {
  /** KPI configuration */
  kpi: AnalyticsKPI<T>;
  /** KPI value */
  value: unknown;
  /** Full data object */
  data: T;
}

// =============================================================================
// Component
// =============================================================================

export const KPICard = React.memo(function KPICard<T>({
  kpi,
  value,
  data,
}: KPICardProps<T>) {
  const Icon = resolveIcon(kpi.icon);
  const formattedValue = formatKPIValue(value, kpi.format, kpi.formatValue);

  // Compute helper text
  let helperText: string | undefined;
  if (kpi.helper) {
    helperText =
      typeof kpi.helper === 'function' ? kpi.helper(value, data) : kpi.helper;
  }

  // Handle click
  const handleClick = () => {
    if (kpi.onClick) {
      kpi.onClick(value, data);
    }
  };

  // Card content extracted for reuse
  const cardContent = (
    <div className="p-4 sm:p-5 flex items-center gap-4">
      {Icon && (
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center',
            KPI_ICON_COLOR_CLASSES[kpi.iconColor || 'blue'] || 'bg-muted'
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{kpi.label}</span>
        <span className="text-xl font-semibold text-foreground">
          {formattedValue}
        </span>
        {helperText && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>
    </div>
  );

  // If clickable, wrap in button for accessibility
  if (kpi.onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${kpi.label}: ${formattedValue}${helperText ? `. ${helperText}` : ''}`}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      >
        <Card
          className={cn(
            'transition-all duration-200',
            'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
          )}
        >
          {cardContent}
        </Card>
      </button>
    );
  }

  return <Card>{cardContent}</Card>;
}) as <T>(props: KPICardProps<T>) => React.JSX.Element;

(KPICard as React.FC).displayName = 'KPICard';
