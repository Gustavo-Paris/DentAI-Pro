/**
 * SidebarBrand Primitive
 *
 * Brand header for sidebar with icon, title, and subtitle.
 * Collapses to icon-only when inside CollapsibleSidebar.
 *
 * @module primitives/SidebarBrand
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, Tooltip, TooltipTrigger, TooltipContent } from '@pageshell/primitives';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';
import type { BrandConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface SidebarBrandProps extends BrandConfig {
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Brand header component for sidebar.
 * Automatically collapses to icon-only when inside CollapsibleSidebar.
 *
 * @example
 * ```tsx
 * <SidebarBrand
 *   icon="sparkles"
 *   title="Creator Portal"
 *   subtitle="Manage your courses"
 *   href="/creator-portal"
 * />
 * ```
 */
export function SidebarBrand({
  icon,
  title,
  subtitle,
  href,
  onClick,
  className,
}: SidebarBrandProps) {
  const Icon = resolveIcon(icon);
  const collapsible = useCollapsibleSidebarOptional();
  const isCollapsed = collapsible?.isCollapsed ?? false;

  // Collapsed: icon only with tooltip
  if (isCollapsed) {
    const iconContent = (
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-sidebar-primary',
          'transition-all duration-200'
        )}
      >
        {Icon && <Icon className="w-5 h-5 text-sidebar-primary-foreground" />}
      </div>
    );

    const wrappedIcon = href ? (
      <a href={href} onClick={onClick} className="block">
        {iconContent}
      </a>
    ) : onClick ? (
      <button type="button" onClick={onClick} className="block">
        {iconContent}
      </button>
    ) : (
      iconContent
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex justify-center', className)}>
            {wrappedIcon}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div>
            <div className="font-semibold">{title}</div>
            {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded: full brand with icon, title, and subtitle
  const content = (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-sidebar-primary'
        )}
      >
        {Icon && <Icon className="w-5 h-5 text-sidebar-primary-foreground" />}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-sidebar-foreground/60">{subtitle}</p>
        )}
      </div>
    </div>
  );

  // If href provided, wrap in anchor
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cn(
          'block hover:opacity-80 transition-opacity',
          className
        )}
      >
        {content}
      </a>
    );
  }

  // If onClick provided, wrap in button
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'block text-left hover:opacity-80 transition-opacity',
          className
        )}
      >
        {content}
      </button>
    );
  }

  // Otherwise just render content
  return <div className={className}>{content}</div>;
}
