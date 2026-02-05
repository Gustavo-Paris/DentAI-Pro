'use client';

/**
 * PageSplit Component
 *
 * A master-detail layout with optional resizable divider.
 * Responsive: stacks vertically on mobile.
 *
 * @example Basic master-detail
 * <PageSplit
 *   master={<ItemsList items={items} onSelect={setSelected} />}
 *   detail={<ItemDetail item={selected} />}
 * />
 *
 * @example Resizable with custom sizes
 * <PageSplit
 *   master={<Sidebar />}
 *   detail={<Content />}
 *   resizable
 *   defaultSize={25}
 *   minSize={15}
 *   maxSize={40}
 * />
 *
 * @example Collapsible sidebar
 * <PageSplit
 *   master={<Navigation />}
 *   detail={<MainContent />}
 *   collapsible
 *   collapsed={isSidebarCollapsed}
 *   onCollapsedChange={setIsSidebarCollapsed}
 * />
 *
 * @example Vertical split
 * <PageSplit
 *   direction="vertical"
 *   master={<TopPanel />}
 *   detail={<BottomPanel />}
 *   defaultSize={40}
 * />
 */

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen, GripVertical, GripHorizontal } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/** Split direction */
export type PageSplitDirection = 'horizontal' | 'vertical';

/**
 * PageSplit component props
 */
export interface PageSplitProps {
  /** Master panel content (left/top) */
  master: ReactNode;
  /** Detail panel content (right/bottom) */
  detail: ReactNode;

  // Layout
  /** Split direction */
  direction?: PageSplitDirection;
  /** Default master size (percentage) */
  defaultSize?: number;
  /** Minimum master size (percentage) */
  minSize?: number;
  /** Maximum master size (percentage) */
  maxSize?: number;

  // Behavior
  /** Enable resize handle */
  resizable?: boolean;
  /** Enable collapse toggle */
  collapsible?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Collapsed state change handler */
  onCollapsedChange?: (collapsed: boolean) => void;

  // Responsive
  /** Stack panels on mobile */
  stackOnMobile?: boolean;
  /** Mobile breakpoint (px) */
  mobileBreakpoint?: number;

  // Persistence
  /** LocalStorage key for size */
  persistKey?: string;

  // Accessibility
  /** Master panel label */
  masterLabel?: string;
  /** Detail panel label */
  detailLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Master panel CSS classes */
  masterClassName?: string;
  /** Detail panel CSS classes */
  detailClassName?: string;
}

// =============================================================================
// Constants
// =============================================================================

const COLLAPSED_SIZE = 0;

// =============================================================================
// Utility Functions
// =============================================================================

function getPersistedSize(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(`page-split:${key}`);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return defaultValue;
}

function persistSize(key: string, size: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`page-split:${key}`, String(size));
  } catch {
    // Ignore
  }
}

// =============================================================================
// PageSplit Component
// =============================================================================

