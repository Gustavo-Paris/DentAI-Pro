/**
 * QuickSwitch Primitive
 *
 * Quick switch link for switching between portals (e.g., "View as Student").
 * Shows icon-only with tooltip when collapsed.
 *
 * @module primitives/QuickSwitch
 */

'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@pageshell/core';
import { resolveIcon, Tooltip, TooltipTrigger, TooltipContent } from '@pageshell/primitives';
import { useLayout, useLayoutAdapters } from './LayoutContext';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';
import type { QuickSwitchConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface QuickSwitchProps extends QuickSwitchConfig {
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Quick switch link for sidebar footer.
 * Shows icon-only with tooltip when collapsed.
 *
 * @example
 * ```tsx
 * <QuickSwitch
 *   label="View as Student"
 *   href="/student/dashboard"
 *   icon="graduation-cap"
 *   badge="New"
 * />
 * ```
 */
export function QuickSwitch({
  label,
  href,
  icon,
  badge,
  className,
}: QuickSwitchProps) {
  const { closeSidebar } = useLayout();
  const { renderLink } = useLayoutAdapters();
  const collapsible = useCollapsibleSidebarOptional();
  const isCollapsed = collapsible?.isCollapsed ?? false;

  const Icon = icon ? resolveIcon(icon) : null;

  // Collapsed: icon-only with tooltip
  if (isCollapsed) {
    const collapsedContent = (
      <>
        {Icon && <Icon className="w-5 h-5" />}
      </>
    );

    const linkElement = renderLink({
      item: { title: label, href, icon },
      isActive: false,
      className: cn(
        'flex items-center justify-center p-2.5 rounded-lg',
        'text-sidebar-foreground/70',
        'hover:bg-sidebar-accent hover:text-sidebar-foreground',
        'transition-colors touch-manipulation',
        className
      ),
      children: collapsedContent,
      onClick: closeSidebar,
    });

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkElement}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <span>{label}</span>
          {badge && (
            <span className="ml-2 text-xs opacity-70">{badge}</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded: full content
  const content = (
    <>
      {Icon && <Icon className="w-[18px] h-[18px]" />}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-primary/10 text-sidebar-primary font-medium">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 opacity-50" />
    </>
  );

  return renderLink({
    item: { title: label, href, icon },
    isActive: false,
    className: cn(
      'flex items-center gap-3 px-3 min-h-[44px] py-2 rounded-lg',
      'text-sm text-sidebar-foreground/70',
      'hover:bg-sidebar-accent hover:text-sidebar-foreground',
      'transition-colors touch-manipulation',
      className
    ),
    children: content,
    onClick: closeSidebar,
  });
}
