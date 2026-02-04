/**
 * CalendarPage Toolbar
 *
 * Navigation and view selection toolbar for CalendarPage.
 *
 * @module calendar/components/CalendarToolbar
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { CalendarView } from '../types';
import { MONTHS } from '../utils';
import {
  type CalendarAriaLabels,
  resolveCalendarAriaLabels,
} from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface CalendarToolbarProps {
  /** Current date */
  date: Date;
  /** Current view */
  view: CalendarView;
  /** Available views */
  views: CalendarView[];
  /** Navigate callback */
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  /** View change callback */
  onViewChange: (view: CalendarView) => void;
  /** ARIA labels for i18n */
  ariaLabels?: CalendarAriaLabels;
  /** View labels for display */
  viewLabels?: Record<CalendarView, string>;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
  agenda: 'Agenda',
};

// =============================================================================
// Component
// =============================================================================

export function CalendarToolbar({
  date,
  view,
  views,
  onNavigate,
  onViewChange,
  ariaLabels,
  viewLabels,
}: CalendarToolbarProps) {
  const resolvedAriaLabels = resolveCalendarAriaLabels(ariaLabels);
  const resolvedViewLabels = viewLabels ?? DEFAULT_VIEW_LABELS;

  // Memoized handler for navigation actions - stable reference per action type
  const { getHandler: getNavigateHandler } = useHandlerMap(
    (action: 'prev' | 'next' | 'today') => {
      onNavigate(action);
    }
  );

  // Memoized handler for view changes - stable reference per view type
  const { getHandler: getViewHandler } = useHandlerMap((v: CalendarView) => {
    onViewChange(v);
  });

  // Memoized handler for tab keyboard navigation - stable reference per view type
  const { getHandler: getKeyDownHandler } = useHandlerMap(
    (_v: CalendarView, e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = views.indexOf(view);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % views.length;
        onViewChange(views[nextIndex]!);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + views.length) % views.length;
        onViewChange(views[prevIndex]!);
      } else if (e.key === 'Home') {
        e.preventDefault();
        onViewChange(views[0]!);
      } else if (e.key === 'End') {
        e.preventDefault();
        onViewChange(views[views.length - 1]!);
      }
    }
  );

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={getNavigateHandler('prev')}
          aria-label={resolvedAriaLabels.previousPeriod}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={getNavigateHandler('next')}
          aria-label={resolvedAriaLabels.nextPeriod}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={getNavigateHandler('today')}
          aria-label={resolvedAriaLabels.goToToday}
        >
          Today
        </Button>
      </div>

      <h2 className="text-lg font-semibold">
        {MONTHS[date.getMonth()]} {date.getFullYear()}
      </h2>

      <div
        role="tablist"
        aria-label={resolvedAriaLabels.selectView}
        className="flex items-center gap-1 p-1 bg-muted rounded-lg"
      >
        {views.map((v) => (
          <button
            key={v}
            role="tab"
            id={`calendar-tab-${v}`}
            aria-selected={view === v}
            aria-controls={`calendar-tabpanel-${v}`}
            tabIndex={view === v ? 0 : -1}
            onClick={getViewHandler(v)}
            onKeyDown={getKeyDownHandler(v)}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              view === v
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {resolvedViewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

CalendarToolbar.displayName = 'CalendarToolbar';
