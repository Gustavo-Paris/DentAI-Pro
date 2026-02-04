/**
 * Analytics Logic Utilities
 *
 * @module hooks/analytics
 */

import { formatDurationMinutes } from '../../formatters';
import type { AnalyticsKPIConfig, AnalyticsTrend } from './types';

// =============================================================================
// Value Formatting
// =============================================================================

/**
 * Format a value based on the specified format type
 */
export function formatAnalyticsValue(
  value: unknown,
  format: AnalyticsKPIConfig['format'] | undefined,
  locale: string,
  currency: string,
  customFormatter?: (v: unknown) => string
): string {
  if (value === null || value === undefined) return '—';

  if (format === 'custom' && customFormatter) {
    return customFormatter(value);
  }

  const numValue = typeof value === 'number' ? value : Number(value);

  switch (format) {
    case 'currency':
      if (isNaN(numValue)) return '—';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numValue);

    case 'percent':
      if (isNaN(numValue)) return '—';
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(numValue / 100);

    case 'duration':
      if (isNaN(numValue)) return '—';
      return formatDurationMinutes(numValue);

    case 'number':
    default:
      if (isNaN(numValue)) return String(value);
      return new Intl.NumberFormat(locale).format(numValue);
  }
}

// =============================================================================
// Trend Calculation
// =============================================================================

/**
 * Calculate trend between current and previous values
 */
export function calculateAnalyticsTrend(
  current: number,
  previous: number
): AnalyticsTrend {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'neutral',
      formatted: current > 0 ? '+100%' : '0%',
    };
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction: 'up' | 'down' | 'neutral' =
    change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral';
  const sign = change > 0 ? '+' : '';

  return {
    value: Math.abs(change),
    direction,
    formatted: `${sign}${change.toFixed(1)}%`,
  };
}
