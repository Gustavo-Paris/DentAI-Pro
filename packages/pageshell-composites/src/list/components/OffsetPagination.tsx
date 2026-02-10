/**
 * OffsetPagination Component
 *
 * Pagination component for external state management.
 * Shows page numbers, prev/next buttons, and item count summary.
 *
 * @module list/components/OffsetPagination
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OffsetPaginationConfig, PaginationLabels, NavigationLabels } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface OffsetPaginationProps {
  config: OffsetPaginationConfig;
  paginationLabels?: PaginationLabels;
  navigationLabels?: NavigationLabels;
}

// =============================================================================
// Component
// =============================================================================

export function OffsetPagination({
  config,
  paginationLabels,
  navigationLabels,
}: OffsetPaginationProps) {
  const { page, pageSize, total, onPageChange } = config;

  // Use defaults if labels not provided
  const labels = {
    showing: paginationLabels?.showing ?? 'Mostrando',
    to: paginationLabels?.to ?? 'a',
    of: paginationLabels?.of ?? 'de',
    items: paginationLabels?.items ?? 'itens',
  };
  const navLabels = {
    previousPage: navigationLabels?.previousPage ?? 'Página anterior',
    nextPage: navigationLabels?.nextPage ?? 'Próxima página',
  };
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-4">
      <p className="text-sm text-muted-foreground">
        {labels.showing}{' '}
        <span className="font-medium">
          {Math.min((page - 1) * pageSize + 1, total)}
        </span>{' '}
        {labels.to}{' '}
        <span className="font-medium">
          {Math.min(page * pageSize, total)}
        </span>{' '}
        {labels.of} <span className="font-medium">{total}</span> {labels.items}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          aria-label={navLabels.previousPage}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border border-border hover:bg-muted transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        {pageNumbers.map((pageNum, idx) =>
          pageNum === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-current={page === pageNum ? 'page' : undefined}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium touch-manipulation transition-colors',
                page === pageNum
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted'
              )}
            >
              {pageNum}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label={navLabels.nextPage}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border border-border hover:bg-muted transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

OffsetPagination.displayName = 'OffsetPagination';
