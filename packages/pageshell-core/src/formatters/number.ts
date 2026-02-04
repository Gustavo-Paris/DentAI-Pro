/**
 * Format a number with locale-specific formatting
 *
 * @example
 * formatNumber(1234567.89) // => '1.234.567,89'
 * formatNumber(1234567.89, { locale: 'en-US' }) // => '1,234,567.89'
 */
export function formatNumber(
  value: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const { locale = 'pt-BR', minimumFractionDigits, maximumFractionDigits } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a number in compact notation (e.g., 1K, 1M)
 *
 * @example
 * formatCompactNumber(1500) // => '1,5 mil'
 * formatCompactNumber(1500000) // => '1,5 mi'
 */
export function formatCompactNumber(
  value: number,
  options: { locale?: string } = {}
): string {
  const { locale = 'pt-BR' } = options;

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Format a number as percentage
 *
 * @example
 * formatPercent(0.75) // => '75%'
 * formatPercent(0.756, { decimals: 1 }) // => '75,6%'
 */
export function formatPercent(
  value: number,
  options: {
    locale?: string;
    decimals?: number;
    multiply?: boolean;
  } = {}
): string {
  const { locale = 'pt-BR', decimals = 0, multiply = true } = options;

  const percentValue = multiply ? value * 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(multiply ? value : value / 100);
}

/**
 * Format a boolean value
 *
 * @example
 * formatBoolean(true) // => 'Sim'
 * formatBoolean(false, { locale: 'en' }) // => 'No'
 */
export function formatBoolean(
  value: unknown,
  options: { locale?: string; trueLabel?: string; falseLabel?: string } = {}
): string {
  const {
    locale = 'pt-BR',
    trueLabel = locale.startsWith('pt') ? 'Sim' : 'Yes',
    falseLabel = locale.startsWith('pt') ? 'Não' : 'No',
  } = options;

  return Boolean(value) ? trueLabel : falseLabel;
}

/**
 * Format duration in seconds to human-readable format
 *
 * @example
 * formatDuration(3661) // => '1h 1m 1s'
 * formatDuration(65) // => '1m 5s'
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '-';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format duration in minutes to human-readable format
 * Used primarily for analytics/KPI display
 *
 * @example
 * formatDurationMinutes(90) // => '1h 30min'
 * formatDurationMinutes(45) // => '45min'
 */
export function formatDurationMinutes(minutes: number): string {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
