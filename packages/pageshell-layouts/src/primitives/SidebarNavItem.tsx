/**
 * SidebarNavItem - Memoized navigation item for sidebar
 *
 * Extracted for better tree-shaking and memoization.
 * Supports collapsed mode with icon-only display and tooltip.
 *
 * @module primitives/SidebarNavItem
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, Tooltip, TooltipTrigger, TooltipContent } from '@pageshell/primitives';
import { useLayoutAdapters } from './LayoutContext';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';
import type { NavItem } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface SidebarNavItemProps {
  /** Navigation item */
  item: NavItem;
  /** Close sidebar on click (mobile) */
  onNavigate?: () => void;
}

// =============================================================================
// NavItemContent - Memoized inner content
// =============================================================================

interface NavItemContentProps {
  item: NavItem;
  isCollapsed?: boolean;
}

const NavItemContent = React.memo(function NavItemContent({
  item,
  isCollapsed = false,
}: NavItemContentProps) {
  const Icon = item.icon ? resolveIcon(item.icon) : null;

  // Collapsed: icon only (larger for touch targets)
  if (isCollapsed) {
    return (
      <>
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      </>
    );
  }

  // Expanded: full content
  return (
    <>
      {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
      <span className="flex-1 truncate">{item.title}</span>

      {/* Badge */}
      {item.badge !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
            item.badge === 'new'
              ? 'bg-success text-success-foreground'
              : 'bg-primary text-primary-foreground min-w-[20px] text-center'
          )}
        >
          {item.badge === 'new' ? 'Novo' : item.badge}
        </span>
      )}

      {/* External link indicator */}
      {item.external && (
        <svg
          className="w-3 h-3 text-sidebar-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </>
  );
});

// Custom comparison for NavItemContent
NavItemContent.displayName = 'NavItemContent';

// =============================================================================
// SidebarNavItem - Memoized with custom comparison
// =============================================================================

/**
 * Custom comparison function for SidebarNavItem memoization.
 * Only re-renders when relevant props change.
 */
function areNavItemPropsEqual(
  prevProps: SidebarNavItemProps,
  nextProps: SidebarNavItemProps
): boolean {
  // Compare item properties that affect rendering
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;

  return (
    prevItem.href === nextItem.href &&
    prevItem.title === nextItem.title &&
    prevItem.icon === nextItem.icon &&
    prevItem.badge === nextItem.badge &&
    prevItem.disabled === nextItem.disabled &&
    prevItem.external === nextItem.external &&
    prevItem.exact === nextItem.exact &&
    // onNavigate is usually a stable callback from useCallback
    prevProps.onNavigate === nextProps.onNavigate
  );
}

/**
 * Memoized sidebar navigation item.
 *
 * Uses custom comparison to prevent unnecessary re-renders
 * when parent components update.
 * Automatically shows tooltip when collapsed.
 */
export const SidebarNavItem = React.memo(function SidebarNavItem({
  item,
  onNavigate,
}: SidebarNavItemProps) {
  const { renderLink, isActive } = useLayoutAdapters();
  const collapsible = useCollapsibleSidebarOptional();
  const isCollapsed = collapsible?.isCollapsed ?? false;
  const active = isActive(item.href, item.exact);

  const itemClassName = cn(
    'group relative flex items-center rounded-lg',
    'text-sm font-medium transition-all duration-150 touch-manipulation',
    // Collapsed: centered icon, larger touch target
    isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 min-h-[44px] py-2',
    item.disabled && 'opacity-50 pointer-events-none',
    active
      ? 'bg-sidebar-primary/10 text-sidebar-primary'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
    // Active indicator: left border (only when expanded)
    active && !isCollapsed && 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
    active && !isCollapsed && 'before:h-5 before:w-[3px] before:rounded-full before:bg-sidebar-primary',
    // Hover effect: subtle lift
    !item.disabled && 'hover:translate-x-0.5 active:translate-x-0',
    // Shadow on hover
    !item.disabled && 'hover:shadow-sm'
  );

  const linkElement = renderLink({
    item,
    isActive: active,
    className: itemClassName,
    children: <NavItemContent item={item} isCollapsed={isCollapsed} />,
    onClick: onNavigate,
  });

  // Wrap in tooltip when collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkElement}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <span>{item.title}</span>
          {item.badge !== undefined && (
            <span className="ml-2 text-xs opacity-70">
              {item.badge === 'new' ? 'Novo' : item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkElement;
}, areNavItemPropsEqual);

SidebarNavItem.displayName = 'SidebarNavItem';
