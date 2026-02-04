/**
 * Format a date value
 *
 * @param value - Date, string, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // => '01/01/2026'
 * formatDate('2026-01-01', { format: 'long' }) // => '1 de janeiro de 2026'
 */
export function formatDate(
  value: Date | string | number,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long';
  } = {}
): string {
  const { locale = 'pt-BR', format = 'short' } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const formatOptions: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : format === 'medium'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'long', year: 'numeric' };

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format a date with time
 *
 * @example
 * formatDateTime(new Date()) // => '01/01/2026 14:30'
 */
export function formatDateTime(
  value: Date | string | number,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long';
  } = {}
): string {
  const { locale = 'pt-BR', format = 'short' } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const formatOptions: Intl.DateTimeFormatOptions =
    format === 'short'
      ? {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      : format === 'medium'
        ? {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        : {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          };

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format time only
 *
 * @example
 * formatTime(new Date()) // => '14:30'
 */
export function formatTime(
  value: Date | string | number,
  options: { locale?: string; showSeconds?: boolean } = {}
): string {
  const { locale = 'pt-BR', showSeconds = false } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds && { second: '2-digit' }),
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format compact relative timestamp (e.g., "5min", "2h", "3d")
 * Ideal for lists, feeds, and timelines
 *
 * @example
 * formatCompactRelativeTime(new Date(Date.now() - 300000)) // => '5min'
 * formatCompactRelativeTime(new Date(Date.now() - 300000), { showSuffix: true }) // => '5min atrás'
 */
export function formatCompactRelativeTime(
  value: Date | string | number,
  options: {
    locale?: string;
    showSuffix?: boolean;
    nowLabel?: string;
  } = {}
): string {
  const { locale = 'pt-BR', showSuffix = false, nowLabel = 'Agora' } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const suffix = showSuffix ? ' atrás' : '';

  if (diffMins < 1) return nowLabel;
  if (diffMins < 60) return `${diffMins}min${suffix}`;
  if (diffHours < 24) return `${diffHours}h${suffix}`;
  if (diffDays < 7) return `${diffDays}d${suffix}`;

  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => 'há 1 hora'
 */
export function formatRelativeTime(
  value: Date | string | number,
  options: { locale?: string } = {}
): string {
  const { locale = 'pt-BR' } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const now = Date.now();
  const diff = date.getTime() - now;
  const absDiff = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absDiff < 60000) {
    return rtf.format(Math.round(diff / 1000), 'second');
  } else if (absDiff < 3600000) {
    return rtf.format(Math.round(diff / 60000), 'minute');
  } else if (absDiff < 86400000) {
    return rtf.format(Math.round(diff / 3600000), 'hour');
  } else if (absDiff < 2592000000) {
    return rtf.format(Math.round(diff / 86400000), 'day');
  } else if (absDiff < 31536000000) {
    return rtf.format(Math.round(diff / 2592000000), 'month');
  } else {
    return rtf.format(Math.round(diff / 31536000000), 'year');
  }
}
