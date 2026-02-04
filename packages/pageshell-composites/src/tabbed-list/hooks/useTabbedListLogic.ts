/**
 * useTabbedListLogic Hook
 *
 * Extracted logic from TabbedListPage for better separation of concerns.
 * Handles tab state, data processing, and grouping.
 *
 * @module tabbed-list/hooks/useTabbedListLogic
 */

'use client';

import * as React from 'react';
import { interpolateHref } from '@pageshell/core';
import type { TabbedListTab } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseTabbedListLogicOptions<TData, TItem> {
  // Data
  queryData?: TData;
  getItems: (data: TData) => TItem[];
  keyExtractor: (item: TItem) => string;
  // Tabs
  tabs: TabbedListTab<TItem>[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  // Grouping
  groupBy?: (item: TItem) => string;
  groupOrder?: string[];
  // Item href
  itemHref?: string | ((item: TItem) => string);
}

export interface UseTabbedListLogicReturn<TItem> {
  // Tab state
  activeTab: string;
  handleTabChange: (tabId: string) => void;
  // Data
  items: TItem[];
  tabCounts: Record<string, number>;
  tabItems: Record<string, TItem[]>;
  // Grouping
  groupItems: (items: TItem[]) => Record<string, TItem[]>;
  getGroupKeys: (grouped: Record<string, TItem[]>) => string[];
  // Item href
  resolveItemHref: (item: TItem) => string | undefined;
}

// =============================================================================
// Hook
// =============================================================================

export function useTabbedListLogic<TData = unknown, TItem = Record<string, unknown>>(
  options: UseTabbedListLogicOptions<TData, TItem>
): UseTabbedListLogicReturn<TItem> {
  const {
    queryData,
    getItems,
    tabs,
    defaultTab,
    activeTab: controlledActiveTab,
    onTabChange,
    groupBy,
    groupOrder,
    itemHref,
  } = options;

  // ===========================================================================
  // Tab State
  // ===========================================================================

  const [internalTab, setInternalTab] = React.useState(
    defaultTab ?? tabs[0]?.id ?? ''
  );
  const activeTab = controlledActiveTab ?? internalTab;

  const handleTabChange = React.useCallback(
    (tabId: string) => {
      if (!controlledActiveTab) {
        setInternalTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [controlledActiveTab, onTabChange]
  );

  // ===========================================================================
  // Data Resolution
  // ===========================================================================

  const items = React.useMemo(() => {
    if (!queryData) return [];
    return getItems(queryData);
  }, [queryData, getItems]);

  // Compute tab counts and filtered items
  const { tabCounts, tabItems } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const filtered: Record<string, TItem[]> = {};

    tabs.forEach((tab) => {
      const tabFiltered = tab.filter ? items.filter(tab.filter) : items;
      counts[tab.id] = tabFiltered.length;
      filtered[tab.id] = tabFiltered;
    });

    return { tabCounts: counts, tabItems: filtered };
  }, [items, tabs]);

  // ===========================================================================
  // Item Href Resolution
  // ===========================================================================

  const resolveItemHref = React.useCallback(
    (item: TItem): string | undefined => {
      if (!itemHref) return undefined;
      if (typeof itemHref === 'function') return itemHref(item);
      return interpolateHref(itemHref, item);
    },
    [itemHref]
  );

  // ===========================================================================
  // Grouping
  // ===========================================================================

  const groupItems = React.useCallback(
    (itemsToGroup: TItem[]): Record<string, TItem[]> => {
      if (!groupBy) {
        return { __default: itemsToGroup };
      }

      const grouped: Record<string, TItem[]> = {};
      itemsToGroup.forEach((item) => {
        const key = groupBy(item);
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key]!.push(item);
      });

      return grouped;
    },
    [groupBy]
  );

  const getGroupKeys = React.useCallback(
    (grouped: Record<string, TItem[]>): string[] => {
      if (!groupBy) return ['__default'];

      const keys = Object.keys(grouped);
      if (groupOrder) {
        const ordered = groupOrder.filter((k) => keys.includes(k));
        const extra = keys.filter((k) => !groupOrder.includes(k));
        return [...ordered, ...extra];
      }
      return keys;
    },
    [groupBy, groupOrder]
  );

  return {
    // Tab state
    activeTab,
    handleTabChange,
    // Data
    items,
    tabCounts,
    tabItems,
    // Grouping
    groupItems,
    getGroupKeys,
    // Item href
    resolveItemHref,
  };
}
