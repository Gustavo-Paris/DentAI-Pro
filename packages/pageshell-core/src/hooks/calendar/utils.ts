/**
 * Calendar Logic Utilities
 *
 * @module hooks/calendar
 */

import { DEFAULT_STYLE, COLOR_MAP } from './constants';
import type { CalendarEventStyleConfig } from './types';

// =============================================================================
// Calendar Day Utilities
// =============================================================================

/**
 * Get all days for a month grid (including padding from prev/next months)
 */
export function getCalendarDays(year: number, month: number, firstDayOfWeek: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add days from previous month
  const startDayOfWeek = (firstDay.getDay() - firstDayOfWeek + 7) % 7;
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add days of current month
  const daysInMonth = lastDay.getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month
  const endDayOfWeek = (lastDay.getDay() - firstDayOfWeek + 7) % 7;
  for (let i = 1; i < 7 - endDayOfWeek; i++) {
    const date = new Date(year, month + 1, i);
    days.push(date);
  }

  return days;
}

/**
 * Get all days for a week
 */
export function getWeekDays(date: Date, firstDayOfWeek: number): Date[] {
  const days: Date[] = [];
  const dayOfWeek = (date.getDay() - firstDayOfWeek + 7) % 7;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
}

// =============================================================================
// Style Utilities
// =============================================================================

/**
 * Normalize event style (color name or config object)
 */
export function normalizeStyle(styleOrColor?: CalendarEventStyleConfig | string): CalendarEventStyleConfig {
  if (!styleOrColor) return DEFAULT_STYLE;
  if (typeof styleOrColor === 'string') {
    return COLOR_MAP[styleOrColor] || { backgroundColor: styleOrColor, color: 'white' };
  }
  return { ...DEFAULT_STYLE, ...styleOrColor };
}
