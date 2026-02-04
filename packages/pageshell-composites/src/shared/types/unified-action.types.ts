/**
 * Unified Action Configuration Types
 *
 * Single action configuration that works for both table and card modes.
 * Part of the ListPage Unified API (see design doc: 2026-01-23-listpage-unified-api-design.md)
 *
 * @module shared/types/unified-action
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';

// =============================================================================
// Unified Action Confirmation
// =============================================================================

/**
 * Confirmation dialog configuration for unified actions.
 * Supports both static strings and dynamic functions.
 */
export interface UnifiedActionConfirm<TItem = unknown> {
  /** Dialog title (static or dynamic based on item) */
  title: string | ((item: TItem) => string);
  /** Dialog description */
  description?: string | ((item: TItem) => string);
  /** Dialog body content */
  body?: ReactNode | ((item: TItem) => ReactNode);
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading button text (while mutation runs) */
  loadingText?: string;
  /** Dialog variant */
  variant?: 'default' | 'destructive';
}

// =============================================================================
// Unified Action Configuration
// =============================================================================

/**
 * Mode visibility options for actions.
 */
export type ActionVisibility = 'table' | 'card' | 'both';

/**
 * Unified action configuration that works for both table and card modes.
 *
 * @example Basic action with href
 * ```tsx
 * actions={{
 *   edit: {
 *     label: 'Edit',
 *     icon: 'pencil',
 *     href: '/items/:id/edit',
 *   },
 * }}
 * ```
 *
 * @example Action with mutation and confirmation
 * ```tsx
 * actions={{
 *   delete: {
 *     label: 'Delete',
 *     icon: 'trash',
 *     variant: 'destructive',
 *     mutation: deleteMutation,
 *     mutationInput: (item) => ({ id: item.id }),
 *     confirm: { title: 'Delete item?' },
 *   },
 * }}
 * ```
 *
 * @example Mode-specific overrides
 * ```tsx
 * actions={{
 *   view: {
 *     label: 'View',
 *     href: '/items/:id',
 *     cardIcon: 'arrow-right', // Different icon in card mode
 *     showIn: 'card',          // Only show in card mode
 *   },
 * }}
 * ```
 */
export interface UnifiedActionConfig<TItem = unknown> {
  // ---------------------------------------------------------------------------
  // Core Properties (work in both modes)
  // ---------------------------------------------------------------------------

  /** Action label text */
  label: string;

  /**
   * Icon - accepts string name (e.g., 'edit', 'trash') or ComponentType.
   * Used in both table dropdown and card action buttons.
   */
  icon?: IconProp;

  /**
   * Navigation href (supports :param interpolation).
   * Examples: '/items/:id/edit', '/users/:userId'
   */
  href?: string | ((item: TItem) => string);

  /** Click handler for custom logic */
  onClick?: (item: TItem) => void | Promise<void>;

  /**
   * Mutation for async operations.
   * When provided, the action will call mutateAsync and handle loading/error states.
   */
  mutation?: {
    mutateAsync: (input: unknown) => Promise<unknown>;
  };

  /**
   * Extract mutation input from item.
   * Required when using mutation.
   */
  mutationInput?: (item: TItem) => unknown;

  /** Success message to show after mutation completes */
  successMessage?: string;

  /** Navigate to this URL after successful mutation */
  successHref?: string | ((item: TItem) => string);

  /**
   * Confirmation dialog configuration.
   * - Pass object for custom dialog
   * - Pass true for default confirmation
   * - Pass false or omit to skip confirmation
   */
  confirm?: UnifiedActionConfirm<TItem> | boolean;

  /**
   * Action variant for styling.
   * - 'default': Normal action
   * - 'destructive': Red/warning styling, always shown in menu (never primary)
   */
  variant?: 'default' | 'destructive';

  /**
   * Condition to show this action.
   * Return false to hide the action for specific items.
   */
  showWhen?: (item: TItem) => boolean;

  /**
   * Condition to disable this action.
   * Return true to show but disable the action for specific items.
   */
  disabledWhen?: (item: TItem) => boolean;

  // ---------------------------------------------------------------------------
  // Mode-Specific Overrides
  // ---------------------------------------------------------------------------

  /**
   * Override icon for card mode.
   * Use when you want different icons in table vs card modes.
   */
  cardIcon?: IconProp;

  /**
   * Control which modes this action appears in.
   * - 'both': Show in table and card modes (default)
   * - 'table': Only show in table mode
   * - 'card': Only show in card mode
   *
   * @default 'both'
   */
  showIn?: ActionVisibility;

  /**
   * Mark this action as primary for card mode.
   * Primary actions become the card's click handler.
   *
   * By default, the first action with `href` becomes primary.
   * Set this to true to explicitly mark an action as primary.
   * Set this to false on an href action to prevent it from being primary.
   *
   * Note: Actions with `variant: 'destructive'` are never primary.
   */
  cardPrimary?: boolean;
}

/**
 * Unified actions configuration - record of named actions.
 *
 * @example
 * ```tsx
 * const actions: UnifiedActionsConfig<User> = {
 *   edit: { label: 'Edit', href: '/users/:id/edit' },
 *   delete: { label: 'Delete', variant: 'destructive', mutation: deleteMutation },
 * };
 * ```
 */
export type UnifiedActionsConfig<TItem = unknown> = Record<
  string,
  UnifiedActionConfig<TItem>
>;

// =============================================================================
// Legacy Type Aliases (for backwards compatibility)
// =============================================================================

/**
 * @deprecated Use UnifiedActionConfig instead.
 * This alias exists for backwards compatibility during migration.
 */
export type ActionConfigUnified<TItem = unknown> = UnifiedActionConfig<TItem>;

/**
 * @deprecated Use UnifiedActionsConfig instead.
 * This alias exists for backwards compatibility during migration.
 */
export type ActionsConfigUnified<TItem = unknown> = UnifiedActionsConfig<TItem>;
