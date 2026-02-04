/**
 * CalendarPage Utilities
 *
 * Shared utility functions and constants for the CalendarPage composite.
 *
 * @module calendar/utils
 */

import type { CalendarEventStyle } from './types';

// =============================================================================
// Constants
// =============================================================================

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const eventStyleClasses: Record<CalendarEventStyle, string> = {
  violet: 'bg-violet-500/20 text-violet-700 border-violet-500',
  emerald: 'bg-emerald-500/20 text-emerald-700 border-emerald-500',
  amber: 'bg-amber-500/20 text-amber-700 border-amber-500',
  blue: 'bg-blue-500/20 text-blue-700 border-blue-500',
  cyan: 'bg-cyan-500/20 text-cyan-700 border-cyan-500',
  red: 'bg-red-500/20 text-red-700 border-red-500',
  default: 'bg-primary/20 text-primary border-primary',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all days to display in month view (including padding days from adjacent months)
 */
export function getMonthDays(
  year: number,
  month: number,
  firstDayOfWeek: number
): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Days from previous month
  let startDayOfWeek = firstDay.getDay() - firstDayOfWeek;
  if (startDayOfWeek < 0) startDayOfWeek += 7;

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Days from next month
  const remaining = 42 - days.length; // 6 rows x 7 days
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get date key for event grouping (YYYY-MM-DD format)
 */
export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get week dates for a given date
 */
export function getWeekDates(date: Date, firstDayOfWeek: number): Date[] {
  const dates: Date[] = [];
  const currentDay = date.getDay();
  let diff = currentDay - firstDayOfWeek;
  if (diff < 0) diff += 7;

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d);
  }

  return dates;
}

/**
 * Get CSS class for event style
 */
export function getEventStyleClass(
  style: CalendarEventStyle | string | undefined
): string {
  if (!style) return eventStyleClasses.default;
  return (eventStyleClasses as Record<string, string>)[style] ?? eventStyleClasses.default;
}
