/**
 * CollapsibleSidebar - Sidebar with expand/collapse functionality
 *
 * Features:
 * - Expanded mode (w-64): Full sidebar with text
 * - Collapsed mode (w-16): Icons only with tooltips
 * - Auto mode: Collapsed by default, expands on hover
 * - Smooth transitions with GPU acceleration
 *
 * @module primitives/CollapsibleSidebar
 */

'use client';

import * as React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  cn,
  useSidebarCollapse,
  useRouteCollapseConfig,
  type SidebarMode,
  type SidebarCollapseConfig,
} from '@pageshell/core';
import { Tooltip, TooltipTrigger, TooltipContent } from '@pageshell/primitives';
import { useLayout } from './LayoutContext';

// =============================================================================
// Types
// =============================================================================

export interface CollapsibleSidebarProps {
  children: React.ReactNode;
  /** Initial mode (default: 'expanded') */
  defaultMode?: SidebarMode;
  /** Enable collapse toggle button (default: true) */
  showToggle?: boolean;
  /** Position of toggle button (default: 'header') */
  togglePosition?: 'header' | 'edge';
  /** localStorage key for persisting preference */
  storageKey?: string;
  /** Additional CSS class */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Callback when mode changes */
  onModeChange?: (mode: SidebarMode) => void;
  /** Current pathname for route-based collapse */
  pathname?: string;
  /** Route-based collapse configuration */
  routeConfig?: Partial<SidebarCollapseConfig>;
}

export interface CollapsibleContextValue {
  isCollapsed: boolean;
  mode: SidebarMode;
  toggle: () => void;
  showToggle: boolean;
  togglePosition: 'header' | 'edge';
}

// =============================================================================
// Context
// =============================================================================

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null
);

/**
 * Hook to access collapsible sidebar state.
 */
export function useCollapsibleSidebar(): CollapsibleContextValue {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      'useCollapsibleSidebar must be used within CollapsibleSidebar'
    );
  }
  return context;
}

/**
 * Optional hook that returns null if not in CollapsibleSidebar context.
 */
export function useCollapsibleSidebarOptional(): CollapsibleContextValue | null {
  return React.useContext(CollapsibleContext);
}

// =============================================================================
// Component
// =============================================================================

/**
 * Collapsible sidebar with expand/collapse functionality.
 *
 * @example
 * ```tsx
 * <CollapsibleSidebar defaultMode="expanded" showToggle>
 *   <CollapsibleSidebar.Header>
 *     <SidebarBrand brand={brand} />
 *   </CollapsibleSidebar.Header>
 *   <CollapsibleSidebar.Content>
 *     <CollapsibleSidebarNav sections={sections} />
 *   </CollapsibleSidebar.Content>
 *   <CollapsibleSidebar.Footer>
 *     <UserMenu user={user} />
 *   </CollapsibleSidebar.Footer>
 * </CollapsibleSidebar>
 * ```
 */
