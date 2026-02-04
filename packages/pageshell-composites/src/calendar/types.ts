/**
 * CalendarPage Types
 *
 * Type definitions for the CalendarPage composite.
 *
 * @module calendar/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type {
  CompositeBaseProps,
  CompositeQueryResult,
} from '../shared/types';

// =============================================================================
// Calendar View Types
// =============================================================================

/**
 * Available calendar views
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Event style configuration
 */
export type CalendarEventStyle =
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'cyan'
  | 'red'
  | 'default';

/**
 * Slot selection info
 */
export interface CalendarSlotInfo {
  /** Start time of slot */
  start: Date;
  /** End time of slot */
  end: Date;
  /** Whether slot spans all day */
  allDay: boolean;
}

// =============================================================================
// Modal Configs
// =============================================================================

/**
 * Event modal configuration
 */
export interface CalendarEventModalConfig<TEvent> {
  /** Enable event modal */
  enabled: boolean;
  /** Modal title */
  title?: string | ((event: TEvent) => string);
  /** Render modal content */
  render: (event: TEvent, onClose: () => void) => ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Slot modal configuration
 */
export interface CalendarSlotModalConfig {
  /** Enable slot modal */
  enabled: boolean;
  /** Modal title */
  title?: string;
  /** Render modal content */
  render: (slot: CalendarSlotInfo, onClose: () => void) => ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// Slots
// =============================================================================

/**
 * CalendarPage slots for customization
 */
export interface CalendarPageSlots<TData> {
  /** Custom header */
  header?: ReactNode | ((data: TData) => ReactNode);
  /** Content before calendar */
  beforeCalendar?: ReactNode;
  /** Content after calendar */
  afterCalendar?: ReactNode;
  /** Custom toolbar */
  toolbar?: ReactNode;
  /** Footer content */
  footer?: ReactNode | ((data: TData) => ReactNode);
}

// =============================================================================
// CalendarPage Props
// =============================================================================

/**
 * CalendarPage component props
 *
 * @template TEvent - The event type
 * @template TData - The data type returned by the query
 */
export interface CalendarPageProps<TEvent, TData = unknown>
  extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Page icon - accepts string name or ComponentType */
  icon?: IconProp;

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  /**
   * Query for events data
   */
  query?: CompositeQueryResult<TData>;

  /**
   * Direct events array (alternative to query)
   */
  events?: TEvent[];

  /**
   * Extract events from query data
   */
  getEvents?: (data: TData) => TEvent[];

  // ---------------------------------------------------------------------------
  // Event Mapping
  // ---------------------------------------------------------------------------

  /**
   * Extract event start time
   */
  getEventStart: (event: TEvent) => Date;

  /**
   * Extract event end time
   */
  getEventEnd: (event: TEvent) => Date;

  /**
   * Extract event title
   */
  getEventTitle: (event: TEvent) => string;

  /**
   * Extract event color/style
   */
  getEventStyle?: (event: TEvent) => CalendarEventStyle | string;

  /**
   * Check if event is all-day
   * @experimental Not yet implemented - reserved for future use
   */
  isAllDayEvent?: (event: TEvent) => boolean;

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------

  /**
   * Available views
   * @default ['month', 'week', 'day', 'agenda']
   */
  views?: CalendarView[];

  /**
   * Default view
   * @default 'month'
   */
  defaultView?: CalendarView;

  /**
   * Controlled view
   */
  view?: CalendarView;

  /**
   * View change handler
   */
  onViewChange?: (view: CalendarView) => void;

  // ---------------------------------------------------------------------------
  // Date Navigation
  // ---------------------------------------------------------------------------

  /**
   * Default date
   */
  defaultDate?: Date;

  /**
   * Controlled date
   */
  date?: Date;

  /**
   * Date change handler
   */
  onNavigate?: (date: Date) => void;

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  /**
   * Event click handler
   */
  onEventClick?: (event: TEvent) => void;

  /**
   * Slot selection handler
   */
  onSlotSelect?: (slot: CalendarSlotInfo) => void;

  /**
   * Enable slot selection
   */
  selectable?: boolean;

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------

  /**
   * Event detail modal configuration
   * @experimental Not yet implemented - reserved for future use
   */
  eventModal?: CalendarEventModalConfig<TEvent>;

  /**
   * Slot selection modal configuration
   * @experimental Not yet implemented - reserved for future use
   */
  slotModal?: CalendarSlotModalConfig;

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * Calendar min height
   * @default "500px"
   */
  minHeight?: string | number;

  /**
   * First day of week (0=Sunday, 1=Monday)
   * @default 0
   */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Start hour for day/week views
   * @default 8
   * @experimental Not yet implemented - reserved for future use
   */
  startHour?: number;

  /**
   * End hour for day/week views
   * @default 18
   * @experimental Not yet implemented - reserved for future use
   */
  endHour?: number;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides
   */
  slots?: CalendarPageSlots<TData>;

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  /**
   * Custom skeleton component
   */
  skeleton?: ReactNode;

  // ---------------------------------------------------------------------------
  // Custom Rendering
  // ---------------------------------------------------------------------------

  /**
   * Custom event render
   * @experimental Not yet implemented - reserved for future use
   */
  renderEvent?: (event: TEvent, view: CalendarView) => ReactNode;
}
