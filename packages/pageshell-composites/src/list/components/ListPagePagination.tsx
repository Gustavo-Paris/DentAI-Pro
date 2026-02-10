/**
 * ListPage Pagination
 *
 * Pagination controls for ListPage composite.
 *
 * @module list/components/ListPagePagination
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap, useListLogic } from '@pageshell/core';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@pageshell/primitives';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListPageProps } from '../types';
import type { PaginationLabels, NavigationLabels } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ListPagePaginationProps {
  /** Pagination configuration */
  pagination: ListPageProps<unknown>['pagination'];
  /** Total number of items */
  total: number;
  /** List logic instance from useListLogic hook */
  listLogic: ReturnType<typeof useListLogic>;
  /** Pagination labels */
  paginationLabels?: PaginationLabels;
  /** Navigation labels */
  navigationLabels?: NavigationLabels;
}

// =============================================================================
// Component
// =============================================================================

export function ListPagePagination({
  pagination,
  total,
  listLogic,
  paginationLabels,
  navigationLabels,
}: ListPagePaginationProps) {
  const totalPages = Math.ceil(total / listLogic.pageSize);
  const currentPage = listLogic.page;
  const paginationConfig = typeof pagination === 'object' ? pagination : {};
  const showSizeChanger = paginationConfig.showSizeChanger ?? false;
  const pageSizes = paginationConfig.pageSizes ?? [10, 20, 50, 100];

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

  // Generate page numbers to show (unconditionally called per React rules)
  const pageNumbers = React.useMemo((): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Memoized handler for page number button clicks - stable reference per page number
  const { getHandler: getPageHandler } = useHandlerMap((page: number) => {
    listLogic.setPage(page);
  });

  // Memoized handlers for prev/next buttons
  const handlePreviousPage = React.useCallback(() => {
    listLogic.setPage(currentPage - 1);
  }, [listLogic, currentPage]);

  const handleNextPage = React.useCallback(() => {
    listLogic.setPage(currentPage + 1);
  }, [listLogic, currentPage]);

  // Memoized handler for page size change
  const handlePageSizeChange = React.useCallback(
    (value: string) => {
      listLogic.setPageSize(Number(value));
    },
    [listLogic]
  );

  // Early return after hooks
  if (pagination === false || total <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {labels.showing}{' '}
          <span className="font-medium">
            {Math.min((currentPage - 1) * listLogic.pageSize + 1, total)}
          </span>{' '}
          {labels.to}{' '}
          <span className="font-medium">
            {Math.min(currentPage * listLogic.pageSize, total)}
          </span>{' '}
          {labels.of} <span className="font-medium">{total}</span> {labels.items}
        </p>
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Exibir</span>
            <Select
              value={String(listLogic.pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
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
              onClick={getPageHandler(pageNum)}
              aria-current={currentPage === pageNum ? 'page' : undefined}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium touch-manipulation transition-colors',
                currentPage === pageNum
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted'
              )}
            >
              {pageNum}
            </button>
          )
        )}
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          aria-label={navLabels.nextPage}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border border-border hover:bg-muted transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

ListPagePagination.displayName = 'ListPagePagination';