export function PageSplit({
  master,
  detail,
  // Layout
  direction = 'horizontal',
  defaultSize = 30,
  minSize = 15,
  maxSize = 50,
  // Behavior
  resizable = false,
  collapsible = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  // Responsive
  stackOnMobile = true,
  mobileBreakpoint = 768,
  // Persistence
  persistKey,
  // Accessibility
  masterLabel = 'Master panel',
  detailLabel = 'Detail panel',
  testId,
  className,
  masterClassName,
  detailClassName,
}: PageSplitProps) {
  // State - always initialize with defaultSize to avoid hydration mismatch.
  // localStorage will be read in useEffect after hydration.
  const [size, setSize] = useState(defaultSize);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pos: number; size: number } | null>(null);
  const isHydratedRef = useRef(false);

  // Restore persisted size from localStorage AFTER hydration
  useEffect(() => {
    if (persistKey) {
      const stored = getPersistedSize(persistKey, defaultSize);
      if (stored !== defaultSize) {
        setSize(stored);
      }
    }
    isHydratedRef.current = true;
  }, [persistKey, defaultSize]);

  // Collapsed state (controlled or uncontrolled)
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!resizable || isMobile) return;

      e.preventDefault();
      const pos = 'touches' in e
        ? (direction === 'horizontal' ? e.touches[0]!.clientX : e.touches[0]!.clientY)
        : (direction === 'horizontal' ? e.clientX : e.clientY);

      dragStartRef.current = { pos, size };
      setIsDragging(true);
    },
    [resizable, isMobile, direction, size]
  );

  // Handle double-click to reset size
  const handleDoubleClick = useCallback(() => {
    if (!resizable || isMobile) return;

    // Reset to default size
    setSize(defaultSize);

    if (persistKey) {
      persistSize(persistKey, defaultSize);
    }
  }, [resizable, isMobile, defaultSize, persistKey]);

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragStartRef.current) return;

      const pos = 'touches' in e
        ? (direction === 'horizontal' ? e.touches[0]!.clientX : e.touches[0]!.clientY)
        : (direction === 'horizontal' ? e.clientX : e.clientY);

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;
      const delta = pos - dragStartRef.current.pos;
      const deltaPercent = (delta / containerSize) * 100;
      const newSize = Math.min(maxSize, Math.max(minSize, dragStartRef.current.size + deltaPercent));

      setSize(newSize);
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;

      if (persistKey) {
        persistSize(persistKey, size);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, direction, minSize, maxSize, persistKey, size]);

  // Keyboard resize handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!resizable || isCollapsed || isMobile) return;

      const step = e.shiftKey ? 5 : 1; // Larger step with Shift
      let newSize = size;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newSize = Math.max(minSize, size - step);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newSize = Math.min(maxSize, size + step);
          break;
        case 'Home':
          e.preventDefault();
          newSize = minSize;
          break;
        case 'End':
          e.preventDefault();
          newSize = maxSize;
          break;
        default:
          return;
      }

      setSize(newSize);
      if (persistKey) {
        persistSize(persistKey, newSize);
      }
    },
    [resizable, isCollapsed, isMobile, size, minSize, maxSize, persistKey]
  );

  // Toggle collapsed
  const handleToggleCollapsed = () => {
    setCollapsed(!isCollapsed);
  };

  // Determine layout
  const isHorizontal = direction === 'horizontal';
  const shouldStack = stackOnMobile && isMobile;
  const effectiveSize = isCollapsed ? COLLAPSED_SIZE : size;

  // Size styles
  const masterStyle: React.CSSProperties = shouldStack
    ? {}
    : isHorizontal
      ? { width: `${effectiveSize}%`, minWidth: isCollapsed ? 0 : undefined }
      : { height: `${effectiveSize}%`, minHeight: isCollapsed ? 0 : undefined };

  const detailStyle: React.CSSProperties = shouldStack
    ? {}
    : isHorizontal
      ? { width: `${100 - effectiveSize}%` }
      : { height: `${100 - effectiveSize}%` };

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full overflow-hidden',
        shouldStack ? 'flex-col' : isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
      data-testid={testId}
    >
      {/* Master panel */}
      <div
        role="region"
        aria-label={masterLabel}
        style={masterStyle}
        className={cn(
          'relative overflow-auto transition-all duration-200',
          isCollapsed && 'overflow-hidden',
          shouldStack && 'flex-shrink-0',
          masterClassName
        )}
      >
        {!isCollapsed && master}

        {/* Collapse toggle (inside master when collapsed) */}
        {collapsible && isCollapsed && !shouldStack && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapsed}
              aria-label="Expand panel"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Resize handle / Divider */}
      {!shouldStack && (
        <div
          className={cn(
            'group relative flex items-center justify-center flex-shrink-0',
            'bg-border',
            isHorizontal ? 'w-px' : 'h-px',
            resizable && !isCollapsed && 'cursor-col-resize hover:bg-primary/50',
            resizable && !isCollapsed && !isHorizontal && 'cursor-row-resize',
            resizable && !isCollapsed && 'focus-visible:bg-primary/50 focus-visible:outline-none',
            isDragging && 'bg-primary'
          )}
          onMouseDown={resizable && !isCollapsed ? handleDragStart : undefined}
          onTouchStart={resizable && !isCollapsed ? handleDragStart : undefined}
          onDoubleClick={resizable && !isCollapsed ? handleDoubleClick : undefined}
          onKeyDown={resizable && !isCollapsed ? handleKeyDown : undefined}
          tabIndex={resizable && !isCollapsed ? 0 : undefined}
          role={resizable ? 'separator' : undefined}
          aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={resizable ? Math.round(size) : undefined}
          aria-valuemin={resizable ? minSize : undefined}
          aria-valuemax={resizable ? maxSize : undefined}
          aria-label={resizable && !isCollapsed ? 'Resize panel. Use arrow keys to adjust.' : undefined}
          title={resizable && !isCollapsed ? 'Double-click to reset. Use arrow keys to adjust.' : undefined}
        >
          {/* Grip icon */}
          {resizable && !isCollapsed && (
            <div
              className={cn(
                'absolute flex items-center justify-center rounded-full bg-muted border border-border',
                'opacity-0 hover:opacity-100 group-focus-visible:opacity-100 transition-opacity',
                isDragging && 'opacity-100',
                isHorizontal ? 'w-4 h-8 -ml-[7px]' : 'h-4 w-8 -mt-[7px]'
              )}
            >
              {isHorizontal ? (
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              ) : (
                <GripHorizontal className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Collapse button */}
          {collapsible && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapsed}
              className={cn(
                'absolute z-10 h-6 w-6 rounded-full bg-background border border-border shadow-sm',
                isHorizontal ? '-right-3' : '-bottom-3'
              )}
              aria-label="Collapse panel"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Detail panel */}
      <div
        role="region"
        aria-label={detailLabel}
        style={detailStyle}
        className={cn(
          'relative flex-1 overflow-auto',
          detailClassName
        )}
      >
        {detail}
      </div>
    </div>
  );
}

PageSplit.displayName = 'PageSplit';
