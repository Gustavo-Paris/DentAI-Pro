/**
 * PageStatsCard Constants
 *
 * @module page-stats-card/constants
 */

import type { PageStatsCardSize, SizeConfigItem } from './types';

// =============================================================================
// Size Configurations
// =============================================================================

export const sizeConfig: Record<PageStatsCardSize, SizeConfigItem> = {
  sm: {
    padding: 'p-4',
    labelSize: 'text-xs',
    valueSize: 'text-xl',
    iconSize: 'h-6 w-6',
    iconBgSize: 'p-2',
    subtitleSize: 'text-xs',
    trendSize: 'text-xs',
  },
  md: {
    padding: 'p-5',
    labelSize: 'text-sm',
    valueSize: 'text-2xl',
    iconSize: 'h-8 w-8',
    iconBgSize: 'p-2.5',
    subtitleSize: 'text-sm',
    trendSize: 'text-sm',
  },
  lg: {
    padding: 'p-6',
    labelSize: 'text-sm',
    valueSize: 'text-3xl',
    iconSize: 'h-10 w-10',
    iconBgSize: 'p-3',
    subtitleSize: 'text-sm',
    trendSize: 'text-sm',
  },
};

// =============================================================================
// Subtitle Color Classes
// =============================================================================

export const subtitleColorClasses = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
} as const;
