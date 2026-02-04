/**
 * SidebarRecent - Display recently visited navigation items
 *
 * Features:
 * - Shows last N visited pages
 * - Integrates with useRecentItems hook
 * - Auto-hides when no items
 * - Clear all button
 *
 * @module primitives/SidebarRecent
 */

'use client';

import * as React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { cn, useRecentItems, type RecentItem } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { useLayoutAdapters, useLayout } from './LayoutContext';

// =============================================================================
// Types
// =============================================================================

export interface SidebarRecentProps {
  /** Maximum items to display (default: 5) */
  maxItems?: number;
  /** localStorage key for persistence */
  storageKey?: string;
  /** Section label */
  label?: string;
  /** Show clear all button (default: true) */
  showClearButton?: boolean;
  /** Paths to exclude from tracking */
  excludePaths?: string[];
  /** Additional CSS class */
  className?: string;
  /** Hide when no items (default: true) */
  hideWhenEmpty?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Display recently visited navigation items in the sidebar.
 *
 * @example
 * ```tsx
 * <SidebarRecent
 *   maxItems={5}
 *   label="Recentes"
 *   excludePaths={['/login', '/logout']}
 * />
 * ```
 */
export function SidebarRecent({
  maxItems = 5,
  storageKey = 'recent-nav-items',
  label = 'Recentes',
  showClearButton = true,
  excludePaths = ['/login', '/logout', '/auth'],
  className,
  hideWhenEmpty = true,
}: SidebarRecentProps) {
  const { renderLink } = useLayoutAdapters();
  const { closeSidebar } = useLayout();

  const { items, removeItem, clearItems } = useRecentItems({
    maxItems,
    storageKey,
    excludePaths,
  });

  // Hide section when empty
  if (hideWhenEmpty && items.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-6', className)}>
      {/* Section Header */}
      <div className="px-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-sidebar-foreground/50" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {label}
          </span>
        </div>

        {showClearButton && items.length > 0 && (
          <button
            onClick={clearItems}
            className={cn(
              'p-1 rounded text-sidebar-foreground/40',
              'hover:text-sidebar-foreground/70 hover:bg-sidebar-accent',
              'transition-colors'
            )}
            aria-label="Clear recent"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Recent Items */}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarRecentItem
            key={item.href}
            item={item}
            onRemove={() => removeItem(item.href)}
            onNavigate={closeSidebar}
            renderLink={renderLink}
          />
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && !hideWhenEmpty && (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-sidebar-foreground/40">
            Nenhum item recente
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Recent Item
// =============================================================================

interface SidebarRecentItemProps {
  item: RecentItem;
  onRemove: () => void;
  onNavigate?: () => void;
  renderLink: ReturnType<typeof useLayoutAdapters>['renderLink'];
}

function SidebarRecentItem({
  item,
  onRemove,
  onNavigate,
  renderLink,
}: SidebarRecentItemProps) {
  const ResolvedIcon = item.icon ? resolveIcon(item.icon) : null;
  const Icon = ResolvedIcon ?? Clock;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  const itemClassName = cn(
    'group relative flex items-center gap-3 px-3 min-h-[40px] py-1.5 rounded-lg',
    'text-sm transition-all duration-150 touch-manipulation',
    'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
  );

  const content = (
    <>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
      <span className="flex-1 truncate text-[13px]">{item.title}</span>

      {/* Remove button - shown on hover */}
      <button
        onClick={handleRemove}
        className={cn(
          'absolute right-2 p-1 rounded',
          'text-sidebar-foreground/40 hover:text-sidebar-foreground/70',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity'
        )}
        aria-label={`Remove ${item.title} from recent`}
      >
        <X className="w-3 h-3" />
      </button>
    </>
  );

  return renderLink({
    item: { href: item.href, title: item.title, icon: item.icon },
    isActive: false,
    className: itemClassName,
    children: content,
    onClick: onNavigate,
  });
}

// =============================================================================
// Hook for tracking navigation
// =============================================================================

export interface UseTrackRecentOptions {
  /** Current page href */
  href: string;
  /** Current page title */
  title: string;
  /** Page icon (PageIconVariant) */
  icon?: string;
  /** Max items to keep */
  maxItems?: number;
  /** Storage key */
  storageKey?: string;
  /** Paths to exclude */
  excludePaths?: string[];
}

/**
 * Hook to track page visits for recent items.
 * Call this in your layout or page component.
 *
 * @example
 * ```tsx
 * function Layout() {
 *   const pathname = usePathname();
 *
 *   useTrackRecent({
 *     href: pathname,
 *     title: document.title,
 *     icon: 'home',
 *   });
 *
 *   return <SidebarRecent />;
 * }
 * ```
 */
export function useTrackRecent({
  href,
  title,
  icon,
  maxItems,
  storageKey,
  excludePaths,
}: UseTrackRecentOptions): void {
  const { addItem } = useRecentItems({
    maxItems,
    storageKey,
    excludePaths,
  });

  React.useEffect(() => {
    if (href && title) {
      addItem({ href, title, icon });
    }
  }, [href, title, icon, addItem]);
}
