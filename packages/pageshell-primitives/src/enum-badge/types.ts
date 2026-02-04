/**
 * EnumStatusBadge Types
 *
 * Type definitions for the EnumStatusBadge primitive component.
 * Used for displaying badges based on enum values with configurable icons and colors.
 *
 * @module enum-badge/types
 */

import type { ReactNode } from 'react';
import type { StatusVariant } from '../status-badge';

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration for a single enum value
 */
export interface EnumBadgeConfigItem {
  /** Display label for the enum value */
  label: string;
  /** Icon name */
  icon?: string;
  /** React node icon (alternative to icon name) */
  IconComponent?: React.ComponentType<{ className?: string }>;
  /** Status/color variant */
  variant: StatusVariant;
  /** Optional description for tooltip */
  description?: string;
}

/**
 * Configuration map for all enum values
 */
export type EnumBadgeConfig<T extends string> = Record<T, EnumBadgeConfigItem>;

// =============================================================================
// Component Props
// =============================================================================

/**
 * EnumStatusBadge component props
 */
export interface EnumStatusBadgeProps<T extends string> {
  /** The enum value to display */
  value: T;
  /** Configuration for all enum values */
  config: EnumBadgeConfig<T>;
  /** Show description as tooltip */
  showDescription?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
  /** Show icon */
  showIcon?: boolean;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Helper to create typed config
 */
export function defineEnumBadgeConfig<T extends string>(
  config: EnumBadgeConfig<T>
): EnumBadgeConfig<T> {
  return config;
}
