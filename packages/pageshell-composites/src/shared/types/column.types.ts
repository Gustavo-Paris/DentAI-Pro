/**
 * Column Configuration Types
 *
 * Column configuration for list/table views.
 * Supports both legacy `format` and new `valueType`/`valueEnum` patterns.
 *
 * @module shared/types/column
 */

import type { ReactNode } from 'react';
import type { ValueType, ValueEnum } from './field.types';

// =============================================================================
// Column Configuration
// =============================================================================

/**
 * Value format types for automatic formatting (legacy)
 * @deprecated Use `valueType` instead for new code
 */
export type ValueFormat =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'relative'
  | 'boolean'
  | 'badge'
  | 'status'
  | 'tags'
  | 'avatar'
  | 'link'
  | 'truncate';

/**
 * Column configuration for list/table views
 *
 * @example Basic text column
 * ```tsx
 * { key: 'name', label: 'Nome', sortable: true }
 * ```
 *
 * @example Status badge with valueEnum
 * ```tsx
 * {
 *   key: 'status',
 *   label: 'Status',
 *   valueType: 'badge',
 *   valueEnum: {
 *     draft: { text: 'Rascunho', status: 'default' },
 *     active: { text: 'Ativo', status: 'success' },
 *   },
 *   width: 140,
 * }
 * ```
 *
 * @example Relative time
 * ```tsx
 * { key: 'updatedAt', label: 'Atualizado', valueType: 'relativeTime', sortable: true }
 * ```
 */
export interface ColumnConfig<TRow = Record<string, unknown>> {
  /** Unique column key (dot notation supported) */
  key: string;
  /** Display label */
  label: string;
  /** Test ID for automated testing */
  testId?: string;

  // ---------------------------------------------------------------------------
  // Value Type & Enum (Preferred API)
  // ---------------------------------------------------------------------------

  /**
   * Value type determines automatic formatting.
   * Preferred over `format` for new code.
   */
  valueType?: ValueType;

  /**
   * Value enum for badge/status fields.
   * Maps raw values to display text and status variant.
   */
  valueEnum?: ValueEnum;

  // ---------------------------------------------------------------------------
  // Legacy Format (Deprecated)
  // ---------------------------------------------------------------------------

  /**
   * Value format (legacy).
   * @deprecated Use `valueType` instead
   */
  format?: ValueFormat;

  /**
   * Badge variant mapping (legacy).
   * @deprecated Use `valueEnum` instead
   */
  badgeVariants?: Record<string, string>;

  /**
   * Status variant mapping (legacy).
   * @deprecated Use `valueEnum` instead
   */
  statusVariants?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'>;

  // ---------------------------------------------------------------------------
  // Layout & Behavior
  // ---------------------------------------------------------------------------

  /** Sortable? */
  sortable?: boolean;
  /** Hidden on mobile? */
  hiddenOnMobile?: boolean;
  /** Column width */
  width?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom cell className */
  className?: string;
  /** Max lines for text truncation (applies line-clamp) */
  maxLines?: number;

  // ---------------------------------------------------------------------------
  // Custom Rendering
  // ---------------------------------------------------------------------------

  /** Custom cell renderer (overrides valueType) */
  render?: (row: TRow, value: unknown) => ReactNode;
}
