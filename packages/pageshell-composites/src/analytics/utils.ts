/**
 * AnalyticsPage Utilities
 *
 * Utility functions and constants for AnalyticsPage.
 *
 * @module analytics/utils
 */

import { formatDurationMinutes, getNestedValue } from '@pageshell/core';
import type { AnalyticsDateRange, DateRangeResult, AnalyticsKPI } from './types';

// =============================================================================
// Date Range Utilities
// =============================================================================

/**
 * Calculate date range from config
 */
export function calculateDateRange(config: AnalyticsDateRange): DateRangeResult {
  const end = new Date();
  let start: Date;

  if (config.getStartDate) {
    start = config.getStartDate();
  } else if (config.days !== undefined) {
    start = new Date(end.getTime() - config.days * 24 * 60 * 60 * 1000);
  } else {
    // "All time" - use a very old date
    start = new Date(2020, 0, 1);
  }

  // Calculate day count
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  // Generate label
  const label = config.label ?? (config.days ? `Last ${config.days} days` : 'All time');

  return { start, end, rangeId: config.id, label, dayCount };
}

// =============================================================================
// Format Utilities
// =============================================================================

/**
 * Format KPI value based on format type
 */
export function formatKPIValue(
  value: unknown,
  format?: AnalyticsKPI['format'],
  formatValue?: (v: unknown) => string
): string {
  if (value === null || value === undefined) return '—';

  if (format === 'custom' && formatValue) {
    return formatValue(value);
  }

  const numValue = Number(value);

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numValue);

    case 'percent':
      return `${numValue}%`;

    case 'duration':
      return formatDurationMinutes(numValue);

    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR').format(numValue);
  }
}

// Re-export getNestedValue from @pageshell/core for backward compatibility
export { getNestedValue } from '@pageshell/core';

// =============================================================================
// Constants
// =============================================================================

/** Icon color classes for KPI cards */
export const KPI_ICON_COLOR_CLASSES: Record<string, string> = {
  violet: 'text-violet-500 bg-violet-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  blue: 'text-blue-500 bg-blue-500/10',
  cyan: 'text-cyan-500 bg-cyan-500/10',
  red: 'text-red-500 bg-red-500/10',
};
