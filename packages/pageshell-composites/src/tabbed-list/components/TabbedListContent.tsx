/**
 * TabbedListPage Content
 *
 * Tab content area with list rendering for each tab.
 * Handles grouped and non-grouped rendering with empty states.
 *
 * @module tabbed-list/components/TabbedListContent
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { TabsContent } from '@pageshell/primitives';
import type { TabbedListTab } from '../types';
import { TabbedListEmptyState, DefaultGroupHeader } from './TabbedListStates';
import { tabbedListPageDefaults as DEFAULTS } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface TabbedListContentProps<TItem> {
  /** Tab configurations */
  tabs: TabbedListTab<TItem>[];
  /** Get items for a specific tab ID */
  getTabItems: (tabId: string) => TItem[];
  /** Key extractor for items */
  keyExtractor: (item: TItem) => string;
  /** Render function for each item */
  renderItem: (item: TItem, index: number) => React.ReactNode;
  /** Empty filtered state configuration */
  emptyFilteredState?: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
  };
  /** Group items by key */
  groupBy?: (item: TItem) => string;
  /** Get grouped items from item list */
  groupItems: (items: TItem[]) => Record<string, TItem[]>;
  /** Get ordered group keys */
  getGroupKeys: (grouped: Record<string, TItem[]>) => string[];
  /** Group labels map */
  groupLabels?: Record<string, string>;
  /** Group section className */
  groupClassName?: string;
  /** Custom group header renderer */
  renderGroupHeader?: (
    groupKey: string,
    label: string,
    items: TItem[]
  ) => React.ReactNode;
  /** Wrap items in card */
  wrapInCard?: boolean;
  /** List className */
  listClassName?: string;
  /** Slots */
  slots?: {
    beforeList?: React.ReactNode;
    afterList?: React.ReactNode;
  };
}

// =============================================================================
// Sub-Components
// =============================================================================

interface ItemListProps<TItem> {
  items: TItem[];
  keyExtractor: (item: TItem) => string;
  renderItem: (item: TItem, index: number) => React.ReactNode;
  wrapInCard: boolean;
  listClassName?: string;
}

const ItemList = React.memo(function ItemList<TItem>({
  items,
  keyExtractor,
  renderItem,
  wrapInCard,
  listClassName,
}: ItemListProps<TItem>) {
  if (wrapInCard) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', listClassName)}>
        <div role="list">
          {items.map((item, index) => (
            <div key={keyExtractor(item)} role="listitem">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div role="list" className={listClassName}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)} role="listitem">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}) as <TItem>(props: ItemListProps<TItem>) => React.ReactElement;

// =============================================================================
// Component
// =============================================================================

function TabbedListContentInner<TItem>(
  props: TabbedListContentProps<TItem>
): React.ReactElement {
  const {
    tabs,
    getTabItems,
    keyExtractor,
    renderItem,
    emptyFilteredState,
    groupBy,
    groupItems,
    getGroupKeys,
    groupLabels = {},
    groupClassName = DEFAULTS.groupClassName,
    renderGroupHeader,
    wrapInCard = DEFAULTS.wrapInCard,
    listClassName = DEFAULTS.listClassName,
    slots,
  } = props;

  const renderTabContent = React.useCallback(
    (tabId: string) => {
      const currentItems = getTabItems(tabId);
      const groupedItems = groupItems(currentItems);
      const groupKeys = getGroupKeys(groupedItems);

      // Empty filtered state
      if (currentItems.length === 0) {
        const emptyFiltered = {
          ...DEFAULTS.emptyFilteredState,
          ...emptyFilteredState,
        };
        return (
          <TabbedListEmptyState
            title={emptyFiltered.title}
            description={emptyFiltered.description}
            icon={emptyFiltered.icon}
          />
        );
      }

      // Grouped rendering
      if (groupBy) {
        return (
          <div className="space-y-6">
            {groupKeys.map((groupKey) => {
              const groupItemsList = groupedItems[groupKey] ?? [];
              if (groupItemsList.length === 0) return null;

              const groupLabel = groupLabels[groupKey] ?? groupKey;
              const groupHeadingId = `group-heading-${groupKey}`;

              return (
                <section
                  key={groupKey}
                  className={groupClassName}
                  aria-labelledby={renderGroupHeader ? undefined : groupHeadingId}
                >
                  {renderGroupHeader ? (
                    renderGroupHeader(groupKey, groupLabel, groupItemsList)
                  ) : (
                    <DefaultGroupHeader
                      id={groupHeadingId}
                      label={groupLabel}
                      count={groupItemsList.length}
                    />
                  )}

                  <ItemList
                    items={groupItemsList}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    wrapInCard={wrapInCard}
                    listClassName={listClassName}
                  />
                </section>
              );
            })}
          </div>
        );
      }

      // Non-grouped rendering
      return (
        <ItemList
          items={currentItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          wrapInCard={wrapInCard}
          listClassName={listClassName}
        />
      );
    },
    [
      getTabItems,
      groupItems,
      getGroupKeys,
      emptyFilteredState,
      groupBy,
      groupLabels,
      groupClassName,
      renderGroupHeader,
      keyExtractor,
      renderItem,
      wrapInCard,
      listClassName,
    ]
  );

  return (
    <>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {/* Before list slot */}
          {slots?.beforeList}

          {renderTabContent(tab.id)}

          {/* After list slot */}
          {slots?.afterList}
        </TabsContent>
      ))}
    </>
  );
}

/**
 * Tab content renderer for TabbedListPage.
 *
 * Renders content for each tab with support for:
 * - Grouped and non-grouped lists
 * - Card wrapping
 * - Empty filtered states
 * - Custom group headers
 * - Before/after list slots
 */
export const TabbedListContent = React.memo(
  TabbedListContentInner
) as typeof TabbedListContentInner;

// Add displayName for DevTools
(TabbedListContent as React.FC).displayName = 'TabbedListContent';
