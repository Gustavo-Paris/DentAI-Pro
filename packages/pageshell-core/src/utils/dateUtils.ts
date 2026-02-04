/**
 * Date Utility Functions
 *
 * Shared date manipulation functions used across PageShell hooks.
 *
 * @module utils/dateUtils
 */

/**
 * Subtract days from a date.
 *
 * @param date - The starting date
 * @param days - Number of days to subtract
 * @returns New date with days subtracted
 *
 * @example
 * subDays(new Date('2025-01-10'), 7) // Returns Jan 3, 2025
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Add days to a date.
 *
 * @param date - The starting date
 * @param days - Number of days to add
 * @returns New date with days added
 *
 * @example
 * addDays(new Date('2025-01-10'), 7) // Returns Jan 17, 2025
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates represent the same day (ignoring time).
 *
 * @param a - First date
 * @param b - Second date
 * @returns True if same day
 *
 * @example
 * isSameDay(new Date('2025-01-10 08:00'), new Date('2025-01-10 20:00')) // true
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date is today.
 *
 * @param date - Date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get start of day for a date (00:00:00.000).
 *
 * @param date - Source date
 * @returns New date at start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day for a date (23:59:59.999).
 *
 * @param date - Source date
 * @returns New date at end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calculate the number of days between two dates.
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of days between dates (can be negative)
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}
