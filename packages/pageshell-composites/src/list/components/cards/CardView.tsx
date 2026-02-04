/**
 * CardView Component
 *
 * Internal component for rendering items as cards in ListPage.
 * Used when viewMode is 'cards' or 'auto' (on mobile).
 *
 * @see ADR-0051: ListPage + CardListPage Consolidation
 * @module list/components/cards/CardView
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type {
  CardActionsConfig,
  CardSectionConfig,
  CardSortConfig,
} from '../../types';
import { CardListGrid, CardListSection, CardActionsDropdown } from './index';
import { useCardListLogic } from './useCardListLogic';
import { useCardActions } from './useCardActions';

// =============================================================================
// Types
// =============================================================================

export interface CardViewProps<TItem> {
  /** Items to render */
  items: TItem[];

  /** Render function for each card */
  renderCard: (item: TItem, index: number) => ReactNode;

  /** Card actions configuration */
  cardActions?: CardActionsConfig<TItem>;

  /** Card href for navigation (supports :param interpolation) */
  cardHref?: string | ((item: TItem) => string);

  /** Grid CSS classes */
  gridClassName?: string;

  /** Section configuration for grouped cards */
  sections?: CardSectionConfig<TItem>;

  /** Key extractor */
  keyExtractor: (item: TItem) => string;

  /** Confirm dialog opener */
  onConfirm?: (config: {
    title: string;
    description?: string;
    body?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => Promise<void>;
  }) => void;

  /** Refetch function after mutations */
  refetch?: () => void;

  /** Router for navigation */
  router?: {
    push: (href: string) => void;
  };
}

// =============================================================================
// CardView Component
// =============================================================================

export function CardView<TItem = Record<string, unknown>>({
  items,
  renderCard,
  cardActions,
  cardHref,
  gridClassName = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  sections,
  keyExtractor,
  refetch,
  router,
}: CardViewProps<TItem>) {
  // Navigation helper
  const navigate = React.useCallback(
    (href: string) => {
      if (router) {
        router.push(href);
      } else {
        window.location.href = href;
      }
    },
    [router]
  );

  // Card actions hook
  const {
    confirmState,
    loadingAction,
    handleConfirm,
    closeConfirm,
    buildResolvedActionsForItem,
  } = useCardActions({
    cardActions,
    keyExtractor,
    refetch,
    navigate,
  });

  // Card list logic (sections, href resolution)
  const { sectionedItems, sectionKeys, resolveCardHref } = useCardListLogic({
    sortedItems: items,
    sections,
    cardHref,
    router,
  });

  // Render card item with actions
  const renderCardItem = React.useCallback(
    (item: TItem, index: number) => {
      const href = resolveCardHref(item);
      const resolvedActions = cardActions
        ? buildResolvedActionsForItem(item)
        : [];

      const cardContent = (
        <div className="relative">
          {renderCard(item, index)}
          {resolvedActions.length > 0 && (
            <CardActionsDropdown actions={resolvedActions} />
          )}
        </div>
      );

      if (href) {
        return (
          <Link
            key={keyExtractor(item)}
            to={href}
            className="block transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {cardContent}
          </Link>
        );
      }

      return <div key={keyExtractor(item)}>{cardContent}</div>;
    },
    [
      resolveCardHref,
      renderCard,
      cardActions,
      buildResolvedActionsForItem,
      keyExtractor,
    ]
  );

  // Render sectioned or simple grid
  if (sections?.enabled) {
    return (
      <>
        {sectionKeys.map((sectionKey) => (
          <CardListSection
            key={sectionKey}
            sectionKey={sectionKey}
            items={sectionedItems[sectionKey] ?? []}
            label={sections.sectionLabels[sectionKey] ?? sectionKey}
            icon={sections.sectionIcons?.[sectionKey]}
            iconClassName={sections.sectionIconClassNames?.[sectionKey]}
            labelClassName={sections.sectionLabelClassNames?.[sectionKey]}
            gridClassName={gridClassName}
            renderCard={renderCardItem}
          />
        ))}
      </>
    );
  }

  // Simple grid
  return (
    <CardListGrid
      items={items}
      gridClassName={gridClassName}
      keyExtractor={keyExtractor}
      renderCard={renderCardItem}
    />
  );
}

CardView.displayName = 'CardView';
