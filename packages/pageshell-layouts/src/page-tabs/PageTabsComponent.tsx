/**
 * PageTabs Component
 *
 * Renders a tabbed interface within a PageShell.
 * Supports multiple variants, orientations, and controlled/uncontrolled modes.
 *
 * @package @pageshell/layouts
 *
 * @example Basic (uncontrolled)
 * <PageTabs defaultTab="overview">
 *   <PageTab id="overview" label="Visão Geral" icon={BarChart3}>
 *     <OverviewContent />
 *   </PageTab>
 *   <PageTab id="settings" label="Configurações" icon={Settings}>
 *     <SettingsContent />
 *   </PageTab>
 * </PageTabs>
 *
 * @example Controlled
 * <PageTabs value={activeTab} onChange={setActiveTab}>
 *   <PageTab id="tab1" label="Tab 1">Content 1</PageTab>
 *   <PageTab id="tab2" label="Tab 2">Content 2</PageTab>
 * </PageTabs>
 *
 * @example Underline variant
 * <PageTabs defaultTab="overview" variant="underline">
 *   <PageTab id="overview" label="Visão Geral">...</PageTab>
 *   <PageTab id="analytics" label="Análises">...</PageTab>
 * </PageTabs>
 */

'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  Children,
  isValidElement,
} from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import { usePageShellContextOptional } from '@pageshell/theme';
import { resolveIcon } from '@pageshell/primitives';
import { sizeConfig, contentAnimationClasses } from './constants';
import { getTabListClasses, getTabButtonClasses } from './utils';
import { TabBadge } from './components';
import { PageTab } from './PageTab';
import type { PageTabsProps, PageTabProps, TabDefinition } from './types';

// =============================================================================
// PageTabs Component
// =============================================================================

export const PageTabs = React.forwardRef<HTMLDivElement, PageTabsProps>(
  function PageTabs(
    {
      defaultTab,
      value,
      onChange,
      children,
      variant = 'pills',
      orientation = 'horizontal',
      size = 'md',
      fullWidth = false,
      animated = true,
      lazy = false,
      className,
      tabListClassName,
      contentClassName,
    },
    ref
  ) {
    // Determine if controlled
    const isControlled = value !== undefined;

    // Internal state for uncontrolled mode
    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || '');

    // Active tab (controlled or uncontrolled)
    const activeTab = isControlled ? value : internalActiveTab;

    // Track which tabs have been visited (for lazy loading)
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
      new Set(activeTab ? [activeTab] : [])
    );

    // Refs for keyboard navigation
    const tabListRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Optional context - PageTabs can work outside PageShell with fallbacks
    const context = usePageShellContextOptional();

    // Fallback config for when used outside PageShell
    const animateClass = context?.config.animate ?? 'portal-animate-in';
    const delayClass = context?.config.animateDelay(1) ?? 'portal-animate-in-delay-1';

    // Extract tab definitions from children
    const tabs = useMemo(() => {
      const result: TabDefinition[] = [];
      Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type === PageTab) {
          const props = child.props as PageTabProps;
          result.push({
            id: props.id,
            label: props.label,
            icon: props.icon,
            badge: props.badge,
            badgeVariant: props.badgeVariant,
            disabled: props.disabled,
            content: props.children,
          });
        }
      });
      return result;
    }, [children]);

    // Set initial tab if not set
    useEffect(() => {
      if (!activeTab && tabs.length > 0) {
        const firstEnabled = tabs.find((t) => !t.disabled);
        if (firstEnabled) {
          if (isControlled) {
            onChange?.(firstEnabled.id);
          } else {
            setInternalActiveTab(firstEnabled.id);
          }
        }
      }
    }, [activeTab, tabs, isControlled, onChange]);

    // Handle tab change
    const handleTabChange = useCallback(
      (tabId: string) => {
        const tab = tabs.find((t) => t.id === tabId);
        if (tab?.disabled) return;

        if (isControlled) {
          onChange?.(tabId);
        } else {
          setInternalActiveTab(tabId);
        }

        // Mark tab as visited for lazy loading
        setVisitedTabs((prev) => new Set([...prev, tabId]));
      },
      [isControlled, onChange, tabs]
    );

    // Memoized handler for tab selection - stable reference per tabId
    const { getHandler: getTabHandler } = useHandlerMap((tabId: string) => {
      handleTabChange(tabId);
    });

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabledTabs = tabs.filter((t) => !t.disabled);
        const currentIndex = enabledTabs.findIndex((t) => t.id === activeTab);

        let nextIndex: number | null = null;

        const isHorizontal = orientation === 'horizontal';
        const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

        switch (e.key) {
          case prevKey:
            e.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
            break;
          case nextKey:
            e.preventDefault();
            nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
            break;
          case 'Home':
            e.preventDefault();
            nextIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            nextIndex = enabledTabs.length - 1;
            break;
        }

        if (nextIndex !== null) {
          const nextTab = enabledTabs[nextIndex];
          if (nextTab) {
            handleTabChange(nextTab.id);
            // Focus the tab button
            tabRefs.current.get(nextTab.id)?.focus();
          }
        }
      },
      [tabs, activeTab, orientation, handleTabChange]
    );

    // Get active tab content
    const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

    // Render content (with lazy loading support)
    const renderContent = () => {
      if (lazy) {
        // Only render tabs that have been visited
        return tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const hasBeenVisited = visitedTabs.has(tab.id);

          if (!hasBeenVisited) return null;

          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`tabpanel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={!isActive}
              className={cn(
                isActive && animated && contentAnimationClasses,
                contentClassName
              )}
            >
              {tab.content}
            </div>
          );
        });
      }

      // Non-lazy: only render active content
      return (
        <div
          key={activeTab}
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className={cn(animated && contentAnimationClasses, contentClassName)}
        >
          {activeTabContent}
        </div>
      );
    };

    // Container classes based on orientation
    const containerClasses = cn(
      animateClass,
      delayClass,
      orientation === 'vertical' && 'flex gap-6',
      className
    );

    return (
      <div ref={ref} className={containerClasses}>
        {/* Tab Navigation */}
        <div
          ref={tabListRef}
          className={cn(
            getTabListClasses(variant, orientation, fullWidth),
            orientation === 'vertical' && 'flex-shrink-0',
            tabListClassName
          )}
          role="tablist"
          aria-orientation={orientation}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = resolveIcon(tab.icon);

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                }}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                aria-disabled={tab.disabled}
                tabIndex={isActive ? 0 : -1}
                disabled={tab.disabled}
                onClick={getTabHandler(tab.id)}
                className={getTabButtonClasses(variant, size, isActive, !!tab.disabled, fullWidth)}
              >
                {Icon && <Icon className={sizeConfig[size].iconSize} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <TabBadge badge={tab.badge} variant={tab.badgeVariant} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          className={cn(
            orientation === 'vertical' ? 'flex-1 min-w-0' : 'mt-4',
            orientation === 'horizontal' && variant === 'underline' && 'mt-3'
          )}
        >
          {renderContent()}
        </div>
      </div>
    );
  }
);

PageTabs.displayName = 'PageTabs';
