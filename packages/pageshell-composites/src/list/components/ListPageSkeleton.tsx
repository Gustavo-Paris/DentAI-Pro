/**
 * ListPageSkeleton Component
 *
 * Skeleton loading state that matches the exact structure of ListPage.
 * Uses same container classes, header layout, and card structure.
 *
 * @module list/components/ListPageSkeleton
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@pageshell/primitives';
import { getContainerClasses, type ContainerWrapperVariant } from '../../shared/styles';

// =============================================================================
// Types
// =============================================================================

export interface ListPageSkeletonProps {
  /** Container wrapper variant */
  containerVariant?: ContainerWrapperVariant;
  /** View mode */
  viewMode?: 'table' | 'cards';
  /** Show header section */
  showHeader?: boolean;
  /** Show label above title */
  showLabel?: boolean;
  /** Show description */
  showDescription?: boolean;
  /** Show create/header action button */
  showHeaderAction?: boolean;
  /** Show filters */
  showFilters?: boolean;
  /** Show view mode toggle */
  showViewToggle?: boolean;
  /** Show stats section */
  showStats?: boolean;
  /** Number of stats cards */
  statsCount?: number;
  /** Table columns count */
  tableColumns?: number;
  /** Table rows count */
  tableRows?: number;
  /** Cards count */
  cardsCount?: number;
  /** Grid columns for cards */
  gridColumns?: 2 | 3 | 4;
  /** Show pagination */
  showPagination?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Grid Column Classes
// =============================================================================

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Header skeleton matching ListPage header structure
 * Uses pulse animation for text elements (simpler loading state)
 */
function HeaderSkeleton({
  showLabel,
  showDescription,
  showHeaderAction,
}: {
  showLabel?: boolean;
  showDescription?: boolean;
  showHeaderAction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        {/* Text elements use pulse (default) */}
        {showLabel && <Skeleton className="h-4 w-24" />}
        <Skeleton className="h-8 w-48" />
        {showDescription && <Skeleton className="h-4 w-72" />}
      </div>
      {/* Button uses pulse (default) */}
      {showHeaderAction && <Skeleton className="h-10 w-32" />}
    </div>
  );
}

/**
 * Filters skeleton matching ListPageFilters structure
 * Uses pulse animation for filter buttons and inputs (simpler elements)
 */
function FiltersSkeleton({ showViewToggle }: { showViewToggle?: boolean }) {
  return (
    <div className="mt-4 flex items-center gap-4">
      <div className="flex-1 flex gap-3">
        {/* Search input - pulse (default) */}
        <Skeleton className="h-10 flex-1 max-w-sm" />
        {/* Filter buttons - pulse (default) */}
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
      {/* View mode toggle - pulse (default) */}
      {showViewToggle && (
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      )}
    </div>
  );
}

/**
 * Stats section skeleton matching statsSection structure
 * Uses shimmer animation for stat cards (data-heavy content)
 */
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card/50 p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            {/* Label - pulse for text */}
            <Skeleton className="h-4 w-20" />
            {/* Icon - pulse */}
            <Skeleton className="h-5 w-5" />
          </div>
          {/* Value - shimmer for data content */}
          <Skeleton animation="shimmer" className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton matching ListPageTable structure
 * Uses shimmer animation for table rows (data content)
 */
function TableSkeleton({
  columns = 4,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                {/* Header text - pulse */}
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
            {/* Actions column */}
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {/* Row data - shimmer for content */}
                  <Skeleton
                    animation="shimmer"
                    className={cn(
                      'h-4',
                      colIndex === 0 ? 'w-40' : colIndex === columns - 1 ? 'w-24' : 'w-28'
                    )}
                  />
                </TableCell>
              ))}
              {/* Actions column - pulse for button */}
              <TableCell>
                <Skeleton className="h-8 w-8 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Card skeleton matching ListPageCard structure
 * Uses shimmer for card body content (data-heavy), pulse for badges/icons
 * - Badge at top-right
 * - Avatar + Title + Subtitle in header
 * - Description + Meta in content
 * - Footer with icon + text
 */
function CardItemSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      {/* Badge skeleton (top-right) - pulse */}
      <div className="absolute top-3 right-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <CardHeader className="pb-2 pr-16">
        <div className="flex items-start gap-3">
          {/* Avatar - pulse */}
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title - shimmer for primary content */}
            <Skeleton animation="shimmer" className="h-5 w-3/4" />
            {/* Subtitle - shimmer for content */}
            <Skeleton animation="shimmer" className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3 space-y-3">
        {/* Description - shimmer for rich content */}
        <div className="space-y-1.5">
          <Skeleton animation="shimmer" className="h-3.5 w-full" />
          <Skeleton animation="shimmer" className="h-3.5 w-4/5" />
        </div>
        {/* Meta fields - shimmer for data */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton animation="shimmer" className="h-3.5 w-12" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton animation="shimmer" className="h-3.5 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        {/* Footer with icon + date - shimmer for data */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton animation="shimmer" className="h-3.5 w-20" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Compact card skeleton (for simpler cards without description)
 * Uses shimmer for content, pulse for badges/icons
 */
function CardItemCompactSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      {/* Badge skeleton (top-right) - pulse */}
      <div className="absolute top-3 right-3">
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <CardHeader className="pb-3 pr-14">
        <div className="flex items-start gap-3">
          {/* Avatar - pulse */}
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title - shimmer for content */}
            <Skeleton animation="shimmer" className="h-4 w-2/3" />
            {/* Subtitle - shimmer for content */}
            <Skeleton animation="shimmer" className="h-3.5 w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0 pb-3">
        <div className="flex items-center gap-1.5">
          {/* Icon - pulse */}
          <Skeleton className="h-3.5 w-3.5" />
          {/* Date - shimmer for data */}
          <Skeleton animation="shimmer" className="h-3.5 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Cards grid skeleton
 */
function CardsGridSkeleton({
  count = 6,
  gridColumns = 3,
  compact = false,
}: {
  count?: number;
  gridColumns?: 2 | 3 | 4;
  compact?: boolean;
}) {
  const CardComponent = compact ? CardItemCompactSkeleton : CardItemSkeleton;

  return (
    <div className={cn('grid gap-4', GRID_COLS[gridColumns])}>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

/**
 * Pagination skeleton
 * Uses pulse animation for buttons (simpler elements)
 */
function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-4">
      {/* Text info - pulse */}
      <Skeleton className="h-4 w-40" />
      {/* Pagination buttons - pulse */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ListPageSkeleton({
  containerVariant = 'shell',
  viewMode = 'table',
  showHeader = true,
  showLabel = false,
  showDescription = true,
  showHeaderAction = true,
  showFilters = true,
  showViewToggle = false,
  showStats = false,
  statsCount = 4,
  tableColumns = 4,
  tableRows = 5,
  cardsCount = 6,
  gridColumns = 3,
  showPagination = true,
  className,
}: ListPageSkeletonProps) {
  const classes = getContainerClasses(containerVariant);

  return (
    <div
      className={cn(classes.container, className)}
      aria-busy="true"
      aria-label="Loading list content"
    >
      <div className={classes.card} aria-hidden="true">
        {/* Header Section */}
        {showHeader && (
          <div className={classes.header}>
            <HeaderSkeleton
              showLabel={showLabel}
              showDescription={showDescription}
              showHeaderAction={showHeaderAction}
            />
            {showFilters && (
              <FiltersSkeleton showViewToggle={showViewToggle} />
            )}
          </div>
        )}

        {/* Content Section */}
        <div className={classes.content}>
          {/* Stats */}
          {showStats && <StatsSkeleton count={statsCount} />}

          {/* Table or Cards */}
          {viewMode === 'table' ? (
            <TableSkeleton columns={tableColumns} rows={tableRows} />
          ) : (
            <CardsGridSkeleton count={cardsCount} gridColumns={gridColumns} />
          )}

          {/* Pagination */}
          {showPagination && <PaginationSkeleton />}
        </div>
      </div>
    </div>
  );
}

ListPageSkeleton.displayName = 'ListPageSkeleton';

// =============================================================================
// Exports
// =============================================================================

export {
  HeaderSkeleton as ListPageHeaderSkeleton,
  FiltersSkeleton as ListPageFiltersSkeleton,
  StatsSkeleton as ListPageStatsSkeleton,
  TableSkeleton as ListPageTableSkeleton,
  CardItemSkeleton as ListPageCardSkeleton,
  CardItemCompactSkeleton as ListPageCardCompactSkeleton,
  CardsGridSkeleton as ListPageCardsGridSkeleton,
  PaginationSkeleton as ListPagePaginationSkeleton,
};
