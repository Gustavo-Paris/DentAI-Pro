/**
 * Master value formatter for PageShell
 *
 * @module formatters/value
 */

import type { ValueFormat, FormatterOptions } from './types';
import { DEFAULT_FORMATTER_OPTIONS } from './types';
import { formatDate, formatDateTime, formatTime, formatRelativeTime } from './date';
import { formatCurrency } from './currency';
import { formatNumber, formatPercent, formatBoolean, formatDuration } from './number';

/**
 * Format a value based on the specified format type.
 *
 * @param value - The value to format
 * @param format - The format type
 * @param options - Formatting options
 * @returns Formatted string
 *
 * @example
 * ```ts
 * formatValue(1234.56, 'currency') // 'R$ 1.234,56'
 * formatValue(new Date(), 'date')   // '23/12/2025'
 * formatValue(75, 'percent')        // '75%'
 * formatValue(125, 'duration')      // '2h 5min'
 * ```
 */
export function formatValue(
  value: unknown,
  format?: ValueFormat,
  options?: FormatterOptions
): string {
  const opts = { ...DEFAULT_FORMATTER_OPTIONS, ...options };

  if (value === null || value === undefined) {
    return opts.emptyValue;
  }

  switch (format) {
    case 'date':
      return formatDate(value instanceof Date ? value : new Date(value as string | number), opts);

    case 'datetime':
      return formatDateTime(value instanceof Date ? value : new Date(value as string | number), opts);

    case 'time':
      return formatTime(value instanceof Date ? value : new Date(value as string | number), opts);

    case 'currency':
      return formatCurrency(typeof value === 'number' ? value : parseFloat(String(value)), opts);

    case 'number':
      return formatNumber(typeof value === 'number' ? value : parseFloat(String(value)), opts);

    case 'percent':
      return formatPercent(typeof value === 'number' ? value : parseFloat(String(value)));

    case 'duration':
      return formatDuration(typeof value === 'number' ? value : parseFloat(String(value)));

    case 'boolean':
      return formatBoolean(Boolean(value));

    case 'relative':
      return formatRelativeTime(value instanceof Date ? value : new Date(value as string | number), opts);

    case 'status':
    case 'badge':
      return String(value);

    case 'tags':
      return Array.isArray(value) ? value.join(', ') : String(value);

    case 'text':
    default:
      return String(value);
  }
}

/**
 * Get a nested value from an object using dot notation
 *
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., 'user.profile.name')
 * @returns The value at the path, or undefined
 *
 * @example
 * ```ts
 * const obj = { user: { profile: { name: 'John' } } };
 * getNestedValue(obj, 'user.profile.name') // 'John'
 * getNestedValue(obj, 'user.email')        // undefined
 * ```
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
