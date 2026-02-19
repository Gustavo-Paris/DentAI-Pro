'use client';

/**
 * PagePatientList - Filterable patient list
 *
 * Displays a searchable and filterable list of patients using PagePatientCard.
 * Supports search by name, filter by status, onSelect callback, and empty state.
 *
 * @example
 * ```tsx
 * <PagePatientList
 *   patients={[
 *     { id: '1', name: 'Maria Silva', status: 'active', birthDate: '1990-01-15', createdAt: '2025-01-01', updatedAt: '2026-02-10' },
 *     { id: '2', name: 'João Santos', status: 'inactive', birthDate: '1985-06-20', createdAt: '2025-01-01', updatedAt: '2026-02-10' },
 *   ]}
 *   onSelect={(id) => console.log('Selected:', id)}
 * />
 * ```
 */

import { useState } from 'react';

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import { PagePatientCard } from './PagePatientCard';
import type { PatientInfo } from './types';
import type { PatientStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PagePatientListProps {
  /** Patient data array */
  patients: PatientInfo[];
  /** Callback when a patient is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
  /** Override search placeholder */
  searchPlaceholder?: string;
  /** Override empty state label */
  emptyLabel?: string;
  /** Override no results label */
  noResultsLabel?: string;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_FILTERS: Array<{ value: PatientStatus | 'all'; label: string }> = [
  { value: 'all', label: tPageShell('domain.odonto.patients.list.filterAll', 'All') },
  { value: 'active', label: tPageShell('domain.odonto.patients.list.filterActive', 'Active') },
  { value: 'inactive', label: tPageShell('domain.odonto.patients.list.filterInactive', 'Inactive') },
  { value: 'archived', label: tPageShell('domain.odonto.patients.list.filterArchived', 'Archived') },
];

// =============================================================================
// Component
// =============================================================================

export function PagePatientList({
  patients,
  onSelect,
  className,
  searchPlaceholder = tPageShell('domain.odonto.patients.list.searchPlaceholder', 'Search patients...'),
  emptyLabel = tPageShell('domain.odonto.patients.list.empty', 'No patients found'),
  noResultsLabel = tPageShell('domain.odonto.patients.list.noResults', 'No patients match your search'),
}: PagePatientListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isEmpty = patients.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <PageIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isEmpty && (
        <div className="text-center py-12">
          <PageIcon name="users" className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </div>
      )}

      {noResults && (
        <div className="text-center py-12">
          <PageIcon name="search" className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{noResultsLabel}</p>
        </div>
      )}

      {!isEmpty && !noResults && (
        <div className="space-y-2">
          {filtered.map((patient, index) => (
            <PagePatientCard
              key={patient.id}
              patient={patient}
              onSelect={onSelect}
              animationDelay={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
