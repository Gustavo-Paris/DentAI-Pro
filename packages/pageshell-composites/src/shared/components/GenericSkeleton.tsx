/**
 * GenericSkeleton Component
 *
 * Unified skeleton loading state with multiple patterns.
 * Provides building blocks for list, card grid, form, and stats skeletons.
 *
 * @module shared/components/GenericSkeleton
 * @see Code Quality - Consolidation of duplicated skeleton components
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
} from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/**
 * Skeleton pattern types
 */
export type SkeletonPattern = 'list' | 'cardGrid' | 'form' | 'stats' | 'custom';

/**
 * Composite preset types for skeleton
 * These provide opinionated configurations for specific page composites
 */
export type SkeletonPreset =
  | 'detailPage'
  | 'dashboardPage'
  | 'configPage'
  | 'calendarPage'
  | 'splitPanel'
  | 'tabbedList';

/**
 * Base skeleton props
 */
interface BaseSkeletonProps {
  /** Additional CSS class */
  className?: string;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Show filters skeleton */
  showFilters?: boolean;
}

/**
 * List (table) skeleton props
 */
export interface ListSkeletonProps extends BaseSkeletonProps {
  pattern: 'list';
  /** Number of columns */
  columns?: number;
  /** Number of rows */
  rows?: number;
  /** Show pagination */
  showPagination?: boolean;
}

/**
 * Card grid skeleton props
 */
export interface CardGridSkeletonProps extends BaseSkeletonProps {
  pattern: 'cardGrid';
  /** Number of cards */
  count?: number;
  /** Grid columns */
  gridColumns?: 2 | 3 | 4;
  /** Card variant */
  cardVariant?: 'default' | 'compact' | 'detailed';
}

/**
 * Form skeleton props
 */
export interface FormSkeletonProps extends BaseSkeletonProps {
  pattern: 'form';
  /** Number of fields */
  fields?: number;
  /** Show submit button */
  showSubmit?: boolean;
}

/**
 * Stats skeleton props
 */
export interface StatsSkeletonProps extends BaseSkeletonProps {
  pattern: 'stats';
  /** Number of stat cards */
  count?: number;
}

/**
 * Custom skeleton props
 */
export interface CustomSkeletonProps extends BaseSkeletonProps {
  pattern: 'custom';
  /** Custom content */
  children: React.ReactNode;
}

export type GenericSkeletonProps =
  | ListSkeletonProps
  | CardGridSkeletonProps
  | FormSkeletonProps
  | StatsSkeletonProps
  | CustomSkeletonProps;

// =============================================================================
// Preset Props
// =============================================================================

/**
 * Detail page preset props
 */
export interface DetailPagePresetProps {
  preset: 'detailPage';
  /** Number of content sections */
  sectionCount?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Dashboard page preset props
 */
export interface DashboardPagePresetProps {
  preset: 'dashboardPage';
  /** Number of stat cards */
  statsCount?: number;
  /** Number of module cards */
  modulesCount?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Config page preset props
 */
export interface ConfigPagePresetProps {
  preset: 'configPage';
  /** Number of config sections */
  sectionCount?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Calendar page preset props
 */
export interface CalendarPagePresetProps {
  preset: 'calendarPage';
  /** Additional CSS class */
  className?: string;
}

/**
 * Split panel preset props
 */
export interface SplitPanelPresetProps {
  preset: 'splitPanel';
  /** Number of list items in left panel */
  listItemCount?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Tabbed list preset props
 */
export interface TabbedListPresetProps {
  preset: 'tabbedList';
  /** Number of tabs */
  tabCount?: number;
  /** Number of list items */
  itemCount?: number;
  /** Additional CSS class */
  className?: string;
}

export type PresetSkeletonProps =
  | DetailPagePresetProps
  | DashboardPagePresetProps
  | ConfigPagePresetProps
  | CalendarPagePresetProps
  | SplitPanelPresetProps
  | TabbedListPresetProps;

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Header skeleton with title and action button
 */
function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Filters skeleton with search and filter buttons
 */
function FiltersSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Pagination skeleton
 */
function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between pt-4">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
function TableSkeleton({
  columns = 4,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Card skeleton with avatar and content
 */
function CardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {variant === 'detailed' && (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      )}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Form field skeleton
 */
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Stat card skeleton
 */
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Section skeleton for detail/config pages
 */
function SectionSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      {/* Section title - pulse for labels */}
      <Skeleton className="h-6 w-32" />
      {/* Section content - shimmer for data */}
      <div className="space-y-2">
        <Skeleton animation="shimmer" className="h-4 w-full" />
        <Skeleton animation="shimmer" className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Module card skeleton for dashboard
 */
function ModuleCardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      {/* Module title - pulse for heading */}
      <Skeleton className="h-6 w-32 mb-4" />
      {/* Module content - shimmer for data */}
      <Skeleton animation="shimmer" className="h-24 w-full" />
    </div>
  );
}

/**
 * Tab skeleton
 */
function TabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-2 border-b border-border pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-md" />
      ))}
    </div>
  );
}

