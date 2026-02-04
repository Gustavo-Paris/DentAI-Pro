/**
 * Time Icons Registry
 *
 * @module icons/registry/time
 */

import {
  Clock,
  Calendar,
  CalendarClock,
  CalendarDays,
  Timer,
} from 'lucide-react';

export const timeIcons = {
  clock: Clock,
  time: Clock,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  timer: Timer,
} as const;
