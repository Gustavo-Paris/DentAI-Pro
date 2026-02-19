'use client';

/**
 * PageMedicationSearch - Medication search with results dropdown
 *
 * Displays a search input with a results dropdown for medications.
 * Results show medication name, active ingredient, presentation, and manufacturer.
 *
 * @example
 * ```tsx
 * <PageMedicationSearch
 *   results={[
 *     { id: '1', name: 'Amoxicillin', activeIngredient: 'Amoxicillin trihydrate', presentation: '500mg capsule', manufacturer: 'EMS' },
 *   ]}
 *   onSearch={(query) => fetchMedications(query)}
 *   onSelect={(med) => addMedication(med)}
 * />
 * ```
 */

import { useState, useRef } from 'react';

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { MedicationSearchResult } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageMedicationSearchProps {
  /** Search results to display */
  results: MedicationSearchResult[];
  /** Callback when user types in the search input */
  onSearch: (query: string) => void;
  /** Callback when a medication is selected */
  onSelect: (medication: MedicationSearchResult) => void;
  /** Whether the search is loading */
  loading?: boolean;
  /** Placeholder for the search input */
  placeholder?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageMedicationSearch({
  results,
  onSearch,
  onSelect,
  loading = false,
  placeholder = tPageShell('domain.odonto.prescriptions.medicationSearch.placeholder', 'Search medications...'),
  className,
}: PageMedicationSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(value.length > 0);
    onSearch(value);
  };

  const handleSelect = (medication: MedicationSearchResult) => {
    onSelect(medication);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
        <PageIcon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length > 0 && setOpen(true)}
          onBlur={() => {
            // Delay to allow click on results
            setTimeout(() => setOpen(false), 200);
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={tPageShell('domain.odonto.prescriptions.medicationSearch.ariaLabel', 'Search medications')}
        />
        {loading && (
          <PageIcon
            name="loader"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin"
          />
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <ul role="listbox" className="max-h-60 overflow-auto py-1">
            {results.map((med) => (
              <li
                key={med.id}
                role="option"
                aria-selected={false}
                className="cursor-pointer px-3 py-2 hover:bg-accent/10 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(med)}
              >
                <div className="text-sm font-medium">{med.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {med.activeIngredient} &middot; {med.presentation}
                  {med.manufacturer && (
                    <span> &middot; {med.manufacturer}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results */}
      {open && query.length > 0 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md p-3">
          <p className="text-sm text-muted-foreground text-center">
            {tPageShell('domain.odonto.prescriptions.medicationSearch.noResults', 'No medications found')}
          </p>
        </div>
      )}
    </div>
  );
}
