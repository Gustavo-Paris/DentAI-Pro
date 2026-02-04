/**
 * ListPage Filters (Unified)
 *
 * Search, filters, sort, and clear controls for ListPage.
 * Supports both table and cards view modes.
 *
 * @module list/components/shared/ListPageFilters
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import {
  Button,
  SearchInput,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  resolveIcon,
} from '@pageshell/primitives';
import { Filter, X } from 'lucide-react';

import type { FilterConfig } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Sort option configuration
 */
export interface SortOption {
  value: string;
  label: string;
}

/**
 * Sort configuration for filters
 */
export interface SortConfig {
  options: SortOption[];
  default?: string;
}

/**
 * Unified filter configuration
 * Supports both array (ListPage) and record (CardListPage) formats
 */
export interface UnifiedFilterConfig {
  /** Filter key */
  key: string;
  /** Display label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Filter type: select dropdown or button group */
  type?: 'select' | 'buttons';
  /** Available options */
  options: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
}

export interface ListPageFiltersProps {
  // --- Search ---
  /**
   * Search configuration
   * - true: enable with defaults
   * - object: enable with custom placeholder
   * - undefined/false: disabled
   */
  searchable?: boolean | { placeholder?: string };
  /** Current search value */
  searchValue: string;
  /** Search change callback */
  onSearchChange: (value: string) => void;

  // --- Filters ---
  /** Filter configurations */
  filters: UnifiedFilterConfig[];
  /** Current filter values */
  filterValues: Record<string, string>;
  /** Filter change callback */
  onFilterChange: (key: string, value: string) => void;

  // --- Sort (optional, mainly for cards mode) ---
  /** Sort configuration */
  sortConfig?: SortConfig;
  /** Current sort value */
  sortValue?: string;
  /** Sort change callback */
  onSortChange?: (value: string) => void;

  // --- State ---
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Clear all filters callback */
  onClearFilters: () => void;

  // --- Customization ---
  /** Show filter icon in select triggers */
  showFilterIcon?: boolean;
  /** Custom class for container */
  className?: string;
  /** Slot before filters */
  beforeFilters?: React.ReactNode;
  /** Slot after filters */
  afterFilters?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export const ListPageFilters = React.memo(function ListPageFilters({
  // Search
  searchable,
  searchValue,
  onSearchChange,
  // Filters
  filters,
  filterValues,
  onFilterChange,
  // Sort
  sortConfig,
  sortValue,
  onSortChange,
  // State
  hasActiveFilters,
  onClearFilters,
  // Customization
  showFilterIcon = false,
  className,
  beforeFilters,
  afterFilters,
}: ListPageFiltersProps) {
  // Memoized handler for button-type filter clicks
  const { getHandler: getFilterOptionHandler } = useHandlerMap(
    (key: string) => {
      const [filterKey, optionValue] = key.split('::');
      onFilterChange(filterKey!, optionValue!);
    }
  );

  // Search clear handler
  const handleSearchClear = React.useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  // Check if we have any controls to render
  const hasSearch = Boolean(searchable);
  const hasFilters = filters.length > 0;
  const hasSort = Boolean(sortConfig);

  if (!hasSearch && !hasFilters && !hasSort) {
    return null;
  }

  // Resolve search placeholder
  const searchPlaceholder =
    typeof searchable === 'object' ? searchable.placeholder : 'Search...';

  return (
    <section className={cn('space-y-3', className)}>
      {beforeFilters}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        {hasSearch && (
          <SearchInput
            value={searchValue}
            onValueChange={onSearchChange}
            onClear={handleSearchClear}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            containerClassName="flex-1"
          />
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {filters.map((filter) => {
            const currentValue = filterValues[filter.key] ?? '';
            const hasValue =
              currentValue && currentValue !== 'all' && currentValue !== '';

            // Button type filter
            if (filter.type === 'buttons') {
              return (
                <div key={filter.key} className="flex gap-2">
                  {filter.options.map((option) => (
                    <Button
                      key={option.value}
                      variant={currentValue === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={getFilterOptionHandler(
                        `${filter.key}::${option.value}`
                      )}
                      className="min-h-[44px] touch-manipulation"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              );
            }

            // Select type filter (default)
            // Find the selected option's label
            const selectedOption = filter.options.find(opt => opt.value === currentValue);
            const filterLabel = filter.label || filter.key;
            const displayLabel = hasValue && selectedOption
              ? `${filterLabel}: ${selectedOption.label}`
              : filterLabel;

            return (
              <Select
                key={filter.key}
                value={currentValue}
                onValueChange={(value) => onFilterChange(filter.key, value)}
              >
                <SelectTrigger
                  className={cn(
                    'min-h-[44px] flex items-center gap-2 px-4 py-2 text-sm',
                    'bg-muted border border-border rounded-lg text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                    'touch-manipulation transition-colors w-auto min-w-[140px]',
                    hasValue && 'border-primary/50 bg-primary/10'
                  )}
                  aria-label={filterLabel}
                >
                  {showFilterIcon && <Filter className="h-4 w-4" />}
                  <span className="truncate">{displayLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => {
                    const OptionIcon = option.icon
                      ? resolveIcon(option.icon)
                      : null;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          {OptionIcon && <OptionIcon className="h-4 w-4" />}
                          {option.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            );
          })}
        </div>

        {/* Sort Dropdown (cards mode) */}
        {hasSort && sortConfig && onSortChange && (
          <Select value={sortValue ?? sortConfig.default ?? ''} onValueChange={onSortChange}>
            <SelectTrigger
              className="min-h-[44px] min-w-[140px] touch-manipulation"
              aria-label="Sort"
            >
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {sortConfig.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="min-h-[44px] touch-manipulation text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {afterFilters}
    </section>
  );
});

ListPageFilters.displayName = 'ListPageFilters';
