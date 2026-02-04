'use client';

/**
 * PageFilters Component
 *
 * Search and filter controls for list pages.
 * Supports search input, multiple filter dropdowns, and sorting.
 * Uses button-style dropdowns matching design system demo.
 *
 * @example Basic search
 * <PageFilters
 *   search={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Buscar cursos..."
 * />
 *
 * @example With filters
 * <PageFilters
 *   search={search}
 *   onSearchChange={setSearch}
 *   filters={[
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       value: status,
 *       onChange: setStatus,
 *       options: [
 *         { value: 'all', label: 'All' },
 *         { value: 'active', label: 'Active' },
 *         { value: 'draft', label: 'Draft' },
 *       ]
 *     }
 *   ]}
 * />
 *
 * @example With sorting
 * <PageFilters
 *   search={search}
 *   onSearchChange={setSearch}
 *   sort={{
 *     sortBy: 'createdAt',
 *     sortOrder: 'desc',
 *     options: [
 *       { value: 'createdAt', label: 'Data de criacao' },
 *       { value: 'name', label: 'Nome' },
 *     ],
 *     onSortByChange: setSortBy,
 *     onSortOrderToggle: () => setSortOrder(o => o === 'asc' ? 'desc' : 'asc'),
 *   }}
 * />
 */

import * as React from 'react';
import { useCallback } from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';
import {
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/** Filter option */
export interface PageFilterOption {
  value: string;
  label: string;
}

/** Filter configuration */
export interface PageFilterConfig {
  key: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: PageFilterOption[];
}

/** Sort configuration */
export interface PageSortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  options: PageFilterOption[];
  onSortByChange: (value: string) => void;
  onSortOrderToggle?: () => void;
}

/** PageFilters props */
export interface PageFiltersProps {
  /** Current search value */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Filter configurations */
  filters?: PageFilterConfig[];
  /** Sort configuration */
  sort?: PageSortConfig;
  /** Is currently searching */
  isSearching?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID */
  testId?: string;
  /** Accessible label */
  ariaLabel?: string;
}

// =============================================================================
// PageFilters Component
// =============================================================================

/**
 * PageFilters - Search and filter controls for list pages
 *
 * Supports ref forwarding for integration with animation libraries and focus management.
 */
export const PageFilters = React.forwardRef<HTMLDivElement, PageFiltersProps>(
  function PageFilters(
    {
      search,
      onSearchChange,
      searchPlaceholder = 'Buscar...',
      filters,
      sort,
      isSearching = false,
      className,
      testId,
      ariaLabel,
    },
    ref
  ) {
    // Try to get context, but don't fail if not available
    let config;
    try {
      const context = usePageShellContext();
      config = context.config;
    } catch {
      config = { animate: '' };
    }

    return (
      <div
        ref={ref}
        role="search"
        aria-label={ariaLabel || 'Filters and search'}
        aria-busy={isSearching}
        data-testid={testId}
        className={cn(config.animate, 'space-y-4', className)}
      >
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <SearchInput
          value={search}
          onValueChange={onSearchChange}
          placeholder={searchPlaceholder}
          aria-label="Search field"
          containerClassName="flex-1"
        />

        {/* Filter Buttons */}
        {(filters?.length || sort) && (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {filters?.map((filter) => {
              const hasValue = filter.value && filter.value !== 'all';
              const selectedOption = filter.options.find(o => o.value === filter.value);

              return (
                <Select
                  key={filter.key}
                  value={filter.value}
                  onValueChange={filter.onChange}
                >
                  <SelectTrigger
                    className={cn(
                      'min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm touch-manipulation hover:bg-muted transition-colors w-auto',
                      hasValue && 'border-primary/50 bg-primary/5'
                    )}
                    aria-label={`Filter by ${filter.key}`}
                  >
                    <Filter className="h-4 w-4 shrink-0" />
                    <SelectValue>
                      {selectedOption?.label || filter.options[0]?.label || filter.key}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}

            {sort && (
              <Select
                value={sort.sortBy}
                onValueChange={sort.onSortByChange}
              >
                <SelectTrigger
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm touch-manipulation hover:bg-muted transition-colors w-auto"
                  aria-label="Sort by"
                >
                  <ArrowUpDown className="h-4 w-4 shrink-0" />
                  <SelectValue>
                    {sort.options.find(o => o.value === sort.sortBy)?.label || 'Ordenar'}
                  </SelectValue>
                  <span className="text-xs text-muted-foreground">
                    {sort.sortOrder === 'asc' ? '\u2191' : '\u2193'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {sort.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        </div>
      </div>
    );
  }
);

PageFilters.displayName = 'PageFilters';
