/**
 * ListPage Filters
 *
 * Search and filter controls for ListPage composite.
 *
 * @module list/components/ListPageFilters
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchInput,
  resolveIcon,
} from '@pageshell/primitives';
import { Filter, X } from 'lucide-react';
import type { FilterConfig, SearchLabels } from '../../shared/types';
import { DEFAULT_LIST_PAGE_LABELS } from '../../shared/types';
import { normalizeOption } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface ListPageFiltersProps {
  /** Search configuration (true for defaults, object for custom) */
  searchable?: boolean | { placeholder?: string };
  /** Current search query value */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (value: string) => void;
  /** Normalized filter configurations */
  filters: FilterConfig[];
  /** Current active filter values */
  activeFilters: Record<string, string>;
  /** Callback when a filter value changes */
  onFilterChange: (key: string, value: string) => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** i18n labels */
  labels?: {
    search?: SearchLabels;
    clearFilters?: string;
  };
}

// =============================================================================
// Component
// =============================================================================

export function ListPageFilters({
  searchable,
  searchQuery,
  onSearchChange,
  filters,
  activeFilters,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
  labels,
}: ListPageFiltersProps) {
  const searchLabels = {
    ...DEFAULT_LIST_PAGE_LABELS.search,
    ...labels?.search,
  };
  const clearFiltersLabel = labels?.clearFilters ?? 'Clear filters';

  if (!searchable && filters.length === 0) {
    return null;
  }

  // Resolve placeholder: explicit > searchable object > labels default
  const searchPlaceholder =
    typeof searchable === 'object' && searchable.placeholder
      ? searchable.placeholder
      : searchLabels.placeholder;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      {/* Search Input */}
      {searchable && (
        <SearchInput
          value={searchQuery}
          onValueChange={onSearchChange}
          placeholder={searchPlaceholder}
          containerClassName="flex-1"
        />
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {filters.map((filter) => {
          const options = filter.options.map(normalizeOption);
          const currentValue = activeFilters[filter.key] || '';
          const hasValue =
            currentValue &&
            currentValue !== 'all' &&
            currentValue !== '';

          // Find selected option label and compose display text
          const selectedOption = options.find(opt => opt.value === currentValue);
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
                  'min-h-[44px] flex items-center gap-2 px-4 py-2 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary touch-manipulation transition-colors w-auto min-w-[140px]',
                  hasValue && 'border-primary/50 bg-primary/10'
                )}
                aria-label={filterLabel}
              >
                <Filter className="h-4 w-4" />
                <span className="truncate">{displayLabel}</span>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => {
                  const OptionIcon = resolveIcon(option.icon);
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

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground text-sm touch-manipulation hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
          {clearFiltersLabel}
        </button>
      )}
    </div>
  );
}

ListPageFilters.displayName = 'ListPageFilters';