export function CollapsibleSidebar({
  children,
  defaultMode = 'expanded',
  showToggle = true,
  togglePosition = 'header',
  storageKey = 'sidebar-mode',
  className,
  'aria-label': ariaLabel = 'Navigation',
  onModeChange,
  pathname,
  routeConfig,
}: CollapsibleSidebarProps) {
  const { isSidebarOpen, closeSidebar } = useLayout();
  const sidebarRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Route-based collapse config
  const { isDefaultCollapsedRoute, shouldUseStoredPreference } = useRouteCollapseConfig({
    pathname: pathname ?? '',
    config: routeConfig,
  });

  // Determine effective default mode based on route
  const effectiveDefaultMode = pathname && isDefaultCollapsedRoute ? 'collapsed' : defaultMode;

  const {
    mode,
    isCollapsed,
    toggle,
    temporarilyExpand,
    restoreTemporary,
    widthClass,
  } = useSidebarCollapse({
    defaultMode: effectiveDefaultMode,
    storageKey,
    persist: shouldUseStoredPreference,
    onModeChange,
  });

  // Handle Escape key to close drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, closeSidebar]);

  // Context value
  const contextValue = React.useMemo<CollapsibleContextValue>(
    () => ({
      isCollapsed,
      mode,
      toggle,
      showToggle,
      togglePosition,
    }),
    [isCollapsed, mode, toggle, showToggle, togglePosition]
  );

  return (
    <CollapsibleContext.Provider value={contextValue}>
      {/* Desktop Sidebar - Fixed with collapse */}
      <div
        className={cn(
          'hidden md:block flex-shrink-0 transition-all duration-300',
          widthClass
        )}
        onMouseEnter={mode === 'auto' ? temporarilyExpand : undefined}
        onMouseLeave={mode === 'auto' ? restoreTemporary : undefined}
      >
        <aside
          ref={sidebarRef}
          role="navigation"
          aria-label={ariaLabel}
          className={cn(
            'fixed top-0 left-0 h-screen flex flex-col',
            'bg-sidebar border-r border-sidebar-border',
            'transition-all duration-300 ease-out',
            widthClass,
            className
          )}
          style={{
            willChange: 'width',
          }}
        >
          {children}

          {/* Collapse toggle button - edge position */}
          {showToggle && togglePosition === 'edge' && (
            <button
              onClick={toggle}
              className={cn(
                'absolute -right-3 top-20 z-10',
                'flex h-6 w-6 items-center justify-center rounded-full',
                'bg-sidebar border border-sidebar-border',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                'shadow-md hover:shadow-lg',
                'transition-all duration-200 hover:scale-110'
              )}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-3 h-3" />
              ) : (
                <PanelLeftClose className="w-3 h-3" />
              )}
            </button>
          )}
        </aside>
      </div>

      {/* Mobile Drawer - Same as regular Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          'transition-opacity duration-300',
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-[var(--overlay-light)] backdrop-blur-sm',
            'transition-opacity duration-300'
          )}
          style={{
            opacity: isSidebarOpen ? 1 : 0,
            willChange: isSidebarOpen ? 'opacity' : 'auto',
          }}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          role="navigation"
          aria-label={ariaLabel}
          aria-modal="true"
          className={cn(
            'absolute top-0 left-0 h-full w-72 flex flex-col',
            'bg-sidebar border-r border-sidebar-border',
            'shadow-2xl',
            'transition-transform duration-300 ease-out',
            className
          )}
          style={{
            willChange: isSidebarOpen ? 'transform' : 'auto',
            transform: isSidebarOpen
              ? 'translate3d(0, 0, 0)'
              : 'translate3d(-100%, 0, 0)',
          }}
        >
          {children}
        </aside>
      </div>
    </CollapsibleContext.Provider>
  );
}

// =============================================================================
// Collapsible Sidebar Parts
// =============================================================================

export interface CollapsibleSidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Toggle button component for header position.
 */
function HeaderToggleButton() {
  const { isCollapsed, toggle, showToggle, togglePosition } = useCollapsibleSidebar();

  if (!showToggle || togglePosition !== 'header') {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'text-sidebar-foreground/60 hover:text-sidebar-foreground',
            'hover:bg-sidebar-accent',
            'transition-colors duration-150',
            'flex-shrink-0'
          )}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Header section that adapts to collapsed state.
 * Includes toggle button when togglePosition is 'header'.
 * Children (like SidebarBrand) handle their own collapsed state.
 */
export function CollapsibleSidebarHeader({
  children,
  className,
}: CollapsibleSidebarHeaderProps) {
  const { isCollapsed, togglePosition } = useCollapsibleSidebar();

  return (
    <div
      className={cn(
        'flex-shrink-0 border-b border-sidebar-border',
        'transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-4',
        className
      )}
    >
      {togglePosition === 'header' ? (
        <div className={cn(
          'flex items-center gap-2',
          isCollapsed ? 'flex-col' : 'justify-between'
        )}>
          {/* Children (e.g., SidebarBrand) handle their own collapsed state */}
          <div className={cn('min-w-0', !isCollapsed && 'flex-1')}>
            {children}
          </div>
          <HeaderToggleButton />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export interface CollapsibleSidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Scrollable content area that adapts to collapsed state.
 */
export function CollapsibleSidebarContent({
  children,
  className,
}: CollapsibleSidebarContentProps) {
  const { isCollapsed } = useCollapsibleSidebar();

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent',
        'hover:scrollbar-thumb-sidebar-foreground/30',
        'transition-all duration-300',
        isCollapsed ? 'py-2 px-1' : 'py-4 px-3',
        className
      )}
      style={{ scrollbarWidth: 'thin' }}
    >
      {children}
    </div>
  );
}

export interface CollapsibleSidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Footer section that adapts to collapsed state.
 */
export function CollapsibleSidebarFooter({
  children,
  className,
}: CollapsibleSidebarFooterProps) {
  const { isCollapsed } = useCollapsibleSidebar();

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-sidebar-border',
        'transition-all duration-300',
        isCollapsed ? 'p-1' : 'p-3',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Collapsible Nav Item (with tooltip)
// =============================================================================

export interface CollapsibleNavItemProps {
  /** Navigation href */
  href: string;
  /** Display title */
  title: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Whether this item is active */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Badge content */
  badge?: number | 'new';
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Render prop for link wrapper */
  renderLink?: (props: {
    href: string;
    children: React.ReactNode;
    className: string;
    onClick?: () => void;
  }) => React.ReactNode;
}

/**
 * Navigation item that shows tooltip when sidebar is collapsed.
 */
export function CollapsibleNavItem({
  href,
  title,
  icon,
  isActive = false,
  onClick,
  badge,
  disabled = false,
  className,
  renderLink,
}: CollapsibleNavItemProps) {
  const context = useCollapsibleSidebarOptional();
  const isCollapsed = context?.isCollapsed ?? false;

  const itemClassName = cn(
    'group relative flex items-center gap-3 rounded-lg',
    'text-sm font-medium transition-all duration-150 touch-manipulation',
    isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 min-h-[44px] py-2',
    disabled && 'opacity-50 pointer-events-none',
    isActive
      ? 'bg-sidebar-primary/10 text-sidebar-primary'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
    // Active indicator
    isActive && !isCollapsed && 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
    isActive && !isCollapsed && 'before:h-5 before:w-[3px] before:rounded-full before:bg-sidebar-primary',
    // Hover effect
    !disabled && 'hover:translate-x-0.5 active:translate-x-0 hover:shadow-sm',
    className
  );

  const content = (
    <>
      <span className={cn('flex-shrink-0', isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]')}>
        {icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{title}</span>
          {badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                badge === 'new'
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground min-w-[20px] text-center'
              )}
            >
              {badge === 'new' ? 'Novo' : badge}
            </span>
          )}
        </>
      )}
    </>
  );

  const linkProps = {
    href,
    className: itemClassName,
    onClick,
    children: content,
  };

  // Wrap in tooltip when collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {renderLink ? (
            renderLink(linkProps)
          ) : (
            <a {...linkProps}>{content}</a>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <span>{title}</span>
          {badge !== undefined && (
            <span className="ml-2 text-xs opacity-70">
              {badge === 'new' ? 'Novo' : badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return renderLink ? renderLink(linkProps) : <a {...linkProps}>{content}</a>;
}

// =============================================================================
// Compound Component Pattern
// =============================================================================

CollapsibleSidebar.Header = CollapsibleSidebarHeader;
CollapsibleSidebar.Content = CollapsibleSidebarContent;
CollapsibleSidebar.Footer = CollapsibleSidebarFooter;
CollapsibleSidebar.NavItem = CollapsibleNavItem;
