/**
 * Stat Configuration Types
 *
 * Stat card configuration for dashboards and analytics.
 *
 * @module shared/types/stat
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { ValueFormat } from './column.types';

// =============================================================================
// Stat Configuration
// =============================================================================

/**
 * Stat card configuration
 */
export interface StatConfig {
  /** Stat key in data */
  key: string;
  /** Display label */
  label: string;
  /** Value format */
  format?: ValueFormat | 'number' | 'currency' | 'percent';
  /** Icon - accepts string name (e.g., 'coins', 'trending-up') or ComponentType */
  icon?: IconProp;
  /** Visual variant for theming */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'accent';
  /** Trend direction (string) or trend configuration (object) */
  trend?: 'up' | 'down' | 'neutral' | { key: string; goodDirection?: 'up' | 'down' };
  /** Trend value (e.g., "+12%") */
  trendValue?: string;
  /** Custom render function */
  render?: (data: unknown, value?: unknown) => ReactNode;
  /** Card variant for different visual styles */
  cardVariant?: 'default' | 'gradient' | 'outline' | 'portal';
  /** Portal style variant (for portal card styles) */
  portalVariant?:
    // New variants (color-based)
    | 'blue'
    | 'purple'
    | 'green'
    | 'amber'
    | 'rose'
    | 'cyan'
    | 'default'
    // Legacy variants (semantic)
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'streak'
    | 'warning'
    | 'info'
    | 'success';
  /** Badge to display on stat card */
  badge?: ReactNode | { variant?: string; label: string };
}
