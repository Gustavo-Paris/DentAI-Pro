/**
 * Calendar Logic Module
 *
 * @module hooks/calendar
 */

// Main hook
export { useCalendarLogic } from './useCalendarLogicCore';

// Types
export type {
  CalendarViewType,
  CalendarSlotSelection,
  CalendarEventStyleConfig,
  CalendarEventInternal,
  CalendarDay,
  CalendarWeek,
  CalendarState,
  UseCalendarLogicOptions,
  UseCalendarLogicReturn,
} from './types';

// Constants (for extension)
export {
  MONTHS_PT,
  DAYS_PT_FULL,
  DAYS_PT_SHORT,
  EVENT_TEXT_COLOR,
  DEFAULT_STYLE,
  COLOR_MAP,
} from './constants';

// Utils (for extension)
export {
  getCalendarDays,
  getWeekDays,
  normalizeStyle,
} from './utils';
