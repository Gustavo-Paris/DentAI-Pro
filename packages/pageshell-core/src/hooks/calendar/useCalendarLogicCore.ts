/**
 * useCalendarLogic - Headless Calendar Logic Hook
 *
 * Encapsulates all calendar state management: view, date navigation, events.
 *
 * @module hooks/calendar
 */

import { useState, useMemo, useCallback } from 'react';
import { isSameDay, isToday as isTodayUtil } from '../../utils/dateUtils';
import { MONTHS_PT, DAYS_PT_FULL } from './constants';
import { getCalendarDays, getWeekDays, normalizeStyle } from './utils';
import type {
  CalendarViewType,
  CalendarEventInternal,
  CalendarDay,
  UseCalendarLogicOptions,
  UseCalendarLogicReturn,
} from './types';

// =============================================================================
// Hook Implementation
// =============================================================================

export function useCalendarLogic<TEvent>(
  options: UseCalendarLogicOptions<TEvent> = {}
): UseCalendarLogicReturn<TEvent> {
  const {
    events = [],
    getEventStart = () => new Date(),
    getEventEnd = () => new Date(),
    getEventTitle = () => 'Event',
    getEventKey = (_event: TEvent, index: number) => String(index),
    getEventStyle,
    views = ['month', 'week', 'day', 'agenda'],
    defaultView = 'month',
    view: controlledView,
    onViewChange,
    defaultDate = new Date(),
    date: controlledDate,
    onDateChange,
    firstDayOfWeek = 0,
    startHour = 8,
    endHour = 18,
    locale = 'pt-BR',
    selectable = false,
    onSlotSelect,
    onEventClick,
  } = options;

  // State
  const [internalView, setInternalView] = useState<CalendarViewType>(defaultView);
  const [internalDate, setInternalDate] = useState<Date>(defaultDate);

  // Controlled/uncontrolled
  const view = controlledView ?? internalView;
  const date = controlledDate ?? internalDate;

  // Actions
  const setView = useCallback((newView: CalendarViewType) => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  }, [onViewChange]);

  const goToDate = useCallback((newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  }, [onDateChange]);

  const navigate = useCallback((action: 'prev' | 'next' | 'today') => {
    if (action === 'today') {
      goToDate(new Date());
      return;
    }

    const newDate = new Date(date);
    const delta = action === 'prev' ? -1 : 1;

    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + delta);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + delta * 7);
        break;
      case 'day':
      case 'agenda':
        newDate.setDate(newDate.getDate() + delta);
        break;
    }

    goToDate(newDate);
  }, [date, view, goToDate]);

  const selectSlot = useCallback((start: Date, end: Date) => {
    if (selectable && onSlotSelect) {
      onSlotSelect({ start, end, slots: [start], action: 'select' });
    }
  }, [selectable, onSlotSelect]);

  const clickEvent = useCallback((event: TEvent) => {
    onEventClick?.(event);
  }, [onEventClick]);

  // Process events
  const processedEvents = useMemo<CalendarEventInternal<TEvent>[]>(() => {
    return events.map((event, index) => ({
      original: event,
      key: getEventKey(event, index),
      title: getEventTitle(event),
      start: getEventStart(event),
      end: getEventEnd(event),
      style: normalizeStyle(getEventStyle?.(event)),
    }));
  }, [events, getEventKey, getEventTitle, getEventStart, getEventEnd, getEventStyle]);

  // Get events for a date
  const getEventsForDate = useCallback((targetDate: Date): CalendarEventInternal<TEvent>[] => {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return processedEvents.filter((event) => {
      return event.start <= endOfDay && event.end >= startOfDay;
    });
  }, [processedEvents]);

  // Get events for hour
  const getEventsForHour = useCallback((targetDate: Date, hour: number): CalendarEventInternal<TEvent>[] => {
    const hourStart = new Date(targetDate);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(targetDate);
    hourEnd.setHours(hour, 59, 59, 999);

    return processedEvents.filter((event) => {
      return event.start <= hourEnd && event.end >= hourStart;
    });
  }, [processedEvents]);

  // Hours array
  const hours = useMemo(() => {
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  }, [startHour, endHour]);

  // Is today check
  const isToday = useCallback((targetDate: Date): boolean => {
    return isTodayUtil(targetDate);
  }, []);

  // Is in view range check
  const isInViewRange = useCallback((targetDate: Date): boolean => {
    switch (view) {
      case 'month':
        return targetDate.getMonth() === date.getMonth() && targetDate.getFullYear() === date.getFullYear();
      case 'week': {
        const weekDaysArr = getWeekDays(date, firstDayOfWeek);
        return weekDaysArr.some(d => isSameDay(d, targetDate));
      }
      case 'day':
        return isSameDay(targetDate, date);
      case 'agenda':
        return targetDate.getMonth() === date.getMonth() && targetDate.getFullYear() === date.getFullYear();
      default:
        return false;
    }
  }, [view, date, firstDayOfWeek]);

  // Month days
  const monthDays = useMemo<CalendarDay<TEvent>[]>(() => {
    const calendarDays = getCalendarDays(date.getFullYear(), date.getMonth(), firstDayOfWeek);
    return calendarDays.map((d) => ({
      date: d,
      isCurrentMonth: d.getMonth() === date.getMonth(),
      isToday: isTodayUtil(d),
      events: getEventsForDate(d),
    }));
  }, [date, firstDayOfWeek, getEventsForDate]);

  // Week days
  const weekDays = useMemo<CalendarDay<TEvent>[]>(() => {
    const days = getWeekDays(date, firstDayOfWeek);
    return days.map((d) => ({
      date: d,
      isCurrentMonth: d.getMonth() === date.getMonth(),
      isToday: isTodayUtil(d),
      events: getEventsForDate(d),
    }));
  }, [date, firstDayOfWeek, getEventsForDate]);

  // Current day
  const currentDay = useMemo<CalendarDay<TEvent>>(() => ({
    date,
    isCurrentMonth: true,
    isToday: isTodayUtil(date),
    events: getEventsForDate(date),
  }), [date, getEventsForDate]);

  // Visible events
  const visibleEvents = useMemo<CalendarEventInternal<TEvent>[]>(() => {
    switch (view) {
      case 'month':
        return monthDays.flatMap(d => d.events);
      case 'week':
        return weekDays.flatMap(d => d.events);
      case 'day':
        return currentDay.events;
      case 'agenda':
        return processedEvents.filter(e =>
          e.start.getMonth() === date.getMonth() && e.start.getFullYear() === date.getFullYear()
        );
      default:
        return [];
    }
  }, [view, monthDays, weekDays, currentDay, processedEvents, date]);

  // Title
  const title = useMemo(() => {
    switch (view) {
      case 'month':
        return `${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`;
      case 'week': {
        const days = getWeekDays(date, firstDayOfWeek);
        const start = days[0]!;
        const end = days[6]!;
        if (start.getMonth() === end.getMonth()) {
          return `${start.getDate()} - ${end.getDate()} ${MONTHS_PT[start.getMonth()]} ${start.getFullYear()}`;
        }
        return `${start.getDate()} ${MONTHS_PT[start.getMonth()]} - ${end.getDate()} ${MONTHS_PT[end.getMonth()]} ${end.getFullYear()}`;
      }
      case 'day':
        return `${DAYS_PT_FULL[date.getDay()]}, ${date.getDate()} ${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`;
      case 'agenda':
        return `${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`;
      default:
        return '';
    }
  }, [view, date, firstDayOfWeek]);

  return {
    // State
    view,
    date,
    views,

    // Title
    title,

    // Computed data
    processedEvents,
    visibleEvents,
    monthDays,
    weekDays,
    currentDay,
    hours,

    // Actions
    setView,
    navigate,
    goToDate,
    selectSlot,
    clickEvent,

    // Utilities
    getEventsForDate,
    getEventsForHour,
    isToday,
    isInViewRange,

    // Configuration
    firstDayOfWeek,
    startHour,
    endHour,
    locale,
    selectable,
  };
}
