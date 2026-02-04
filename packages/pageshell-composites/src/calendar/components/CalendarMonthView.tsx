/**
 * CalendarPage Month View
 *
 * Month grid view for CalendarPage.
 *
 * @module calendar/components/CalendarMonthView
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';

import type { CalendarEventStyle, CalendarSlotInfo } from '../types';
import {
  WEEKDAYS,
  MONTHS,
  getMonthDays,
  isSameDay,
  eventStyleClasses,
} from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface CalendarMonthViewProps<TEvent> {
  /** Current date */
  date: Date;
  /** All events */
  events: TEvent[];
  /** Events indexed by day (YYYY-MM-DD key) */
  eventsByDay: Map<string, TEvent[]>;
  /** First day of week (0 = Sunday) */
  firstDayOfWeek: number;
  /** Get event start date */
  getEventStart: (event: TEvent) => Date;
  /** Get event end date */
  getEventEnd: (event: TEvent) => Date;
  /** Get event title */
  getEventTitle: (event: TEvent) => string;
  /** Get event style */
  getEventStyle?: (event: TEvent) => CalendarEventStyle | string;
  /** Event click handler */
  onEventClick?: (event: TEvent) => void;
  /** Slot selection handler */
  onSlotSelect?: (slot: CalendarSlotInfo) => void;
  /** Whether slots are selectable */
  selectable?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function CalendarMonthView<TEvent>({
  date,
  eventsByDay,
  firstDayOfWeek,
  getEventTitle,
  getEventStyle,
  onEventClick,
  onSlotSelect,
  selectable,
}: CalendarMonthViewProps<TEvent>) {
  const days = getMonthDays(date.getFullYear(), date.getMonth(), firstDayOfWeek);
  const today = new Date();

  // Reorder weekdays based on firstDayOfWeek
  const weekdays = [
    ...WEEKDAYS.slice(firstDayOfWeek),
    ...WEEKDAYS.slice(0, firstDayOfWeek),
  ];

  // O(1) lookup using pre-computed eventsByDay map
  const getEventsForDay = React.useCallback(
    (day: Date) => {
      const key = day.toISOString().split('T')[0]!;
      return eventsByDay.get(key) ?? [];
    },
    [eventsByDay]
  );

  // Memoized handler for day cell clicks - keyed by day index
  const { getHandler: getDayClickHandler } = useHandlerMap((dayIndex: number) => {
    const day = days[dayIndex];
    if (day && selectable && onSlotSelect) {
      onSlotSelect({
        start: day,
        end: new Date(day.getTime() + 24 * 60 * 60 * 1000),
        allDay: true,
      });
    }
  });

  // Memoized handler for event button clicks - keyed by "dayIndex-eventIndex"
  const { getHandler: getEventClickHandler } = useHandlerMap(
    (key: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const [dayIndexStr, eventIndexStr] = key.split('-');
      const dayIndex = Number(dayIndexStr);
      const eventIndex = Number(eventIndexStr);
      const day = days[dayIndex];
      if (day) {
        const dayEvents = getEventsForDay(day);
        const calendarEvent = dayEvents[eventIndex];
        if (calendarEvent) {
          onEventClick?.(calendarEvent);
        }
      }
    }
  );

  return (
    <div
      role="grid"
      aria-label={`Calendário de ${MONTHS[date.getMonth()]} ${date.getFullYear()}`}
      className="border border-border rounded-lg overflow-hidden"
    >
      {/* Weekday headers */}
      <div role="row" className="grid grid-cols-7 bg-muted">
        {weekdays.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(day);
          const dayLabel = day.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          return (
            <div
              key={index}
              role="gridcell"
              aria-label={`${dayLabel}${dayEvents.length > 0 ? `, ${dayEvents.length} evento${dayEvents.length > 1 ? 's' : ''}` : ''}`}
              tabIndex={isCurrentMonth ? 0 : -1}
              onClick={getDayClickHandler(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  getDayClickHandler(index)();
                }
              }}
              className={cn(
                'min-h-[100px] p-1 bg-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                !isCurrentMonth && 'bg-muted/50',
                selectable && 'cursor-pointer hover:bg-muted/30'
              )}
            >
              <div
                className={cn(
                  'text-sm mb-1',
                  isToday &&
                    'w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground',
                  !isToday && !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => {
                  const style = getEventStyle?.(event) || 'default';
                  const styleClass =
                    typeof style === 'string' && style in eventStyleClasses
                      ? eventStyleClasses[style as CalendarEventStyle]
                      : eventStyleClasses.default;

                  return (
                    <button
                      key={i}
                      onClick={getEventClickHandler(`${index}-${i}`)}
                      aria-label={`Evento: ${getEventTitle(event)}`}
                      className={cn(
                        'w-full text-left text-xs px-1 py-0.5 rounded truncate border-l-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        styleClass
                      )}
                    >
                      {getEventTitle(event)}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1" aria-hidden="true">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

CalendarMonthView.displayName = 'CalendarMonthView';
