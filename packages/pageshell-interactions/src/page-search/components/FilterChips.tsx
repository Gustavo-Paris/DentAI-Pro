/**
 * FilterChips Component
 *
 * Filter chip rendering for PageSearch.
 *
 * @package @pageshell/interactions
 */

'use client';

import type { MouseEvent } from 'react';
import { X } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';
import type { PageSearchFilter } from '../types';

// =============================================================================
// Props
// =============================================================================

export interface FilterChipsProps {
  filters: PageSearchFilter[];
  activeFilters: Record<string, string>;
  onFilterChange?: (key: string, value: string | null) => void;
}

// =============================================================================
// Component
// =============================================================================

export function FilterChips({
  filters,
  activeFilters,
  onFilterChange,
}: FilterChipsProps) {
  // Active filter count
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  // Memoized handler maps for list items
  const { getHandler: getFilterToggleHandler } = useHandlerMap((key: string) => {
    const activeValue = activeFilters[key];
    if (activeValue) {
      onFilterChange?.(key, null);
    }
  });

  const { getHandler: getFilterClearHandler } = useHandlerMap(
    (key: string, e?: MouseEvent<SVGElement>) => {
      e?.stopPropagation();
      onFilterChange?.(key, null);
    }
  );

  // Clear all filters handler
  const handleClearAllFilters = () => {
    filters.forEach((f) => onFilterChange?.(f.key, null));
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {filters.map((filter) => {
        const activeValue = activeFilters[filter.key];
        const activeOption = filter.options.find((o) => o.value === activeValue);

        return (
          <div key={filter.key} className="relative group">
            <button
              type="button"
              onClick={getFilterToggleHandler(filter.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors',
                activeValue
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              <span>{filter.label}</span>
              {activeOption && (
                <>
                  <span className="text-muted-foreground">:</span>
                  <span className="font-medium">{activeOption.label}</span>
                  <X
                    className="h-3 w-3 ml-0.5 hover:text-destructive"
                    onClick={getFilterClearHandler(filter.key)}
                  />
                </>
              )}
            </button>
          </div>
        );
      })}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
