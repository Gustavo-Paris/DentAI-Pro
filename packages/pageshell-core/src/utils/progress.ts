/**
 * Progress Calculation Utilities
 *
 * Provides consistent progress and usage percentage calculations.
 */

/**
 * Calculate progress percentage with bounds checking
 *
 * @param current - Current value
 * @param total - Total/target value
 * @returns Percentage between 0 and 100
 *
 * @example
 * ```tsx
 * calculateProgress(3, 10);  // 30
 * calculateProgress(15, 10); // 100 (capped)
 * calculateProgress(0, 0);   // 0 (safe division)
 * ```
 */
export function calculateProgress(current: number, total: number): number {
  if (total <= 0) return 0;
  const percent = (current / total) * 100;
  return Math.min(Math.max(0, percent), 100);
}

/**
 * Calculate usage percentage (alias for calculateProgress)
 * Semantically clearer for quota/limit contexts
 *
 * @param used - Amount used
 * @param limit - Total limit
 * @returns Percentage between 0 and 100
 *
 * @example
 * ```tsx
 * calculateUsagePercent(75, 100);  // 75
 * calculateUsagePercent(150, 100); // 100 (capped at 100%)
 * ```
 */
export function calculateUsagePercent(used: number, limit: number): number {
  return calculateProgress(used, limit);
}

/**
 * Calculate completion status based on progress percentage
 *
 * @param current - Current value
 * @param total - Total/target value
 * @returns Object with percentage and completion status
 *
 * @example
 * ```tsx
 * getCompletionStatus(3, 10);  // { percent: 30, isComplete: false, remaining: 7 }
 * getCompletionStatus(10, 10); // { percent: 100, isComplete: true, remaining: 0 }
 * ```
 */
export function getCompletionStatus(
  current: number,
  total: number
): {
  percent: number;
  isComplete: boolean;
  remaining: number;
} {
  const percent = calculateProgress(current, total);
  const remaining = Math.max(0, total - current);

  return {
    percent,
    isComplete: percent >= 100,
    remaining,
  };
}

/**
 * Format progress as a fraction string
 *
 * @param current - Current value
 * @param total - Total value
 * @returns Formatted string (e.g., "3/10")
 *
 * @example
 * ```tsx
 * formatProgressFraction(3, 10);  // "3/10"
 * ```
 */
export function formatProgressFraction(current: number, total: number): string {
  return `${current}/${total}`;
}
