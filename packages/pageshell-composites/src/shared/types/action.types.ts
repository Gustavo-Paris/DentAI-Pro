/**
 * Action Configuration Types
 *
 * Row actions and bulk actions configuration.
 *
 * @module shared/types/action
 */

import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Row Actions Configuration
// =============================================================================

/**
 * Confirmation dialog configuration
 */
export interface RowActionConfirm {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Single row action configuration
 */
export interface RowActionConfig<TRow = Record<string, unknown>> {
  /** Action label */
  label: string;
  /** Icon - accepts string name (e.g., 'edit', 'trash') or ComponentType */
  icon?: IconProp;
  /** Navigation href (can use :param interpolation) */
  href?: string | ((row: TRow) => string);
  /** Click handler */
  onClick?: (row: TRow) => void | Promise<void>;
  /** Mutation for async operations */
  mutation?: {
    mutateAsync: (input: unknown) => Promise<unknown>;
  };
  /** Extract mutation input from row */
  getInput?: (row: TRow) => unknown;
  /** Confirmation dialog */
  confirm?: RowActionConfirm;
  /** Disable condition */
  disabled?: boolean | ((row: TRow) => boolean);
  /** Hide condition */
  hidden?: boolean | ((row: TRow) => boolean);
  /** Action variant */
  variant?: 'default' | 'destructive';
}

/**
 * Row actions configuration object
 */
export type RowActionsConfig<TRow = Record<string, unknown>> = Record<
  string,
  RowActionConfig<TRow>
>;

// =============================================================================
// Bulk Actions Configuration
// =============================================================================

/**
 * Bulk action configuration
 */
export interface BulkActionConfig<TRow = Record<string, unknown>> {
  /** Action label */
  label: string;
  /** Icon - accepts string name (e.g., 'trash', 'download') or ComponentType */
  icon?: IconProp;
  /** Click handler for custom bulk operations */
  onClick?: (rows: TRow[]) => void | Promise<void>;
  /** Mutation for bulk operation */
  mutation?: {
    mutateAsync: (input: unknown) => Promise<unknown>;
  };
  /** Extract inputs from selected rows */
  getInputs?: (rows: TRow[]) => unknown[];
  /** Confirmation dialog */
  confirm?: RowActionConfirm;
  /** Action variant */
  variant?: 'default' | 'destructive';
}

/**
 * Bulk actions configuration
 */
export type BulkActionsConfig<TRow = Record<string, unknown>> = Record<
  string,
  BulkActionConfig<TRow>
>;
