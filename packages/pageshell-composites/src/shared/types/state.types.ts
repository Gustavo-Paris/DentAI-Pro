/**
 * State Component Types
 *
 * Base types for empty, error, and loading state components.
 *
 * @module shared/types/state
 */

import type { IconProp } from '@pageshell/primitives';
import type { ActionConfig as CoreActionConfig, ActionVariant } from '@pageshell/core';

// =============================================================================
// Action Configuration (Shared)
// =============================================================================

/**
 * Action configuration for state components.
 * Extends CoreActionConfig with IconProp support.
 *
 * @see CoreActionConfig - Base type in @pageshell/core
 */
export interface ActionConfig extends Omit<CoreActionConfig, 'icon' | 'variant'> {
  /** Button variant (extended from core) */
  variant?: ActionVariant;
  /** Icon - accepts string name or ComponentType */
  icon?: IconProp;
}

// =============================================================================
// Base State Props (Shared)
// =============================================================================

/**
 * Base props for empty/error/loading state components.
 * Used by GenericEmptyState, GenericErrorState, etc.
 *
 * @see Code Quality - Consolidation of repeated state component interfaces
 */
export interface BaseStateProps {
  /** State title */
  title: string;
  /** State description */
  description?: string;
  /** Icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Primary action */
  action?: ActionConfig;
  /** Additional CSS class */
  className?: string;
}

/**
 * Base empty state props (alias for BaseStateProps)
 */
export type BaseEmptyStateProps = BaseStateProps;

/**
 * Base error state props with error details.
 * Title is optional as GenericErrorState provides variant-specific defaults.
 */
export interface BaseErrorStateProps extends Omit<BaseStateProps, 'title'> {
  /** Optional title (defaults to variant-specific message) */
  title?: string;
  /** Error object */
  error?: unknown;
  /** Retry action */
  onRetry?: () => void;
}

// =============================================================================
// Empty State Configuration
// =============================================================================

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  /** Empty state variant */
  variant?: 'data' | 'search' | 'filter' | 'error';
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Action button */
  action?: ActionConfig;
}
