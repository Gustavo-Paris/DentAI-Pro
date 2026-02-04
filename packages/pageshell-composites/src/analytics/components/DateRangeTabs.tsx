/**
 * AnalyticsPage Date Range Tabs
 *
 * Date range selector tabs component for AnalyticsPage.
 *
 * @module analytics/components/DateRangeTabs
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import type { AnalyticsDateRange } from '../types';
import {
  type AnalyticsAriaLabels,
  resolveAnalyticsAriaLabels,
} from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface DateRangeTabsProps {
  /** Available date ranges */
  ranges: AnalyticsDateRange[];
  /** Currently active range ID */
  activeRange: string;
  /** Callback when range changes */
  onChange: (rangeId: string) => void;
  /** ARIA labels for i18n */
  ariaLabels?: AnalyticsAriaLabels;
}

// =============================================================================
// Component
// =============================================================================

export const DateRangeTabs = React.memo(function DateRangeTabs({
  ranges,
  activeRange,
  onChange,
  ariaLabels,
}: DateRangeTabsProps) {
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const resolvedAriaLabels = resolveAnalyticsAriaLabels(ariaLabels);

  // Memoized handler for range selection - stable reference per rangeId
  const { getHandler: getRangeHandler } = useHandlerMap((rangeId: string) => {
    onChange(rangeId);
  });

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = ranges.findIndex((r) => r.id === activeRange);
      const lastIndex = ranges.length - 1;
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex < lastIndex ? currentIndex + 1 : 0;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : lastIndex;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = lastIndex;
          break;
      }

      if (nextIndex !== null) {
        const nextRangeId = ranges[nextIndex]!.id;
        onChange(nextRangeId);
        // Move focus to the new tab per WAI-ARIA Tabs pattern
        tabRefs.current.get(nextRangeId)?.focus();
      }
    },
    [ranges, activeRange, onChange]
  );

  return (
    <div
      className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg"
      role="tablist"
      aria-label={resolvedAriaLabels.selectPeriod}
    >
      {ranges.map((range) => (
        <button
          ref={(el) => {
            if (el) tabRefs.current.set(range.id, el);
            else tabRefs.current.delete(range.id);
          }}
          key={range.id}
          role="tab"
          aria-selected={activeRange === range.id}
          tabIndex={activeRange === range.id ? 0 : -1}
          onClick={getRangeHandler(range.id)}
          onKeyDown={handleKeyDown}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeRange === range.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
});

DateRangeTabs.displayName = 'DateRangeTabs';
