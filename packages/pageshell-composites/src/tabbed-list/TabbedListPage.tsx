/**
 * TabbedListPage Composite
 *
 * Declarative list page with tabs that filter or group items.
 * Framework-agnostic implementation.
 *
 * @module tabbed-list/TabbedListPage
 *
 * @example
 * ```tsx
 * import { TabbedListPage } from '@repo/pageshell-composites';
 *
 * function NotificationsPage() {
 *   const query = api.notifications.list.useQuery();
 *
 *   return (
 *     <TabbedListPage
 *       title="Notifications"
 *       description="Manage your notifications"
 *       query={query}
 *       tabs={[
 *         { id: 'all', label: 'All', icon: 'bell' },
 *         { id: 'unread', label: 'Unread', filter: (n) => !n.read, badgeVariant: 'destructive' },
 *         { id: 'read', label: 'Read', filter: (n) => n.read },
 *       ]}
 *       renderItem={(notification) => (
 *         <div className="p-4 flex items-center gap-3">
 *           <div className="flex-1">
 *             <p className="font-medium">{notification.title}</p>
 *             <p className="text-sm text-muted-foreground">{notification.message}</p>
 *           </div>
 *         </div>
 *       )}
 *       itemHref="/notifications/:id"
 *       headerAction={<Button>Mark all read</Button>}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  resolveIcon,
} from '@pageshell/primitives';

import type { TabbedListPageProps } from './types';
import { resolveDescription } from '../shared/types';
import { tabbedListPageDefaults as DEFAULTS } from './utils';
import { getContainerClasses } from '../shared/styles';
import { extractArrayFromData, defaultKeyExtractor } from '../shared/utils';
import {
  TabbedListSkeleton,
  TabbedListEmptyState,
  DefaultGroupHeader,
} from './components';
import { useTabbedListLogic } from './hooks';

// =============================================================================
// TabbedListPage Component
// =============================================================================

export function TabbedListPage<
  TData = unknown,
  TItem = Record<string, unknown>,
>(props: TabbedListPageProps<TData, TItem>) {
  const {
    // Base
    theme = 'default',
    title,
    description,
    label,
    className,
    // Data
    query,
    getItems = extractArrayFromData,
    keyExtractor = defaultKeyExtractor,
    // Tabs
    tabs,
    defaultTab,
    activeTab: controlledActiveTab,
    onTabChange,
    tabListClassName,
    // Grouping
    groupBy,
    groupLabels = {},
    groupOrder,
    // Rendering
    renderItem,
    renderGroupHeader,
    itemHref,
    // Header
    headerAction,
    // Empty States
    emptyState,
    emptyFilteredState,
    // Skeleton
    skeleton,
    // Layout
    containerVariant = DEFAULTS.containerVariant,
    wrapInCard = DEFAULTS.wrapInCard,
    cardVariant = 'default',
    listClassName = DEFAULTS.listClassName,
    groupClassName = DEFAULTS.groupClassName,
    // Slots
    slots,
  } = props;

  // ---------------------------------------------------------------------------
  // Logic Hook
  // ---------------------------------------------------------------------------

  const {
    activeTab,
    handleTabChange,
    items,
    tabCounts,
    tabItems,
    groupItems,
    getGroupKeys,
    resolveItemHref,
  } = useTabbedListLogic<TData, TItem>({
    queryData: query.data,
    getItems,
    keyExtractor,
    tabs,
    defaultTab,
    activeTab: controlledActiveTab,
    onTabChange,
    groupBy,
    groupOrder,
    itemHref,
  });

  // ---------------------------------------------------------------------------
  // Render Item With Link
  // ---------------------------------------------------------------------------

  const renderItemWithLink = React.useCallback(
    (item: TItem, index: number) => {
      const href = resolveItemHref(item);
      const itemContent = renderItem(item, index);

      if (href) {
        return (
          <a
            href={href}
            className="block transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {itemContent}
          </a>
        );
      }

      return itemContent;
    },
    [resolveItemHref, renderItem]
  );

  // ---------------------------------------------------------------------------
  // Render Header Action
  // ---------------------------------------------------------------------------

  const renderHeaderAction = React.useCallback((): React.ReactNode => {
    if (!headerAction) return null;

    if (typeof headerAction === 'function') {
      return query.data ? headerAction(query.data) : null;
    }

    return headerAction;
  }, [headerAction, query.data]);

  // ---------------------------------------------------------------------------
  // Container Classes (defined early for loading state)
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-7xl mx-auto';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query.isLoading) {
    return (
      <div className={cn(containerClasses, className)} data-theme={theme}>
        {skeleton ?? <TabbedListSkeleton />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State (No Data)
  // ---------------------------------------------------------------------------

  if (items.length === 0) {
    const empty = { ...DEFAULTS.emptyState, ...emptyState };
    return (
      <div className={cn(containerClasses, classes.container, className)} data-theme={theme}>
        <div className={cn(classes.card, containerVariant === 'card' && 'border border-border')}>
          <div className={classes.header}>
            <div className="flex items-center justify-between">
              <div>
                {label && (
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                )}
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{resolveDescription(description, query.data)}</p>
                )}
              </div>
              {renderHeaderAction()}
            </div>
          </div>
          <div className={classes.content}>
            <TabbedListEmptyState
              title={empty.title ?? DEFAULTS.emptyState.title}
              description={empty.description}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Tab Content
  // ---------------------------------------------------------------------------

  const renderTabContent = (tabId: string) => {
    const currentItems = tabItems[tabId] ?? [];
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

                {wrapInCard ? (
                  <div className={cn('rounded-lg border border-border bg-card', listClassName)}>
                    <div role="list">
                      {groupItemsList.map((item, index) => (
                        <div key={keyExtractor(item)} role="listitem">
                          {renderItemWithLink(item, index)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div role="list" className={listClassName}>
                    {groupItemsList.map((item, index) => (
                      <div key={keyExtractor(item)} role="listitem">
                        {renderItemWithLink(item, index)}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    // Non-grouped rendering
    if (wrapInCard) {
      return (
        <div className={cn('rounded-lg border border-border bg-card', listClassName)}>
          <div role="list">
            {currentItems.map((item, index) => (
              <div key={keyExtractor(item)} role="listitem">
                {renderItemWithLink(item, index)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div role="list" className={listClassName}>
        {currentItems.map((item, index) => (
          <div key={keyExtractor(item)} role="listitem">
            {renderItemWithLink(item, index)}
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={cn(containerClasses, classes.container, className)} data-theme={theme}>
      <div className={cn(classes.card, containerVariant === 'card' && 'border border-border')}>
        {/* Header Section */}
        <div className={classes.header}>
          <div className="flex items-center justify-between">
            <div>
              {label && (
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
              )}
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{resolveDescription(description, query.data)}</p>
              )}
            </div>
            {renderHeaderAction()}
          </div>

          {/* Header slot */}
          {slots?.header &&
            (typeof slots.header === 'function'
              ? query.data ? slots.header(query.data) : null
              : slots.header)}
        </div>

        {/* Content Section */}
        <div className={classes.content}>
          {/* Before tabs slot */}
          {slots?.beforeTabs}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className={cn('mb-6', tabListClassName)}>
              {tabs.map((tab) => {
                const Icon = resolveIcon(tab.icon);

                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {tab.label}
                    {tab.showBadge !== false && tabCounts[tab.id] !== undefined && (
                      <Badge
                        variant={
                          tab.badgeVariant ??
                          (tab.id === activeTab ? 'default' : 'secondary')
                        }
                        className="ml-1"
                      >
                        {tabCounts[tab.id]}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* After tabs slot */}
            {slots?.afterTabs}

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {/* Before list slot */}
                {slots?.beforeList}

                {renderTabContent(tab.id)}

                {/* After list slot */}
                {slots?.afterList}
              </TabsContent>
            ))}
          </Tabs>

          {/* Footer slot */}
          {slots?.footer &&
            (typeof slots.footer === 'function'
              ? query.data ? slots.footer(query.data) : null
              : slots.footer)}
        </div>
      </div>
    </div>
  );
}

TabbedListPage.displayName = 'TabbedListPage';
