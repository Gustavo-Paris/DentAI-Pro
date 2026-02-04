/**
 * Calendar Logic Types
 *
 * @module hooks/calendar
 */

// =============================================================================
// View Types
// =============================================================================

/**
 * Calendar view types
 */
export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

// =============================================================================
// Event Types
// =============================================================================

/**
 * Slot info for event creation
 */
export interface CalendarSlotSelection {
  /** Start date/time */
  start: Date;
  /** End date/time */
  end: Date;
  /** All slot dates selected */
  slots: Date[];
  /** Action type */
  action: 'click' | 'select';
}

/**
 * Event style configuration
 */
export interface CalendarEventStyleConfig {
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  color?: string;
}

/**
 * Internal event with computed properties
 */
export interface CalendarEventInternal<TEvent> {
  /** Original event */
  original: TEvent;
  /** Event key */
  key: string;
  /** Event title */
  title: string;
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
  /** Style configuration */
  style: CalendarEventStyleConfig;
}

// =============================================================================
// Day/Week Types
// =============================================================================

/**
 * Day information for calendar grid
 */
export interface CalendarDay<TEvent> {
  /** Date */
  date: Date;
  /** Is in current month */
  isCurrentMonth: boolean;
  /** Is today */
  isToday: boolean;
  /** Events for this day */
  events: CalendarEventInternal<TEvent>[];
}

/**
 * Week information for week view
 */
export interface CalendarWeek<TEvent> {
  /** Days in the week */
  days: CalendarDay<TEvent>[];
  /** Week start date */
  startDate: Date;
  /** Week end date */
  endDate: Date;
}

/**
 * Calendar state
 */
export interface CalendarState {
  /** Current view */
  view: CalendarViewType;
  /** Current date */
  date: Date;
}

// =============================================================================
// Hook Options
// =============================================================================

/**
 * useCalendarLogic options
 */
export interface UseCalendarLogicOptions<TEvent> {
  // Events
  /** Event items */
  events?: TEvent[];
  /** Get event start date */
  getEventStart?: (event: TEvent) => Date;
  /** Get event end date */
  getEventEnd?: (event: TEvent) => Date;
  /** Get event title */
  getEventTitle?: (event: TEvent) => string;
  /** Get event key */
  getEventKey?: (event: TEvent, index: number) => string;
  /** Get event style */
  getEventStyle?: (event: TEvent) => CalendarEventStyleConfig | string;

  // Views
  /** Available views */
  views?: CalendarViewType[];
  /** Default view */
  defaultView?: CalendarViewType;
  /** Controlled view */
  view?: CalendarViewType;
  /** View change callback */
  onViewChange?: (view: CalendarViewType) => void;

  // Date navigation
  /** Default date */
  defaultDate?: Date;
  /** Controlled date */
  date?: Date;
  /** Date change callback */
  onDateChange?: (date: Date) => void;

  // Configuration
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Start hour for day/week views */
  startHour?: number;
  /** End hour for day/week views */
  endHour?: number;
  /** Locale for formatting */
  locale?: string;

  // Selection
  /** Enable slot selection */
  selectable?: boolean;
  /** Slot selection callback */
  onSlotSelect?: (slot: CalendarSlotSelection) => void;
  /** Event click callback */
  onEventClick?: (event: TEvent) => void;
}

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * useCalendarLogic return value
 */
export interface UseCalendarLogicReturn<TEvent> {
  // State
  /** Current view */
  view: CalendarViewType;
  /** Current date */
  date: Date;
  /** Available views */
  views: CalendarViewType[];

  // Title
  /** Current title (e.g., "January 2025" or "Week of Jan 1-7") */
  title: string;

  // Computed data
  /** Processed events with computed properties */
  processedEvents: CalendarEventInternal<TEvent>[];
  /** Events visible in current view */
  visibleEvents: CalendarEventInternal<TEvent>[];
  /** Days for month view */
  monthDays: CalendarDay<TEvent>[];
  /** Days for week view */
  weekDays: CalendarDay<TEvent>[];
  /** Current day info */
  currentDay: CalendarDay<TEvent>;
  /** Hours for day/week view */
  hours: number[];

  // Actions
  /** Set view */
  setView: (view: CalendarViewType) => void;
  /** Navigate (prev, next, today) */
  navigate: (action: 'prev' | 'next' | 'today') => void;
  /** Go to specific date */
  goToDate: (date: Date) => void;
  /** Handle slot selection */
  selectSlot: (start: Date, end: Date) => void;
  /** Handle event click */
  clickEvent: (event: TEvent) => void;

  // Utilities
  /** Get events for a specific date */
  getEventsForDate: (date: Date) => CalendarEventInternal<TEvent>[];
  /** Get events for a specific hour on a date */
  getEventsForHour: (date: Date, hour: number) => CalendarEventInternal<TEvent>[];
  /** Check if a date is today */
  isToday: (date: Date) => boolean;
  /** Check if a date is in current view range */
  isInViewRange: (date: Date) => boolean;

  // Configuration
  /** First day of week */
  firstDayOfWeek: number;
  /** Start hour */
  startHour: number;
  /** End hour */
  endHour: number;
  /** Locale */
  locale: string;
  /** Is selectable */
  selectable: boolean;
}
