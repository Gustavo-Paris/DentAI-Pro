/**
 * SidebarNav Primitive
 *
 * Navigation list for sidebar with sections, icons, and badges.
 * Uses render props for framework-agnostic link rendering.
 * Hides section labels when collapsed.
 *
 * @module primitives/SidebarNav
 */

'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@pageshell/core';
import { useLayout } from './LayoutContext';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';
import { SidebarNavItem } from './SidebarNavItem';
import type { NavSection } from '../types';

// Re-export for backwards compatibility
export { SidebarNavItem } from './SidebarNavItem';
export type { SidebarNavItemProps } from './SidebarNavItem';

// =============================================================================
// Types
// =============================================================================

export interface SidebarNavProps {
  /** Navigation sections */
  sections: NavSection[];
  /** Additional CSS class */
  className?: string;
}

export interface SidebarNavSectionProps {
  /** Section configuration */
  section: NavSection;
  /** Section index (for key generation) */
  index: number;
  /** Callback when navigating (closes sidebar on mobile) */
  onNavigate?: () => void;
}

// =============================================================================
// NavSection Component - Memoized
// =============================================================================

/**
 * Custom comparison for SidebarNavSection memoization.
 */
function areSectionPropsEqual(
  prevProps: SidebarNavSectionProps,
  nextProps: SidebarNavSectionProps
): boolean {
  const prevSection = prevProps.section;
  const nextSection = nextProps.section;

  // Check section properties
  if (
    prevSection.label !== nextSection.label ||
    prevSection.collapsible !== nextSection.collapsible ||
    prevSection.defaultCollapsed !== nextSection.defaultCollapsed ||
    prevProps.index !== nextProps.index ||
    prevProps.onNavigate !== nextProps.onNavigate
  ) {
    return false;
  }

  // Check items array length
  if (prevSection.items.length !== nextSection.items.length) {
    return false;
  }

  // Check each item (shallow comparison of key properties)
  for (let i = 0; i < prevSection.items.length; i++) {
    const prevItem = prevSection.items[i]!;
    const nextItem = nextSection.items[i]!;

    if (
      prevItem.href !== nextItem.href ||
      prevItem.title !== nextItem.title ||
      prevItem.icon !== nextItem.icon ||
      prevItem.badge !== nextItem.badge ||
      prevItem.disabled !== nextItem.disabled
    ) {
      return false;
    }
  }

  return true;
}

export const SidebarNavSection = React.memo(function SidebarNavSection({
  section,
  index,
  onNavigate,
}: SidebarNavSectionProps) {
  const [isSectionCollapsed, setIsSectionCollapsed] = React.useState(
    section.defaultCollapsed ?? false
  );
  const collapsible = useCollapsibleSidebarOptional();
  const isSidebarCollapsed = collapsible?.isCollapsed ?? false;

  const handleToggle = React.useCallback(() => {
    if (section.collapsible) {
      setIsSectionCollapsed((prev) => !prev);
    }
  }, [section.collapsible]);

  return (
    <div className={cn(
      // Reduce spacing when sidebar is collapsed
      index > 0 ? (isSidebarCollapsed ? 'mt-2' : 'mt-6') : ''
    )}>
      {/* Section label - hidden when sidebar is collapsed */}
      {section.label && !isSidebarCollapsed && (
        <div
          className={cn(
            'px-3 mb-2 flex items-center justify-between',
            section.collapsible && 'cursor-pointer select-none'
          )}
          onClick={handleToggle}
          role={section.collapsible ? 'button' : undefined}
          aria-expanded={section.collapsible ? !isSectionCollapsed : undefined}
        >
          <span className="text-[length:var(--sidebar-section-label)] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {section.label}
          </span>
          {section.collapsible && (
            <ChevronDown
              className={cn(
                'w-3 h-3 text-sidebar-foreground/50 transition-transform',
                isSectionCollapsed && '-rotate-90'
              )}
            />
          )}
        </div>
      )}

      {/* Separator line when sidebar is collapsed */}
      {section.label && isSidebarCollapsed && index > 0 && (
        <div className="h-px bg-sidebar-border mx-2 mb-2" />
      )}

      {!isSectionCollapsed && (
        <div className="space-y-1">
          {section.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}, areSectionPropsEqual);

SidebarNavSection.displayName = 'SidebarNavSection';

// =============================================================================
// SidebarNav Component
// =============================================================================

/**
 * Navigation list for sidebar.
 *
 * @example
 * ```tsx
 * <SidebarNav
 *   sections={[
 *     {
 *       label: "Menu",
 *       items: [
 *         { title: "Dashboard", href: "/dashboard", icon: "home" },
 *         { title: "Settings", href: "/settings", icon: "settings" },
 *       ],
 *     },
 *   ]}
 * />
 * ```
 */
export function SidebarNav({ sections, className }: SidebarNavProps) {
  const { closeSidebar } = useLayout();

  // Memoize the navigation callback
  const handleNavigate = React.useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  return (
    <nav className={className}>
      {sections.map((section, index) => (
        <SidebarNavSection
          key={section.label ?? index}
          section={section}
          index={index}
          onNavigate={handleNavigate}
        />
      ))}
    </nav>
  );
}

SidebarNav.Section = SidebarNavSection;
SidebarNav.Item = SidebarNavItem;
