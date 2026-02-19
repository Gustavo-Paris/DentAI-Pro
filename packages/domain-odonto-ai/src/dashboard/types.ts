/**
 * Dashboard subdomain types
 *
 * Types for clinic KPIs, agenda widgets, activity feeds, and quick actions.
 */

import type { MoneyAmount, AppointmentStatus } from '../shared';

// =============================================================================
// KPI
// =============================================================================

export interface KPICardData {
  /** Display label for the metric */
  label: string;
  /** Current value (formatted string or number) */
  value: string | number;
  /** Percentage change from previous period */
  change?: number;
  /** Label describing the change period */
  changeLabel?: string;
  /** Icon name for the card */
  icon?: string;
}

// =============================================================================
// Agenda Widget
// =============================================================================

export interface AgendaWidgetItem {
  /** Unique identifier */
  id: string;
  /** Appointment time (e.g. "09:00") */
  time: string;
  /** Patient full name */
  patientName: string;
  /** Procedure description */
  procedure: string;
  /** Current appointment status */
  status: AppointmentStatus;
  /** Assigned professional name */
  professional: string;
}

// =============================================================================
// Activity Feed
// =============================================================================

export interface ActivityFeedItem {
  /** Unique identifier */
  id: string;
  /** Activity category */
  type: 'appointment' | 'payment' | 'treatment' | 'patient' | 'alert';
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** ISO timestamp */
  timestamp: string;
  /** Person who performed the action */
  actor?: string;
}

// =============================================================================
// Quick Actions
// =============================================================================

export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Button label */
  label: string;
  /** Icon name */
  icon: string;
  /** Navigation target */
  href?: string;
  /** Click handler */
  onClick?: () => void;
}

// =============================================================================
// Revenue Chart
// =============================================================================

export interface RevenueChartData {
  /** Period label (e.g. "Jan", "Week 1") */
  period: string;
  /** Revenue amount */
  revenue: MoneyAmount;
  /** Expenses amount */
  expenses?: MoneyAmount;
}

// =============================================================================
// Occupancy
// =============================================================================

export interface OccupancyData {
  /** Total capacity */
  total: number;
  /** Currently occupied */
  occupied: number;
  /** Custom label */
  label?: string;
}

// =============================================================================
// Alerts
// =============================================================================

export interface ClinicAlert {
  /** Unique identifier */
  id: string;
  /** Alert severity type */
  type: 'info' | 'warning' | 'error' | 'success';
  /** Alert title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button */
  action?: { label: string; href?: string; onClick?: () => void };
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
}
