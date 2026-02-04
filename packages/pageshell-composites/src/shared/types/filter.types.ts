/**
 * Filter Configuration Types
 *
 * Filter options and configuration for lists.
 *
 * @module shared/types/filter
 */

import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Filter Configuration
// =============================================================================

/**
 * Filter option definition
 */
export interface FilterOption {
  value: string;
  label: string;
  /** Icon - accepts string name (e.g., 'filter') or ComponentType */
  icon?: IconProp;
}

/**
 * Card filter render mode
 * @description How the filter should be rendered in card view mode
 */
export type CardFilterRenderMode = 'buttons' | 'select';

/**
 * Filter configuration
 *
 * Unified filter config that works for both table and card modes.
 * In table mode, filters render as dropdowns.
 * In card mode, smart defaults apply (≤4 options → buttons, >4 → dropdown)
 * unless explicitly overridden via cardRenderAs.
 */
export interface FilterConfig {
  /** Filter key */
  key: string;
  /** Display label */
  label?: string;
  /** Filter options */
  options: (string | FilterOption)[];
  /**
   * Default value
   * @deprecated Use 'default' instead (unified naming)
   */
  defaultValue?: string;
  /**
   * Default value (unified naming)
   * Takes precedence over defaultValue if both are provided.
   */
  default?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Is this a search filter? */
  isSearch?: boolean;

  // ---------------------------------------------------------------------------
  // Card Mode Options (ListPage Unified API)
  // ---------------------------------------------------------------------------

  /**
   * Override rendering mode in card view.
   * - 'buttons': Render as button group (chip-like buttons)
   * - 'select': Render as dropdown select
   *
   * Smart defaults when not specified:
   * - ≤4 options → 'buttons'
   * - >4 options → 'select'
   */
  cardRenderAs?: CardFilterRenderMode;

  /**
   * Show this filter in specific view modes only.
   * @default 'both'
   */
  showIn?: 'table' | 'card' | 'both';
}
