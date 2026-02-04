/**
 * PageStats Constants
 *
 * @module page-stats/constants
 */

import type { StatsBarItemVariant, LiveStatVariant, GridStatVariant } from './types';

// =============================================================================
// Bar Variant Icon Classes
// =============================================================================

export const barIconVariantClasses: Record<StatsBarItemVariant, string> = {
  default: '',
  unlocked: 'portal-achievements-stat-icon-unlocked',
  locked: 'portal-achievements-stat-icon-locked',
  streak: 'portal-achievements-stat-icon-streak',
  record: 'portal-achievements-stat-icon-record',
  upcoming: 'portal-session-stat-icon-upcoming',
  completed: 'portal-session-stat-icon-completed',
  hours: 'portal-session-stat-icon-hours',
  primary: 'portal-session-stat-icon-upcoming',
  success: 'portal-session-stat-icon-completed',
  accent: 'portal-session-stat-icon-hours',
};

// =============================================================================
// Live Variant Text Classes
// =============================================================================

export const liveVariantClasses: Record<LiveStatVariant, string> = {
  default: '',
  warning: 'text-warning',
  success: 'text-success',
  primary: 'text-primary',
  accent: 'text-accent',
};

// =============================================================================
// Grid Variant Card Classes
// =============================================================================

export const gridVariantClasses: Record<GridStatVariant, string> = {
  primary: 'portal-credits-stat-card-primary',
  secondary: 'portal-credits-stat-card-secondary',
  warning: 'portal-credits-stat-card-warning',
};

// =============================================================================
// Grid Column Classes
// =============================================================================

export const gridColumnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const;