/**
 * List item skeleton for split panel
 */
function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md">
      <Skeleton className="h-8 w-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton animation="shimmer" className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Calendar grid skeleton
 */
function CalendarGridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header with navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Grid Utilities
// =============================================================================

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

// =============================================================================
// Pattern Renderers
// =============================================================================

function ListPatternSkeleton(props: ListSkeletonProps) {
  const {
    columns = 4,
    rows = 5,
    showHeader = true,
    showFilters = true,
    showPagination = true,
    className,
  } = props;

  return (
    <div className={cn('space-y-4', className)}>
      {showHeader && <HeaderSkeleton />}
      {showFilters && <FiltersSkeleton />}
      <TableSkeleton columns={columns} rows={rows} />
      {showPagination && <PaginationSkeleton />}
    </div>
  );
}

function CardGridPatternSkeleton(props: CardGridSkeletonProps) {
  const {
    count = 6,
    gridColumns = 3,
    cardVariant = 'default',
    showHeader = true,
    showFilters = true,
    className,
  } = props;

  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && <HeaderSkeleton />}
      {showFilters && <FiltersSkeleton />}
      <div className={cn('grid gap-4', GRID_COLS[gridColumns])}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} variant={cardVariant} />
        ))}
      </div>
    </div>
  );
}

