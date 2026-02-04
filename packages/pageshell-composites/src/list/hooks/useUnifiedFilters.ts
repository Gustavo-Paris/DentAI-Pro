/**
 * useUnifiedFilters Hook
 *
 * Transforms unified filter configuration to mode-specific formats.
 * Part of the ListPage Unified API.
 *
 * @module list/hooks/useUnifiedFilters
 */

import { useMemo } from 'react';
import type { FilterConfig, CardFilterRenderMode } from '../../shared/types';
import type { CardFilterConfig, CardFilterOption } from '../types';
import type { ResolvedViewMode } from './useViewMode';

// =============================================================================
// Types
// =============================================================================

export interface UseUnifiedFiltersOptions {
  /** Unified filters configuration */
  filters?: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>;
  /** Legacy card filters (for backwards compatibility) */
  cardFilters?: Record<string, CardFilterConfig>;
  /** Current view mode */
  viewMode: ResolvedViewMode;
}

export interface UseUnifiedFiltersResult {
  /** Normalized filters array for table mode */
  tableFilters: FilterConfig[];
  /** Card filters config for card mode */
  cardFilters: Record<string, CardFilterConfig>;
  /** Whether unified filters are being used (vs legacy) */
  isUnified: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Threshold for smart default: use buttons if options <= this count */
const BUTTON_THRESHOLD = 4;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Normalize filters to array format
 */
function normalizeFiltersToArray(
  filters: FilterConfig[] | Record<string, Omit<FilterConfig, 'key'>>
): FilterConfig[] {
  if (Array.isArray(filters)) {
    return filters;
  }

  return Object.entries(filters).map(([key, config]) => ({
    key,
    ...config,
  }));
}

/**
 * Resolve default value (unified 'default' takes precedence over 'defaultValue')
 */
function resolveDefaultValue(filter: FilterConfig): string | undefined {
  return filter.default ?? filter.defaultValue;
}

/**
 * Determine card render mode using smart defaults
 */
function getCardRenderMode(filter: FilterConfig): CardFilterRenderMode {
  // Explicit override wins
  if (filter.cardRenderAs) {
    return filter.cardRenderAs;
  }

  // Smart default: buttons for ≤4 options, select for >4
  const optionCount = filter.options.length;
  return optionCount <= BUTTON_THRESHOLD ? 'buttons' : 'select';
}

/**
 * Convert FilterOption to CardFilterOption
 * Note: CardFilterOption doesn't support icon, so we only copy value/label
 */
function toCardFilterOption(option: string | { value: string; label: string; icon?: unknown }): CardFilterOption {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return {
    value: option.value,
    label: option.label,
  };
}

/**
 * Transform unified filter to card filter format
 */
function toCardFilter(filter: FilterConfig): CardFilterConfig {
  return {
    type: getCardRenderMode(filter),
    options: filter.options.map(toCardFilterOption),
    default: resolveDefaultValue(filter),
    label: filter.label,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to transform unified filters to mode-specific formats.
 *
 * @example
 * ```tsx
 * const { tableFilters, cardFilters } = useUnifiedFilters({
 *   filters: {
 *     status: {
 *       label: 'Status',
 *       options: [
 *         { value: 'all', label: 'All' },
 *         { value: 'active', label: 'Active' },
 *       ],
 *       default: 'all',
 *     },
 *   },
 *   viewMode: 'cards',
 * });
 * ```
 */
export function useUnifiedFilters(
  options: UseUnifiedFiltersOptions
): UseUnifiedFiltersResult {
  const { filters, cardFilters: legacyCardFilters, viewMode } = options;

  return useMemo(() => {
    // If no filters provided, use legacy cardFilters only
    if (!filters) {
      return {
        tableFilters: [],
        cardFilters: legacyCardFilters || {},
        isUnified: false,
      };
    }

    // Normalize filters to array
    const normalizedFilters = normalizeFiltersToArray(filters);

    // Filter based on showIn property
    const tableFilters = normalizedFilters.filter(
      (f) => !f.showIn || f.showIn === 'both' || f.showIn === 'table'
    );

    const cardVisibleFilters = normalizedFilters.filter(
      (f) => !f.showIn || f.showIn === 'both' || f.showIn === 'card'
    );

    // Resolve default values for table filters
    const resolvedTableFilters: FilterConfig[] = tableFilters.map((f) => ({
      ...f,
      defaultValue: resolveDefaultValue(f),
    }));

    // Convert to card filters format
    const cardFilters: Record<string, CardFilterConfig> = {};
    for (const filter of cardVisibleFilters) {
      cardFilters[filter.key] = toCardFilter(filter);
    }

    // If legacy cardFilters are provided alongside unified filters,
    // merge them (legacy takes precedence for explicit overrides)
    if (legacyCardFilters) {
      Object.assign(cardFilters, legacyCardFilters);
    }

    return {
      tableFilters: resolvedTableFilters,
      cardFilters,
      isUnified: true,
    };
  }, [filters, legacyCardFilters, viewMode]);
}

export default useUnifiedFilters;
