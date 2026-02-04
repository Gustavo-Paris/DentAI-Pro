/**
 * useUnifiedActions Hook
 *
 * Transforms unified action configuration to mode-specific formats.
 * Part of the ListPage Unified API.
 *
 * @module list/hooks/useUnifiedActions
 */

import { useMemo } from 'react';
import type {
  UnifiedActionsConfig,
  UnifiedActionConfig,
  RowActionsConfig,
  RowActionConfig,
} from '../../shared/types';
import type { CardActionsConfig, CardActionConfig } from '../types';
import type { ResolvedViewMode } from './useViewMode';

// =============================================================================
// Types
// =============================================================================

export interface UseUnifiedActionsOptions<TItem> {
  /** Unified actions configuration */
  actions?: UnifiedActionsConfig<TItem>;
  /** Legacy row actions (for backwards compatibility) */
  rowActions?: RowActionsConfig<TItem>;
  /** Legacy card actions (for backwards compatibility) */
  cardActions?: CardActionsConfig<TItem>;
  /** Current view mode */
  viewMode: ResolvedViewMode;
}

export interface UseUnifiedActionsResult<TItem> {
  /** Row actions for table mode */
  rowActions: RowActionsConfig<TItem>;
  /** Card actions for card mode */
  cardActions: CardActionsConfig<TItem>;
  /** Primary action for card click (first href action, unless overridden) */
  primaryAction: UnifiedActionConfig<TItem> | null;
  /** Primary action key */
  primaryActionKey: string | null;
  /** Whether unified actions are being used (vs legacy) */
  isUnified: boolean;
}

// =============================================================================
// Transformers
// =============================================================================

/**
 * Transform unified action to row action format (table mode)
 */
function toRowAction<TItem>(
  key: string,
  action: UnifiedActionConfig<TItem>
): RowActionConfig<TItem> | null {
  // Skip if action is card-only
  if (action.showIn === 'card') {
    return null;
  }

  return {
    label: action.label,
    icon: action.icon,
    href: action.href,
    onClick: action.onClick,
    mutation: action.mutation,
    getInput: action.mutationInput,
    confirm: action.confirm === true
      ? { title: `Confirm ${action.label}?` }
      : action.confirm === false
        ? undefined
        : action.confirm
          ? {
              title: typeof action.confirm.title === 'function'
                ? action.confirm.title({} as TItem) // Static fallback for table
                : action.confirm.title,
              description: typeof action.confirm.description === 'function'
                ? action.confirm.description({} as TItem)
                : action.confirm.description,
              confirmLabel: action.confirm.confirmText,
              cancelLabel: action.confirm.cancelText,
              variant: action.confirm.variant,
            }
          : undefined,
    disabled: action.disabledWhen,
    hidden: action.showWhen ? (item: TItem) => !action.showWhen!(item) : undefined,
    variant: action.variant,
  };
}

/**
 * Transform unified action to card action format (card mode)
 */
function toCardAction<TItem>(
  key: string,
  action: UnifiedActionConfig<TItem>
): CardActionConfig<TItem> | null {
  // Skip if action is table-only
  if (action.showIn === 'table') {
    return null;
  }

  return {
    label: action.label,
    // Use cardIcon override if provided, otherwise use regular icon
    icon: typeof action.cardIcon === 'string'
      ? action.cardIcon
      : typeof action.icon === 'string'
        ? action.icon
        : undefined,
    href: action.href,
    onClick: action.onClick,
    mutation: action.mutation,
    mutationInput: action.mutationInput,
    successMessage: action.successMessage,
    successHref: action.successHref,
    confirm: action.confirm === true
      ? { title: `Confirm ${action.label}?` }
      : action.confirm === false
        ? undefined
        : action.confirm
          ? {
              title: action.confirm.title,
              description: typeof action.confirm.description === 'function'
                ? undefined // Functions not supported in CardActionConfirm description
                : action.confirm.description,
              body: action.confirm.body,
              confirmText: action.confirm.confirmText,
              cancelText: action.confirm.cancelText,
              loadingText: action.confirm.loadingText,
              variant: action.confirm.variant,
            }
          : undefined,
    showWhen: action.showWhen,
    disabledWhen: action.disabledWhen,
    variant: action.variant,
  };
}

/**
 * Determine the primary action for card mode.
 * Primary action becomes the card's click handler.
 *
 * Rules:
 * 1. Action explicitly marked with cardPrimary: true wins
 * 2. First action with href that isn't destructive wins
 * 3. Actions with cardPrimary: false are excluded
 * 4. Actions with variant: 'destructive' are never primary
 */
function findPrimaryAction<TItem>(
  actions: UnifiedActionsConfig<TItem>
): { key: string; action: UnifiedActionConfig<TItem> } | null {
  const entries = Object.entries(actions);

  // First pass: look for explicit cardPrimary: true
  for (const [key, action] of entries) {
    if (action.cardPrimary === true && action.variant !== 'destructive') {
      return { key, action };
    }
  }

  // Second pass: find first href action that's not destructive or excluded
  for (const [key, action] of entries) {
    if (
      action.href &&
      action.cardPrimary !== false &&
      action.variant !== 'destructive' &&
      action.showIn !== 'table'
    ) {
      return { key, action };
    }
  }

  return null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to transform unified actions to mode-specific formats.
 *
 * @example
 * ```tsx
 * const { rowActions, cardActions, primaryAction } = useUnifiedActions({
 *   actions: {
 *     edit: { label: 'Edit', href: '/items/:id/edit' },
 *     delete: { label: 'Delete', variant: 'destructive', mutation },
 *   },
 *   viewMode: 'table',
 * });
 * ```
 */
export function useUnifiedActions<TItem = unknown>(
  options: UseUnifiedActionsOptions<TItem>
): UseUnifiedActionsResult<TItem> {
  const { actions, rowActions: legacyRowActions, cardActions: legacyCardActions, viewMode } = options;

  return useMemo(() => {
    // If no unified actions, use legacy props
    if (!actions) {
      return {
        rowActions: legacyRowActions || {},
        cardActions: legacyCardActions || {},
        primaryAction: null,
        primaryActionKey: null,
        isUnified: false,
      };
    }

    // Transform unified actions to both formats
    const rowActions: RowActionsConfig<TItem> = {};
    const cardActions: CardActionsConfig<TItem> = {};

    for (const [key, action] of Object.entries(actions)) {
      const rowAction = toRowAction(key, action);
      if (rowAction) {
        rowActions[key] = rowAction;
      }

      const cardAction = toCardAction(key, action);
      if (cardAction) {
        cardActions[key] = cardAction;
      }
    }

    // Find primary action for card mode
    const primary = findPrimaryAction(actions);

    return {
      rowActions,
      cardActions,
      primaryAction: primary?.action || null,
      primaryActionKey: primary?.key || null,
      isUnified: true,
    };
  }, [actions, legacyRowActions, legacyCardActions, viewMode]);
}

export default useUnifiedActions;
