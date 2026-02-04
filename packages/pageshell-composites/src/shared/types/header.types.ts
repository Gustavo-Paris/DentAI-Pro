/**
 * Header Action Types
 *
 * Header action configuration for page headers.
 *
 * @module shared/types/header
 */

import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Header Action Configuration
// =============================================================================

/**
 * Header action configuration
 */
export interface HeaderActionConfig {
  /** Action label */
  label: string;
  /** Icon - accepts string name (e.g., 'plus', 'download') or ComponentType */
  icon?: IconProp;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Disable the action */
  disabled?: boolean;
  /** Conditionally show/hide the action */
  show?: boolean;
  /** Test ID for automation testing */
  testId?: string;
}
