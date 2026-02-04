/**
 * CalendarPage Agenda View
 *
 * Agenda/list view for CalendarPage.
 *
 * @module calendar/components/CalendarAgendaView
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Calendar as CalendarIcon } from 'lucide-react';

import type { CalendarEventStyle } from '../types';
import { formatTime, eventStyleClasses } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface CalendarAgendaViewProps<TEvent> {
  /** Current date */
  date: Date;
  /** All events */
  events: TEvent[];
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
}

// =============================================================================
// Component
// =============================================================================

export function CalendarAgendaView<TEvent>({
  date,
  events,
  getEventStart,
  getEventTitle,
  getEventStyle,
  onEventClick,
}: CalendarAgendaViewProps<TEvent>) {
  // Get events for the next 30 days
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 30);

  const filteredEvents = events
    .filter((event) => {
      const start = getEventStart(event);
      return start >= startDate && start <= endDate;
    })
    .sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());

  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
        <p>No events in the next 30 days</p>
      </div>
    );
  }

  // Group by date
  const groupedEvents = filteredEvents.reduce(
    (acc, event) => {
      const start = getEventStart(event);
      const dateKey = start.toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey]!.push(event);
      return acc;
    },
    {} as Record<string, TEvent[]>
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
        const eventDate = new Date(dateKey);
        return (
          <div key={dateKey} className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2">
              <h3 className="text-sm font-medium">
                {eventDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {dayEvents.map((event, index) => {
                const style = getEventStyle?.(event) || 'default';
                const styleClass =
                  typeof style === 'string' && style in eventStyleClasses
                    ? eventStyleClasses[style as CalendarEventStyle]
                    : eventStyleClasses.default;

                return (
                  <button
                    key={index}
                    onClick={() => onEventClick?.(event)}
                    aria-label={`Evento: ${getEventTitle(event)}`}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="text-sm text-muted-foreground w-20 shrink-0">
                      {formatTime(getEventStart(event))}
                    </div>
                    <div
                      className={cn(
                        'flex-1 px-3 py-1 rounded border-l-2',
                        styleClass
                      )}
                    >
                      {getEventTitle(event)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

CalendarAgendaView.displayName = 'CalendarAgendaView';
