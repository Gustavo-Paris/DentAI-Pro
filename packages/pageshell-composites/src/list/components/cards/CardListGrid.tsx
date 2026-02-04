/**
 * CardListPage Grid
 *
 * Grid layout for rendering cards with configurable columns.
 *
 * @module card-list/components/CardListGrid
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface CardListGridProps<TItem> {
  /** Items to render */
  items: TItem[];
  /** Grid CSS class */
  gridClassName: string;
  /** Key extractor function */
  keyExtractor: (item: TItem) => string;
  /**
   * Card render function
   * Should return the complete card element including any wrappers (links, actions)
   */
  renderCard: (item: TItem, index: number) => React.ReactNode;
  /** Additional className */
  className?: string;
  /** Test ID for e2e testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * CardListGrid renders items in a responsive grid layout.
 *
 * This component is a simple, focused grid renderer. Action handling,
 * link wrapping, and other card decorations should be handled by the
 * renderCard function passed from the parent.
 *
 * @example
 * ```tsx
 * <CardListGrid
 *   items={courses}
 *   gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
 *   keyExtractor={(item) => item.id}
 *   renderCard={(item, index) => <CourseCard course={item} />}
 * />
 * ```
 */
function CardListGridInner<TItem>(
  {
    items,
    gridClassName,
    keyExtractor,
    renderCard,
    className,
    testId,
  }: CardListGridProps<TItem>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  if (items.length === 0) return null;

  return (
    <div ref={ref} className={cn(gridClassName, className)} data-testid={testId}>
      {items.map((item, index) => (
        // min-w-0 prevents grid items from overflowing their cell on mobile
        <div key={keyExtractor(item)} className="min-w-0">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Memoized Export
// =============================================================================

/**
 * Memoized CardListGrid component for optimal performance.
 *
 * Uses React.memo to prevent unnecessary re-renders when props haven't changed.
 */
export const CardListGrid = React.memo(
  React.forwardRef(CardListGridInner)
) as <TItem>(
  props: CardListGridProps<TItem> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null;

(CardListGrid as React.FC).displayName = 'CardListGrid';
