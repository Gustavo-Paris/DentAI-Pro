/**
 * Card Actions Hook
 *
 * Manages card action state, confirmation dialogs, and action execution.
 *
 * @see ADR-0051: ListPage + CardListPage Consolidation
 * @module list/components/cards/useCardActions
 */

'use client';

import * as React from 'react';
import { interpolateHref } from '@pageshell/core';
import type { CardActionConfig } from '../../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Resolved card action for dropdown rendering
 */
export interface ResolvedCardAction {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

interface UseCardActionsOptions<TItem> {
  /** Card actions configuration */
  cardActions?: Record<string, CardActionConfig<TItem>>;
  /** Key extractor for items */
  keyExtractor: (item: TItem) => string;
  /** Refetch callback after mutation */
  refetch?: () => void;
  /** Navigation function */
  navigate: (href: string) => void;
}

interface ConfirmState<TItem> {
  isOpen: boolean;
  item: TItem | null;
  action: (CardActionConfig<TItem> & { key: string }) | null;
}

export interface UseCardActionsReturn<TItem> {
  /** Current confirm dialog state */
  confirmState: ConfirmState<TItem>;
  /** Currently loading action key */
  loadingAction: string | null;
  /** Handle card action click */
  handleCardAction: (actionKey: string, item: TItem) => Promise<void>;
  /** Handle confirm dialog confirmation */
  handleConfirm: () => Promise<void>;
  /** Close confirm dialog */
  closeConfirm: () => void;
  /** Build resolved actions for a specific item */
  buildResolvedActionsForItem: (item: TItem) => ResolvedCardAction[];
  /** Resolved card actions */
  resolvedCardActions: Array<CardActionConfig<TItem> & { key: string }>;
}

// =============================================================================
// Hook
// =============================================================================

export function useCardActions<TItem>({
  cardActions,
  keyExtractor,
  refetch,
  navigate,
}: UseCardActionsOptions<TItem>): UseCardActionsReturn<TItem> {
  const [confirmState, setConfirmState] = React.useState<ConfirmState<TItem>>({
    isOpen: false,
    item: null,
    action: null,
  });

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  // Resolve card actions
  const resolvedCardActions = React.useMemo(() => {
    if (!cardActions) return [];
    return Object.entries(cardActions).map(([key, config]) => ({
      key,
      ...config,
    }));
  }, [cardActions]);

  // Handle card action click
  const handleCardAction = React.useCallback(
    async (actionKey: string, item: TItem) => {
      const action = resolvedCardActions.find((a) => a.key === actionKey);
      if (!action) return;

      // Navigation
      if (action.href) {
        const href =
          typeof action.href === 'function'
            ? action.href(item)
            : interpolateHref(action.href, item);
        navigate(href);
        return;
      }

      // Confirmation required
      if (action.confirm) {
        setConfirmState({
          isOpen: true,
          item,
          action: action as CardActionConfig<TItem> & { key: string },
        });
        return;
      }

      // Direct mutation
      if (action.mutation) {
        setLoadingAction(actionKey);
        try {
          const input = action.mutationInput
            ? action.mutationInput(item)
            : keyExtractor(item);
          await action.mutation.mutateAsync(input);

          if (action.successHref) {
            const href =
              typeof action.successHref === 'function'
                ? action.successHref(item)
                : interpolateHref(action.successHref, item);
            navigate(href);
          }

          refetch?.();
        } catch {
          // Error handling (can be extended)
        } finally {
          setLoadingAction(null);
        }
        return;
      }

      // Custom onClick
      if (action.onClick) {
        action.onClick(item);
      }
    },
    [resolvedCardActions, keyExtractor, refetch, navigate]
  );

  // Handle confirm dialog
  const handleConfirm = React.useCallback(async () => {
    if (!confirmState.action || !confirmState.item) return;

    const action = confirmState.action;
    const item = confirmState.item;

    if (action.mutation) {
      setLoadingAction(action.key);
      try {
        const input = action.mutationInput
          ? action.mutationInput(item)
          : keyExtractor(item);
        await action.mutation.mutateAsync(input);

        setConfirmState({ isOpen: false, item: null, action: null });

        if (action.successHref) {
          const href =
            typeof action.successHref === 'function'
              ? action.successHref(item)
              : interpolateHref(action.successHref, item);
          navigate(href);
        }

        refetch?.();
      } catch {
        // Error handling
      } finally {
        setLoadingAction(null);
      }
    }
  }, [confirmState, keyExtractor, refetch, navigate]);

  // Close confirm dialog
  const closeConfirm = React.useCallback(() => {
    setConfirmState({ isOpen: false, item: null, action: null });
  }, []);

  // Build resolved actions for a specific item
  const buildResolvedActionsForItem = React.useCallback(
    (item: TItem): ResolvedCardAction[] => {
      return resolvedCardActions
        .filter((action) => {
          if (action.showWhen && !action.showWhen(item)) return false;
          return true;
        })
        .map((action) => ({
          key: action.key,
          label: action.label,
          icon: action.icon,
          variant: action.variant,
          disabled: action.disabledWhen?.(item) ?? false,
          loading: loadingAction === action.key,
          onClick: () => handleCardAction(action.key, item),
        }));
    },
    [resolvedCardActions, loadingAction, handleCardAction]
  );

  return {
    confirmState,
    loadingAction,
    handleCardAction,
    handleConfirm,
    closeConfirm,
    buildResolvedActionsForItem,
    resolvedCardActions,
  };
}
