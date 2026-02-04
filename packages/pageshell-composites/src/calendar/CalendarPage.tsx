/**
 * CalendarPage Composite
 *
 * Calendar/scheduling page with month, week, day, and agenda views.
 * Framework-agnostic implementation with built-in simple views.
 *
 * @module calendar/CalendarPage
 *
 * @example Basic usage with query
 * ```tsx
 * import { CalendarPage } from '@pageshell/composites/calendar';
 *
 * interface Meeting {
 *   id: string;
 *   title: string;
 *   startTime: Date;
 *   endTime: Date;
 *   type: 'meeting' | 'workshop' | 'webinar';
 * }
 *
 * function MeetingsCalendar() {
 *   const query = api.meetings.list.useQuery();
 *
 *   return (
 *     <CalendarPage<Meeting>
 *       title="Meetings"
 *       description="View and manage your scheduled meetings"
 *       icon="calendar"
 *       query={query}
 *       getEvents={(data) => data.meetings}
 *       getEventStart={(event) => event.startTime}
 *       getEventEnd={(event) => event.endTime}
 *       getEventTitle={(event) => event.title}
 *       getEventStyle={(event) => {
 *         const styles = { meeting: 'violet', workshop: 'emerald', webinar: 'blue' };
 *         return styles[event.type] ?? 'default';
 *       }}
 *       views={['month', 'week', 'agenda']}
 *       defaultView="month"
 *       onEventClick={(event) => router.push(`/meetings/${event.id}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @example Direct events array
 * ```tsx
 * <CalendarPage<Event>
 *   title="Schedule"
 *   events={myEvents}
 *   getEventStart={(e) => e.start}
 *   getEventEnd={(e) => e.end}
 *   getEventTitle={(e) => e.name}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';

import type { CalendarPageProps, CalendarView } from './types';
import { calendarPageDefaults } from './defaults';
import { getContainerClasses } from '../shared/styles';
import {
  CalendarSkeleton,
  CalendarErrorState,
  CalendarToolbar,
  CalendarMonthView,
  CalendarAgendaView,
} from './components';


// =============================================================================
// CalendarPage Component
// =============================================================================

export function CalendarPage<TEvent, TData = unknown>(
  props: CalendarPageProps<TEvent, TData>
) {
  const {
    // Base
    theme = calendarPageDefaults.theme,
    containerVariant = calendarPageDefaults.containerVariant,
    title,
    description,
    icon,
    className,
    // Data
    query,
    events: directEvents,
    getEvents,
    // Event mapping
    getEventStart,
    getEventEnd,
    getEventTitle,
    getEventStyle,
    // Views
    views = ['month', 'week', 'day', 'agenda'],
    defaultView = 'month',
    view: controlledView,
    onViewChange,
    // Date navigation
    defaultDate,
    date: controlledDate,
    onNavigate,
    // Interactions
    onEventClick,
    onSlotSelect,
    selectable,
    // Settings
    minHeight = '500px',
    firstDayOfWeek = 0,
    // Slots
    slots,
    // Skeleton
    skeleton,
  } = props;

  // Resolve icon
  const Icon = resolveIcon(icon);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [internalView, setInternalView] = React.useState<CalendarView>(defaultView);
  const [internalDate, setInternalDate] = React.useState<Date>(
    defaultDate || new Date()
  );

  const view = controlledView ?? internalView;
  const date = controlledDate ?? internalDate;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleViewChange = React.useCallback(
    (newView: CalendarView) => {
      setInternalView(newView);
      onViewChange?.(newView);
    },
    [onViewChange]
  );

  const handleNavigate = React.useCallback(
    (action: 'prev' | 'next' | 'today') => {
      let newDate: Date;
      switch (action) {
        case 'today':
          newDate = new Date();
          break;
        case 'prev':
          newDate = new Date(date);
          if (view === 'month') {
            newDate.setMonth(date.getMonth() - 1);
          } else if (view === 'week') {
            newDate.setDate(date.getDate() - 7);
          } else {
            newDate.setDate(date.getDate() - 1);
          }
          break;
        case 'next':
          newDate = new Date(date);
          if (view === 'month') {
            newDate.setMonth(date.getMonth() + 1);
          } else if (view === 'week') {
            newDate.setDate(date.getDate() + 7);
          } else {
            newDate.setDate(date.getDate() + 1);
          }
          break;
      }
      setInternalDate(newDate);
      onNavigate?.(newDate);
    },
    [date, view, onNavigate]
  );

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  const events = React.useMemo(() => {
    if (directEvents) return directEvents;
    if (query?.data && getEvents) return getEvents(query.data);
    return [];
  }, [directEvents, query?.data, getEvents]);

  // Memoize events by day for O(1) lookup
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, TEvent[]>();

    for (const event of events) {
      const start = new Date(getEventStart(event));
      const end = new Date(getEventEnd(event));

      // Normalize to date strings for map keys
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(0, 0, 0, 0);

      // Add event to each day it spans
      const current = new Date(startDate);
      while (current <= endDate) {
        const key = current.toISOString().split('T')[0]!;
        const existing = map.get(key) ?? [];
        existing.push(event);
        map.set(key, existing);
        current.setDate(current.getDate() + 1);
      }
    }

    return map;
  }, [events, getEventStart, getEventEnd]);

  // ---------------------------------------------------------------------------
  // Container Classes
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant);
  const containerClassesStatic = containerVariant === 'shell' ? '' : 'max-w-7xl mx-auto';
  const cardContainerClassesStatic = containerVariant === 'shell' ? '' : 'bg-card rounded-xl border border-border overflow-hidden';
  const headerSectionClassesStatic = classes.header || 'p-4 sm:p-6 border-b border-border bg-muted/30';
  const contentSectionClassesStatic = containerVariant === 'shell' ? 'space-y-6' : 'p-4 sm:p-6';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query?.isLoading) {
    return (
      <div
        className={cn(containerClassesStatic, className)}
        data-theme={theme}
        aria-busy="true"
        aria-live="polite"
      >
        <div className={cardContainerClassesStatic}>
          <div className={headerSectionClassesStatic}>
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            </div>
          </div>
          <div className={contentSectionClassesStatic}>
            <span className="sr-only">Loading calendar...</span>
            {skeleton ?? <CalendarSkeleton />}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (query?.error) {
    return (
      <div className={cn(containerClassesStatic, className)} data-theme={theme}>
        <div className={cardContainerClassesStatic}>
          <div className={contentSectionClassesStatic}>
            <CalendarErrorState error={query.error} retry={query.refetch} />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View Props
  // ---------------------------------------------------------------------------

  const viewProps = {
    date,
    events,
    eventsByDay,
    firstDayOfWeek,
    getEventStart,
    getEventEnd,
    getEventTitle,
    getEventStyle,
    onEventClick,
    onSlotSelect,
    selectable,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Use same classes as loading/error states
  const containerClasses = containerClassesStatic;
  const cardContainerClasses = cardContainerClassesStatic;
  const headerSectionClasses = headerSectionClassesStatic;
  const contentSectionClasses = contentSectionClassesStatic;

  return (
    <div className={cn(containerClasses, className)} data-theme={theme}>
      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          {!slots?.header && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            </div>
          )}
          {slots?.header &&
            (typeof slots.header === 'function'
              ? query?.data ? slots.header(query.data) : null
              : slots.header)}
        </div>

        {/* Content Section */}
        <div className={contentSectionClasses}>
          {/* Before calendar slot */}
          {slots?.beforeCalendar}

          {/* Toolbar */}
          {!slots?.toolbar && (
            <CalendarToolbar
              date={date}
              view={view}
              views={views}
              onNavigate={handleNavigate}
              onViewChange={handleViewChange}
            />
          )}
          {slots?.toolbar}

          {/* Calendar content */}
          <div
            role="tabpanel"
            id={`calendar-tabpanel-${view}`}
            aria-labelledby={`calendar-tab-${view}`}
            style={{ minHeight }}
          >
            {view === 'month' && <CalendarMonthView {...viewProps} />}
            {view === 'agenda' && <CalendarAgendaView {...viewProps} />}
            {(view === 'week' || view === 'day') && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>
                  Vista {view === 'week' ? 'semanal' : 'diária'} - Use um componente
                  de calendário externo para funcionalidade completa
                </p>
              </div>
            )}
          </div>

          {/* After calendar slot */}
          {slots?.afterCalendar}

          {/* Footer slot */}
          {slots?.footer &&
            (typeof slots.footer === 'function'
              ? query?.data ? slots.footer(query.data) : null
              : slots.footer)}
        </div>
      </div>
    </div>
  );
}

CalendarPage.displayName = 'CalendarPage';
