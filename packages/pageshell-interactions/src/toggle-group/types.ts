/**
 * PageToggleGroup Types
 *
 * Type definitions for the multi-select toggle button group component.
 *
 * @module toggle-group/types
 */

import type { IconName } from '@pageshell/primitives';

// =============================================================================
// Toggle Option
// =============================================================================

/**
 * Configuration for a single toggle option
 */
export interface ToggleOption {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon to display */
  icon?: IconName;
  /** Whether this option is disabled */
  disabled?: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Size variants for toggle buttons
 */
export type ToggleGroupSize = 'sm' | 'md' | 'lg';

/**
 * Visual variants for toggle group
 */
export type ToggleGroupVariant = 'default' | 'glow';

/**
 * Props for PageToggleGroup component
 */
export interface PageToggleGroupProps {
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (values: string[]) => void;
  /** Available options */
  options: readonly ToggleOption[] | ToggleOption[];
  /** Help text displayed below the group */
  helpText?: string;
  /** Whether the entire group is disabled */
  disabled?: boolean;
  /** Button size variant */
  size?: ToggleGroupSize;
  /** Visual variant (glow adds shadow effect on selected items) */
  variant?: ToggleGroupVariant;
  /** Additional CSS class */
  className?: string;
}
