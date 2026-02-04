/**
 * useCardListLogic Hook
 *
 * Extracted logic from CardListPage for better separation of concerns.
 * Handles data resolution, sections, and navigation.
 *
 * @module card-list/hooks/useCardListLogic
 */

'use client';

import * as React from 'react';
import { interpolateHref } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface SectionsConfig<TItem> {
  enabled: boolean;
  getSectionKey: (item: TItem) => string;
  sectionLabels: Record<string, string>;
  sectionOrder?: string[];
  sectionIcons?: Record<string, string>;
  sectionIconClassNames?: Record<string, string>;
  sectionLabelClassNames?: Record<string, string>;
}

export interface UseCardListLogicOptions<TItem, TData> {
  // Data (optional - can use sortedItems directly)
  query?: { data?: TData; isLoading?: boolean };
  directItems?: TItem[];
  directIsLoading?: boolean;
  getItems?: (data: TData) => TItem[];
  // Sorted items from useListLogic (used for sections)
  sortedItems: TItem[];
  // Sections
  sections?: SectionsConfig<TItem>;
  // Card href
  cardHref?: string | ((item: TItem) => string);
  // Router
  router?: { push: (url: string) => void };
}

export interface UseCardListLogicReturn<TItem> {
  // Data
  items: TItem[];
  isLoading: boolean;
  // Sections
  sectionedItems: Record<string, TItem[]>;
  sectionKeys: string[];
  // Navigation
  navigate: (href: string) => void;
  resolveCardHref: (item: TItem) => string | undefined;
}

// =============================================================================
// Hook
// =============================================================================

export function useCardListLogic<TItem = Record<string, unknown>, TData = unknown>(
  options: UseCardListLogicOptions<TItem, TData>
): UseCardListLogicReturn<TItem> {
  const {
    query,
    directItems,
    directIsLoading,
    getItems,
    sortedItems,
    sections,
    cardHref,
    router,
  } = options;

  // ===========================================================================
  // Data Resolution
  // ===========================================================================

  const items = React.useMemo(() => {
    if (directItems) return directItems;
    if (query?.data && getItems) return getItems(query.data);
    return [];
  }, [directItems, query?.data, getItems]);

  const isLoading = directIsLoading ?? query?.isLoading ?? false;

  // ===========================================================================
  // Navigation
  // ===========================================================================

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

  const resolveCardHref = React.useCallback(
    (item: TItem): string | undefined => {
      if (!cardHref) return undefined;
      if (typeof cardHref === 'function') return cardHref(item);
      return interpolateHref(cardHref, item);
    },
    [cardHref]
  );

  // ===========================================================================
  // Sections
  // ===========================================================================

  const sectionedItems = React.useMemo(() => {
    if (!sections?.enabled) {
      return { __default: sortedItems };
    }

    const grouped: Record<string, TItem[]> = {};
    sortedItems.forEach((item) => {
      const sectionKey = sections.getSectionKey(item);
      if (!grouped[sectionKey]) {
        grouped[sectionKey] = [];
      }
      grouped[sectionKey]!.push(item);
    });

    return grouped;
  }, [sortedItems, sections]);

  const sectionKeys = React.useMemo(() => {
    if (!sections?.enabled) return ['__default'];

    const keys = Object.keys(sectionedItems);
    if (sections.sectionOrder) {
      const ordered = sections.sectionOrder.filter((k) => keys.includes(k));
      const extra = keys.filter((k) => !sections.sectionOrder!.includes(k));
      return [...ordered, ...extra];
    }

    return keys;
  }, [sectionedItems, sections]);

  return {
    // Data
    items,
    isLoading,
    // Sections
    sectionedItems,
    sectionKeys,
    // Navigation
    navigate,
    resolveCardHref,
  };
}
