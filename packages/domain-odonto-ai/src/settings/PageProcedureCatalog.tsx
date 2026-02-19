'use client';

/**
 * PageProcedureCatalog - Searchable procedure catalog list
 *
 * Displays a searchable list of dental procedures with name, code,
 * category, price, duration, and active status.
 *
 * @example
 * ```tsx
 * <PageProcedureCatalog
 *   items={[
 *     {
 *       id: '1',
 *       name: 'Dental Cleaning',
 *       code: 'D1110',
 *       category: 'Preventive',
 *       price: { value: 150, currency: 'BRL' },
 *       duration: 60,
 *       active: true,
 *       createdAt: '2025-01-01',
 *       updatedAt: '2026-02-10',
 *     },
 *   ]}
 *   onSelect={(id) => console.log(id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { ProcedureCatalogItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageProcedureCatalogProps {
  /** List of procedure catalog items */
  items: ProcedureCatalogItem[];
  /** Callback when a procedure is selected */
  onSelect?: (id: string) => void;
  /** Search query for filtering */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// =============================================================================
// Component
// =============================================================================

export function PageProcedureCatalog({
  items,
  onSelect,
  searchQuery = '',
  onSearchChange,
  className,
}: PageProcedureCatalogProps) {
  const filtered = searchQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <PageIcon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          defaultValue={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={tPageShell('domain.odonto.settings.procedureCatalog.searchPlaceholder', 'Search procedures...')}
          className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tPageShell('domain.odonto.settings.procedureCatalog.searchLabel', 'Search procedures')}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={cn(
              'flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/5 cursor-pointer',
              !item.active && 'opacity-60',
            )}
            onClick={() => onSelect?.(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(item.id);
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium truncate">{item.name}</h4>
                <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PageIcon name="folder" className="w-3 h-3" />
                  {item.category}
                </span>
                <span className="flex items-center gap-1">
                  <PageIcon name="clock" className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-semibold">
                {formatPrice(item.price.value, item.price.currency)}
              </span>
              <StatusBadge
                variant={item.active ? 'accent' : 'outline'}
                label={
                  item.active
                    ? tPageShell('domain.odonto.settings.procedureCatalog.active', 'Active')
                    : tPageShell('domain.odonto.settings.procedureCatalog.inactive', 'Inactive')
                }
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {tPageShell('domain.odonto.settings.procedureCatalog.empty', 'No procedures found')}
          </p>
        )}
      </div>
    </div>
  );
}
