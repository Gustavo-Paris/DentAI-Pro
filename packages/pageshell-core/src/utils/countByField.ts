/**
 * Count items by field value
 *
 * @param items - Array of items to count
 * @param field - Field name to count by
 * @param values - Optional: only count specific values (still returns total of all items)
 * @returns Object with counts per value and total
 *
 * @example
 * ```tsx
 * const courses = [
 *   { status: 'published' },
 *   { status: 'draft' },
 *   { status: 'published' },
 * ];
 *
 * const stats = countByField(courses, 'status');
 * // { published: 2, draft: 1, total: 3 }
 * ```
 */
export function countByField<T, K extends keyof T>(
  items: T[],
  field: K,
  values?: Array<T[K]>
): Record<string, number> & { total: number } {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const key = String(item[field]);
    if (!values || values.includes(item[field])) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return { ...counts, total: items.length } as Record<string, number> & { total: number };
}
