/**
 * Common utilities for PageShell composites
 *
 * @module shared/utils/common
 */

/**
 * Re-export cn from @pageshell/core
 * @see ADR: Code Quality - cn() consolidation
 */
export { cn } from '@pageshell/core';

// =============================================================================
// Data Extractors (Shared)
// =============================================================================

/**
 * Extract array from common query response shapes
 *
 * Handles: direct array, { items }, { data }, { rows }
 *
 * @example
 * // Direct array
 * extractArrayFromData([1, 2, 3]) // → [1, 2, 3]
 *
 * // Paginated response
 * extractArrayFromData({ items: [{id: 1}], total: 10 }) // → [{id: 1}]
 *
 * @see Code Quality - Consolidation of duplicated data extractors
 */
export function extractArrayFromData<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.items)) return d.items as T[];
    if (Array.isArray(d.data)) return d.data as T[];
    if (Array.isArray(d.rows)) return d.rows as T[];
  }
  return [];
}

/**
 * Extract total count from common query response shapes
 *
 * Handles: { total }, { totalCount }, { count }
 *
 * @param data - Query response data
 * @param fallback - Fallback value if total not found (usually array length)
 */
export function extractTotalFromData(data: unknown, fallback: number): number {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.total === 'number') return d.total;
    if (typeof d.totalCount === 'number') return d.totalCount;
    if (typeof d.count === 'number') return d.count;
  }
  return fallback;
}

/**
 * Default key extractor from item
 * Handles objects with 'id' property or falls back to String conversion
 */
export function defaultKeyExtractor<T>(item: T): string {
  if (item && typeof item === 'object' && 'id' in item) {
    return String((item as Record<string, unknown>).id);
  }
  return String(item);
}
