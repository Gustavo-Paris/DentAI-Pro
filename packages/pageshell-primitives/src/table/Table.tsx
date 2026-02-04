/**
 * Table Primitive
 *
 * Semantic HTML table components with consistent styling.
 *
 * @module table
 */

import * as React from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Table
// =============================================================================

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));

Table.displayName = 'Table';

// =============================================================================
// Table Header
// =============================================================================

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-muted/30 [&_tr]:border-b', className)} {...props} />
));

TableHeader.displayName = 'TableHeader';

// =============================================================================
// Table Body
// =============================================================================

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));

TableBody.displayName = 'TableBody';

// =============================================================================
// Table Footer
// =============================================================================

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));

TableFooter.displayName = 'TableFooter';

// =============================================================================
// Table Row
// =============================================================================

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors',
      'hover:bg-muted/30',
      'data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
));

TableRow.displayName = 'TableRow';

// =============================================================================
// Table Head (th)
// =============================================================================

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sort direction for sortable columns */
  sortDirection?: 'ascending' | 'descending' | 'none';
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortDirection, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      aria-sort={sortDirection}
      className={cn(
        'px-4 py-3 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0',
        '[&>[role=checkbox]]:translate-y-[2px]',
        sortDirection && 'cursor-pointer select-none',
        className
      )}
      {...props}
    />
  )
);

TableHead.displayName = 'TableHead';

// =============================================================================
// Table Cell (td)
// =============================================================================

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-4 align-middle',
      '[&:has([role=checkbox])]:pr-0',
      '[&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
));

TableCell.displayName = 'TableCell';

// =============================================================================
// Table Caption
// =============================================================================

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));

TableCaption.displayName = 'TableCaption';

// =============================================================================
// Exports
// =============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

export type { TableHeadProps };
