/**
 * Time Duration Formatters
 *
 * Provides consistent time duration formatting across the application.
 * These formatters complement the date.ts formatters for time-specific needs.
 */

export type TranslationFn = (key: string, values?: Record<string, number>) => string;

export interface FormatDurationVerboseOptions {
  /**
   * Translation function from useTranslations('common.time')
   * If not provided, uses fallback strings (deprecated)
   */
  t?: TranslationFn;
}

/**
 * Format seconds to verbose duration string
 *
 * @param seconds - Duration in seconds
 * @param options - Formatting options
 * @returns Verbose formatted string
 *
 * @example With translation
 * ```tsx
 * const t = useTranslations('common.time');
 * formatDurationVerbose(45, { t });    // "45 seconds" (localized)
 * formatDurationVerbose(120, { t });   // "2 minutes" (localized)
 * formatDurationVerbose(135, { t });   // "2 min 15 sec" (localized)
 * formatDurationVerbose(3661, { t });  // "1h 1min"
 * ```
 *
 * @example Without translation (fallback)
 * ```tsx
 * formatDurationVerbose(45);  // "45 segundos"
 * ```
 */
export function formatDurationVerbose(
  seconds: number,
  options: FormatDurationVerboseOptions = {}
): string {
  const { t } = options;

  if (seconds < 60) {
    if (t) return t('seconds', { count: seconds });
    return `${seconds} segundos`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    if (remainingSeconds > 0) {
      if (t) return t('minSec', { min: minutes, sec: remainingSeconds });
      return `${minutes} min ${remainingSeconds} seg`;
    }
    if (t) return t('minutes', { count: minutes });
    return `${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format milliseconds to HH:MM:SS countdown format
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted countdown string
 *
 * @example
 * ```tsx
 * formatCountdown(330000);  // "00:05:30"
 * formatCountdown(3600000); // "01:00:00"
 * ```
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Format seconds to MM:SS or H:MM:SS timer format
 *
 * @param totalSeconds - Duration in seconds
 * @returns Formatted timer string
 *
 * @example
 * ```tsx
 * formatTimer(330);  // "05:30"
 * formatTimer(3661); // "1:01:01"
 * ```
 */
export function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