function FormPatternSkeleton(props: FormSkeletonProps) {
  const {
    fields = 4,
    showHeader = true,
    showSubmit = true,
    className,
  } = props;

  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
      {showSubmit && (
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}

function StatsPatternSkeleton(props: StatsSkeletonProps) {
  const { count = 4, showHeader = false, className } = props;

  return (
    <div className={cn('space-y-4', className)}>
      {showHeader && <HeaderSkeleton />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Preset Renderers
// =============================================================================

function DetailPagePresetSkeleton({ sectionCount = 2, className }: DetailPagePresetProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading detail page"
    >
      <div className="flex items-center justify-between" aria-hidden="true">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-6" aria-hidden="true">
        {Array.from({ length: sectionCount }).map((_, i) => (
          <SectionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function DashboardPagePresetSkeleton({
  statsCount = 4,
  modulesCount = 6,
  className,
}: DashboardPagePresetProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading dashboard content"
    >
      {/* Header - pulse for text/button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" aria-hidden="true" />
        <Skeleton className="h-10 w-32" aria-hidden="true" />
      </div>

      {/* Stats cards - shimmer for data content */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-hidden="true">
        {Array.from({ length: statsCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            {/* Label - pulse */}
            <Skeleton className="h-4 w-20 mb-2" />
            {/* Value - shimmer for data */}
            <Skeleton animation="shimmer" className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Module cards - shimmer for content */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-hidden="true"
      >
        {Array.from({ length: modulesCount }).map((_, i) => (
          <ModuleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ConfigPagePresetSkeleton({ sectionCount = 3, className }: ConfigPagePresetProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading configuration"
    >
      {/* Header */}
      <div className="flex items-center justify-between" aria-hidden="true">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Config sections */}
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: sectionCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPagePresetSkeleton({ className }: CalendarPagePresetProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading calendar"
    >
      {/* Header */}
      <div className="flex items-center justify-between" aria-hidden="true">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Calendar grid */}
      <div aria-hidden="true">
        <CalendarGridSkeleton />
      </div>
    </div>
  );
}

function SplitPanelPresetSkeleton({ listItemCount = 5, className }: SplitPanelPresetProps) {
  return (
    <div
      className={cn('flex gap-6', className)}
      aria-busy="true"
      aria-label="Loading split panel"
    >
      {/* Left panel - list */}
      <div className="w-80 shrink-0 space-y-2 border-r pr-6" aria-hidden="true">
        <Skeleton className="h-10 w-full mb-4" />
        {Array.from({ length: listItemCount }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
      {/* Right panel - detail */}
      <div className="flex-1 space-y-6" aria-hidden="true">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    </div>
  );
}

function TabbedListPresetSkeleton({
  tabCount = 3,
  itemCount = 5,
  className,
}: TabbedListPresetProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading tabbed list"
    >
      {/* Header */}
      <div className="flex items-center justify-between" aria-hidden="true">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Tabs */}
      <TabsSkeleton count={tabCount} />
      {/* List content */}
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: itemCount }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export const GenericSkeleton = React.memo(function GenericSkeleton(
  props: GenericSkeletonProps
) {
  switch (props.pattern) {
    case 'list':
      return <ListPatternSkeleton {...props} />;
    case 'cardGrid':
      return <CardGridPatternSkeleton {...props} />;
    case 'form':
      return <FormPatternSkeleton {...props} />;
    case 'stats':
      return <StatsPatternSkeleton {...props} />;
    case 'custom':
      return (
        <div className={props.className}>
          {props.showHeader && <HeaderSkeleton />}
          {props.showFilters && <FiltersSkeleton />}
          {props.children}
        </div>
      );
  }
});

GenericSkeleton.displayName = 'GenericSkeleton';

/**
 * PresetSkeleton Component
 *
 * Renders skeleton loading states using composite presets.
 * Use this for quick, consistent skeletons that match specific page composites.
 *
 * @example
 * ```tsx
 * <PresetSkeleton preset="dashboardPage" statsCount={4} />
 * <PresetSkeleton preset="detailPage" sectionCount={3} />
 * ```
 */
export const PresetSkeleton = React.memo(function PresetSkeleton(
  props: PresetSkeletonProps
) {
  switch (props.preset) {
    case 'detailPage':
      return <DetailPagePresetSkeleton {...props} />;
    case 'dashboardPage':
      return <DashboardPagePresetSkeleton {...props} />;
    case 'configPage':
      return <ConfigPagePresetSkeleton {...props} />;
    case 'calendarPage':
      return <CalendarPagePresetSkeleton {...props} />;
    case 'splitPanel':
      return <SplitPanelPresetSkeleton {...props} />;
    case 'tabbedList':
      return <TabbedListPresetSkeleton {...props} />;
  }
});

PresetSkeleton.displayName = 'PresetSkeleton';

// =============================================================================
// Building Block Exports (for custom compositions)
// =============================================================================

export {
  // Core building blocks
  HeaderSkeleton,
  FiltersSkeleton,
  PaginationSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormFieldSkeleton,
  StatCardSkeleton,
  // Additional building blocks
  SectionSkeleton,
  ModuleCardSkeleton,
  TabsSkeleton,
  ListItemSkeleton,
  CalendarGridSkeleton,
};
