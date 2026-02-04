/**
 * ItemCard Utilities
 *
 * Helper functions for the ItemCard component.
 *
 * @module item-card/utils
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 *
 * @param date - The date to format (string or Date object)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();

  // Handle future dates
  if (diffMs < 0) {
    return formatFutureTime(Math.abs(diffMs));
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'just now';
  }

  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }

  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }

  if (diffDay < 7) {
    return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
  }

  if (diffWeek < 4) {
    return diffWeek === 1 ? '1 week ago' : `${diffWeek} weeks ago`;
  }

  if (diffMonth < 12) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  }

  return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
}

/**
 * Format future time (for scheduled items)
 */
function formatFutureTime(diffMs: number): string {
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 60) {
    return diffMin <= 1 ? 'in 1 minute' : `in ${diffMin} minutes`;
  }

  if (diffHour < 24) {
    return diffHour === 1 ? 'in 1 hour' : `in ${diffHour} hours`;
  }

  if (diffDay < 7) {
    return diffDay === 1 ? 'tomorrow' : `in ${diffDay} days`;
  }

  return `in ${Math.floor(diffDay / 7)} weeks`;
}
