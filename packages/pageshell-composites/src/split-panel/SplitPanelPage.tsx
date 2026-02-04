/**
 * SplitPanelPage Composite
 *
 * Pre-built composite for 3-panel master-detail layouts:
 * - Left: Filterable list (conversations, items)
 * - Center: Main content (message thread, details)
 * - Right: Context panel (participant info, actions) - optional
 *
 * Framework-agnostic implementation.
 *
 * @module split-panel/SplitPanelPage
 */

'use client';

import * as React from 'react';
import { cn, interpolateHref } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import { ChevronLeft } from 'lucide-react';

import type { SplitPanelPageProps } from './types';
import { PANEL_WIDTH_CLASSES } from './utils';
import { splitPanelPageDefaults } from './defaults';
import {
  ListPanelSkeleton,
  MainPanelSkeleton,
  SplitPanelEmptyState,
  SplitPanelQueryError,
  SplitPanelContextPanel,
} from './components';
import { useSplitPanelLogic } from './hooks';
import { resolveSplitPanelAriaLabels } from '../shared/types';


// =============================================================================
// SplitPanelPage Component
// =============================================================================

function SplitPanelPageInner<TItem, TDetail = unknown>(
  props: SplitPanelPageProps<TItem, TDetail>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    // Base
    theme = 'admin',
    title,
    description,
    icon,
    className,
    // Selection
    selectedId,
    onSelect,
    // Panels
    list,
    main,
    context,
    // Layout
    minHeight = splitPanelPageDefaults.minHeight,
    stackOnMobile = splitPanelPageDefaults.stackOnMobile,
    mobileBreakpoint = splitPanelPageDefaults.mobileBreakpoint,
    containerVariant = splitPanelPageDefaults.containerVariant,
    // Slots
    slots,
    // i18n
    ariaLabels,
  } = props;

  // Container classes based on variant
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-7xl mx-auto';

  // Resolve ARIA labels with English defaults
  const resolvedAriaLabels = resolveSplitPanelAriaLabels(ariaLabels);

  // Resolve icon
  const Icon = resolveIcon(icon);

  // ---------------------------------------------------------------------------
  // Split Panel Logic Hook
  // ---------------------------------------------------------------------------

  const panelLogic = useSplitPanelLogic({
    selectedId,
    onSelect,
    listData: list.query.data,
    keyExtractor: list.keyExtractor,
    mobileBreakpoint,
    stackOnMobile,
  });

  const {
    isMobile,
    showList,
    announcement,
    handleSelect,
    handleBack,
    handleListKeyDown,
    listKeyExtractor,
  } = panelLogic;
  const listWidth = list.width || 'md';
  const contextWidth = context?.width || 'md';
  const showContext =
    context?.enabled && (!context.showOnlyWithDetail || main.query?.data);

  const resolveItemHref = React.useCallback(
    (item: TItem): string | undefined => {
      if (!list.itemHref) return undefined;
      if (typeof list.itemHref === 'function') return list.itemHref(item);
      return interpolateHref(list.itemHref, item);
    },
    [list.itemHref]
  );

  // ---------------------------------------------------------------------------
  // Slot Resolution
  // ---------------------------------------------------------------------------

  const slotData = React.useMemo(
    () => ({
      items: list.query.data ?? [],
      detail: main.query?.data,
    }),
    [list.query.data, main.query?.data]
  );

  const resolveSlot = React.useCallback(
    <S extends React.ReactNode | ((data: typeof slotData) => React.ReactNode)>(
      slot: S | undefined
    ): React.ReactNode => {
      if (!slot) return null;
      if (typeof slot === 'function') return slot(slotData);
      return slot;
    },
    [slotData]
  );

  // ---------------------------------------------------------------------------
  // Render List Panel
  // ---------------------------------------------------------------------------

  const renderListPanel = () => (
    <div className="h-full flex flex-col">
      {list.header && (
        <div className="border-b border-border p-3 flex-shrink-0">
          {list.header}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {list.query.isLoading ? (
          <div aria-busy="true" aria-live="polite">
            <ListPanelSkeleton rows={list.skeletonRows} />
          </div>
        ) : list.query.error ? (
          <div className="p-4">
            <SplitPanelQueryError error={list.query.error} retry={list.query.refetch} />
          </div>
        ) : !list.query.data?.length ? (
          <div className="p-4 flex items-center justify-center h-full">
            <SplitPanelEmptyState
              icon={list.emptyState?.icon}
              title={list.emptyState?.title || 'No items'}
              description={list.emptyState?.description}
              action={list.emptyState?.action}
            />
          </div>
        ) : (
          <div
            role="listbox"
            aria-label={resolvedAriaLabels.itemsList}
            tabIndex={0}
            onKeyDown={handleListKeyDown}
            className="space-y-1 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {list.query.data.map((item) => {
              const key = listKeyExtractor(item);
              const isSelected = key === selectedId;
              const href = resolveItemHref(item);

              const handleClick = () => {
                if (href) {
                  window.location.href = href;
                } else {
                  handleSelect(key);
                }
              };

              return (
                <div
                  key={key}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={handleClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClick();
                    }
                  }}
                  className={cn(
                    'w-full text-left rounded-lg transition-colors cursor-pointer',
                    isSelected && 'bg-muted'
                  )}
                >
                  {list.renderItem(item, isSelected)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {list.footer && (
        <div className="border-t border-border p-3 flex-shrink-0">
          {list.footer}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render Main Panel
  // ---------------------------------------------------------------------------

  const renderMainPanel = () => {
    if (!selectedId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <SplitPanelEmptyState
            icon={main.emptyState?.icon}
            title={main.emptyState?.title || 'Selecione um item'}
            description={main.emptyState?.description}
          />
        </div>
      );
    }

    if (main.query?.isLoading) {
      return (
        <div aria-busy="true" aria-live="polite" className="h-full">
          {main.skeleton || <MainPanelSkeleton />}
        </div>
      );
    }

    if (main.query?.error) {
      return (
        <div className="p-4">
          <SplitPanelQueryError error={main.query.error} retry={main.query.refetch} />
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto">{main.render(main.query?.data)}</div>
    );
  };

  // ---------------------------------------------------------------------------
  // Mobile Layout
  // ---------------------------------------------------------------------------

  if (isMobile && stackOnMobile) {
    return (
      <div ref={ref} className={cn('min-h-screen', className)} data-theme={theme}>
        {/* Screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
        <div className={cn(containerClasses, 'px-4 py-4 space-y-4')}>
          {/* Header */}
          {!slots?.header && (
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </header>
          )}
          {resolveSlot(slots?.header)}

          {/* Before panels slot */}
          {slots?.beforePanels}

          {/* Mobile view: List or Detail */}
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ minHeight }}>
            {showList ? (
              renderListPanel()
            ) : (
              <div className="h-full flex flex-col">
                <div className="border-b border-border p-3">
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  {main.query?.isLoading ? (
                    <div aria-busy="true" aria-live="polite" className="flex-1">
                      {main.skeleton || <MainPanelSkeleton />}
                    </div>
                  ) : main.query?.error ? (
                    <div className="p-4">
                      <SplitPanelQueryError
                        error={main.query.error}
                        retry={main.query.refetch}
                      />
                    </div>
                  ) : (
                    main.render(main.query?.data)
                  )}
                </div>
              </div>
            )}
          </div>

          {/* After panels slot */}
          {slots?.afterPanels}

          {/* Footer slot */}
          {resolveSlot(slots?.footer)}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop Layout
  // ---------------------------------------------------------------------------

  return (
    <div ref={ref} className={cn('min-h-screen', className)} data-theme={theme}>
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      <div className={cn(containerClasses, 'px-4 py-4 space-y-4')}>
        {/* Header */}
        {!slots?.header && (
          <header className="space-y-1">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </header>
        )}
        {resolveSlot(slots?.header)}

        {/* Before panels slot */}
        {slots?.beforePanels}

        {/* Split Panel Layout */}
        <div className="flex rounded-xl border border-border bg-card overflow-hidden" style={{ minHeight }}>
          {/* List Panel */}
          <div
            className={cn(
              'flex-shrink-0 border-r border-border flex flex-col',
              PANEL_WIDTH_CLASSES[listWidth]
            )}
          >
            {renderListPanel()}
          </div>

          {/* Main Panel */}
          <div
            role="main"
            aria-label={resolvedAriaLabels.mainContent}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderMainPanel()}
          </div>

          {/* Context Panel */}
          {showContext && context && (
            <SplitPanelContextPanel
              title={context.title}
              width={contextWidth}
              collapsible={context.collapsible}
              defaultCollapsed={context.defaultCollapsed}
              ariaLabels={ariaLabels}
            >
              {context.render(main.query?.data)}
            </SplitPanelContextPanel>
          )}
        </div>

        {/* After panels slot */}
        {slots?.afterPanels}

        {/* Footer slot */}
        {resolveSlot(slots?.footer)}
      </div>
    </div>
  );
}

SplitPanelPageInner.displayName = 'SplitPanelPage';

/**
 * SplitPanelPage - 3-panel master-detail layout composite.
 *
 * @example
 * ```tsx
 * <SplitPanelPage
 *   title="Conversations"
 *   selectedId={selectedId}
 *   onSelect={setSelectedId}
 *   list={{
 *     query: conversationsQuery,
 *     renderItem: (item, isSelected) => <ConvoItem {...item} selected={isSelected} />,
 *   }}
 *   main={{
 *     query: detailQuery,
 *     render: (data) => <MessageThread data={data} />,
 *   }}
 * />
 * ```
 */
export const SplitPanelPage = React.forwardRef(SplitPanelPageInner) as <
  TItem,
  TDetail = unknown
>(
  props: SplitPanelPageProps<TItem, TDetail> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement;

(SplitPanelPage as React.FC).displayName = 'SplitPanelPage';
