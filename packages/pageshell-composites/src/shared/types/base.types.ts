/**
 * Base Composite Types
 *
 * Base props shared by all composites.
 *
 * @module shared/types/base
 */

import type { PageShellTheme } from './theme.types';
import type { RouterAdapter } from './router.types';
import type { DeprecationLevel } from '../utils/deprecation';

// =============================================================================
// Container Wrapper Variant Type
// =============================================================================

/**
 * Container wrapper variant for composites
 * Controls the wrapper styling (card vs shell)
 * - 'card': Card-like container with background (default)
 * - 'shell': Matches PageShell.Static layout (no card wrapper)
 */
export type ContainerWrapperVariant = 'card' | 'shell';

/**
 * @deprecated Use `ContainerWrapperVariant` instead. Will be removed in v1.0.
 */
export type ContainerVariant = ContainerWrapperVariant;

// =============================================================================
// Base Composite Props
// =============================================================================

/**
 * Base props shared by all composites
 */
export interface CompositeBaseProps {
  /** Theme preset */
  theme?: PageShellTheme;
  /** Page title */
  title: string;
  /** Optional subtitle/description - can be string or function receiving data */
  description?: string | ((data: unknown) => string);
  /** Router adapter for navigation */
  router?: RouterAdapter;
  /** Custom class names */
  className?: string;
  /**
   * Container variant
   * - 'shell': Full width, no card wrapper (default)
   * - 'card': Card-like container with max-width and background
   * @default 'shell'
   */
  containerVariant?: ContainerVariant;
  /** Test ID for automated testing */
  testId?: string;

  /**
   * Strict mode for deprecation warnings.
   * Controls how deprecated props are handled in development.
   *
   * - 'warn': Log console warnings (default)
   * - 'error': Throw errors for deprecated prop usage (strict enforcement)
   * - 'silent' or false: No output (for gradual migration)
   *
   * @default 'warn'
   *
   * @example Enforce no deprecated props
   * ```tsx
   * <ListPage strictMode="error" {...props} />
   * ```
   *
   * @example Silence warnings during migration
   * ```tsx
   * <ListPage strictMode="silent" {...props} />
   * ```
   */
  strictMode?: DeprecationLevel;
}
