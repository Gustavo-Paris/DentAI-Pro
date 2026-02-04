/**
 * Search and Filter Utilities
 *
 * Pure utility functions for client-side search and filtering.
 * Used by useListLogic and can be reused in other contexts.
 *
 * @module utils/searchUtils
 */

import type { ListFilterConfig } from '../hooks/list';

// =============================================================================
// String Normalization
// =============================================================================

/**
 * Normalize string for search comparison.
 * Lowercases, removes diacritics, and trims whitespace.
 *
 * @example
 * normalizeString("Café") // "cafe"
 * normalizeString("  São Paulo  ") // "sao paulo"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

// =============================================================================
// Search Matching
// =============================================================================

/**
 * Check if item matches search query across specified fields.
 * Supports dot notation for nested fields.
 *
 * @example
 * matchesSearch(user, "john", ["name", "email"]) // true if name or email contains "john"
 * matchesSearch(order, "acme", ["customer.name"]) // supports nested fields
 */
export function matchesSearch<TItem>(
  item: TItem,
  query: string,
  fields: string[]
): boolean {
  if (!query) return true;

  const normalizedQuery = normalizeString(query);
  const itemObj = item as Record<string, unknown>;

  return fields.some((field) => {
    // Support dot notation for nested fields
    const value = field.includes('.')
      ? field.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], item)
      : itemObj[field];
    if (value === null || value === undefined) return false;

    const stringValue = String(value);
    return normalizeString(stringValue).includes(normalizedQuery);
  });
}

// =============================================================================
// Filter Matching
// =============================================================================

/**
 * Check if item matches all active filters.
 * Treats "all" and empty string as "match everything".
 *
 * @example
 * matchesFilters(user, { role: "admin" }) // true if user.role === "admin"
 * matchesFilters(user, { role: "all" }) // always true (no filter)
 */
export function matchesFilters<TItem>(
  item: TItem,
  filterValues: Record<string, string>
): boolean {
  return Object.entries(filterValues).every(([key, value]) => {
    if (value === 'all' || value === '') return true;

    const itemValue = (item as Record<string, unknown>)[key];
    return String(itemValue) === value;
  });
}

// =============================================================================
// Filter Defaults
// =============================================================================

/**
 * Get default filter values from filter configuration.
 * Falls back to "all" if no default is specified.
 *
 * @example
 * getDefaultFilters({ role: { options: ["all", "admin"], defaultValue: "admin" } })
 * // { role: "admin" }
 */
export function getDefaultFilters(
  filters?: Record<string, ListFilterConfig>
): Record<string, string> {
  if (!filters) return {};

  return Object.entries(filters).reduce<Record<string, string>>(
    (acc, [key, config]) => {
      acc[key] = config.defaultValue ?? 'all';
      return acc;
    },
    {}
  );
}
