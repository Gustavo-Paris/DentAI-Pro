'use client';

/**
 * SimplePagination - Standalone Pagination Component
 *
 * A flexible pagination component that works without PageShellContext.
 * Supports two display modes: showing item counts or just page numbers.
 *
 * @example Basic usage (page numbers only)
 * ```tsx
 * <SimplePagination
 *   page={1}
 *   totalPages={10}
 *   onPrevPage={() => setPage(p => p - 1)}
 *   onNextPage={() => setPage(p => p + 1)}
 * />
 * ```
 *
 * @example With item counts
 * ```tsx
 * <SimplePagination
 *   page={1}
 *   pageSize={10}
 *   total={95}
 *   totalPages={10}
 *   onPrevPage={() => setPage(p => p - 1)}
 *   onNextPage={() => setPage(p => p + 1)}
 *   variant="counts"
 * />
 * ```
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@pageshell/primitives';
import { cn } from '@pageshell/core';

/** Labels for internationalization */
export interface SimplePaginationLabels {
  /** "Showing" text for variant="counts" */
  showingText?: string;
  /** "to" connector for variant="counts" */
  toText?: string;
  /** "of" connector (both variants) */
  ofText?: string;
  /** "Page" text for variant="pages" */
  pageText?: string;
  /** Previous button text (desktop) */
  previous?: string;
  /** Previous button text (mobile) */
  previousShort?: string;
  /** Next button text (desktop) */
  next?: string;
  /** Next button text (mobile) */
  nextShort?: string;
}

/** Default labels (Portuguese) - defined outside component to avoid recreation */
const DEFAULT_LABELS: Required<SimplePaginationLabels> = {
  showingText: 'Mostrando',
  ofText: 'de',
  toText: 'a',
  pageText: 'Página',
  previous: 'Anterior',
  previousShort: 'Ant',
  next: 'Próxima',
  nextShort: 'Próx',
};

export interface SimplePaginationProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page (required if variant is 'counts') */
  pageSize?: number;
  /** Total number of items (required if variant is 'counts') */
  total?: number;
  /** Whether there is a next page (defaults to page < totalPages) */
  hasNextPage?: boolean;
  /** Go to previous page */
  onPrevPage: () => void;
  /** Go to next page */
  onNextPage: () => void;
  /** Display variant: 'counts' shows "Mostrando X a Y de Z", 'pages' shows "Pagina X de Y" */
  variant?: 'counts' | 'pages';
  /** Show divider line above with spacing */
  divider?: boolean;
  /** Loading/fetching state to disable buttons */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Label texts for i18n support */
  labels?: SimplePaginationLabels;
}

export function SimplePagination({
  page,
  totalPages,
  pageSize,
  total,
  hasNextPage,
  onPrevPage,
  onNextPage,
  variant = 'pages',
  divider = false,
  isLoading = false,
  className,
  labels,
}: SimplePaginationProps) {
  // Merge with provided labels
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  // Don't render if only 1 page and not showing counts
  if (totalPages <= 1 && variant !== 'counts') return null;
  if (total === 0) return null;

  const hasPrevPage = page > 1;
  const hasNext = hasNextPage ?? page < totalPages;

  // Calculate start/end for counts display
  const start = variant === 'counts' && pageSize && total
    ? Math.min((page - 1) * pageSize + 1, total)
    : 0;
  const end = variant === 'counts' && pageSize && total
    ? Math.min(page * pageSize, total)
    : 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        divider && 'mt-6 pt-6 border-t border-border',
        className
      )}
    >
      {/* Info text - centered on mobile */}
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        {variant === 'counts' && pageSize && total ? (
          <>
            {mergedLabels.showingText}{' '}
            <span className="font-medium text-foreground">{start}</span> {mergedLabels.toText}{' '}
            <span className="font-medium text-foreground">{end}</span> {mergedLabels.ofText}{' '}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            {mergedLabels.pageText}{' '}
            <span className="font-medium text-foreground" aria-current="page">{page}</span> {mergedLabels.ofText}{' '}
            <span className="font-medium text-foreground">{totalPages}</span>
          </>
        )}
      </div>

      {/* Navigation buttons - full width on mobile */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage || isLoading}
          aria-label="Go to previous page"
          className="flex-1 sm:flex-none"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          <span className="hidden xs:inline">{mergedLabels.previous}</span>
          <span className="xs:hidden">{mergedLabels.previousShort}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNext || isLoading}
          aria-label="Go to next page"
          className="flex-1 sm:flex-none"
        >
          <span className="hidden xs:inline">{mergedLabels.next}</span>
          <span className="xs:hidden">{mergedLabels.nextShort}</span>
          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
