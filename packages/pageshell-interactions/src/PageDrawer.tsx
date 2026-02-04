'use client';

/**
 * PageDrawer Component
 *
 * A slide-in panel for displaying secondary content, forms, or details.
 * Built on Radix Dialog with structured layout and PageShell integration.
 *
 * @example Basic drawer
 * <PageDrawer
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Detalhes do Curso"
 * >
 *   <CourseDetails course={selectedCourse} />
 * </PageDrawer>
 */

import * as React from 'react';
// NOTE: Uses Radix Dialog directly instead of @pageshell/primitives because:
// - Requires swipe-to-close gesture handling with touch events
// - Custom slide animations per side (left/right)
// - Custom portal handling with theme inheritance
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';
import type { PageShellTheme } from '@pageshell/theme';
import { MODAL_OVERLAY_CLASSES } from '@pageshell/primitives';

// =============================================================================
// Types & Constants
// =============================================================================

export type DrawerSide = 'left' | 'right';

// Local DrawerSize type - extends ModalSize with additional options
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

// Drawer-specific utilities (not yet in @pageshell/primitives)
function getDrawerThemeStyles(): React.CSSProperties {
  return {
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-foreground)',
    borderColor: 'var(--color-border)',
  };
}

const DRAWER_SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl',
  '2xl': 'w-full max-w-2xl',
  full: 'w-full',
};

const DRAWER_SLIDE_ANIMATIONS: Record<DrawerSide, string> = {
  left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right: 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
};

const DRAWER_POSITION_CLASSES: Record<DrawerSide, string> = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
};

/**
 * PageDrawer component props
 */
export interface PageDrawerProps {
  /** Controlled open state */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;

  // Content
  /** Drawer title */
  title: string;
  /** Drawer description */
  description?: string;
  /** Drawer body content */
  children: React.ReactNode;
  /** Drawer footer content */
  footer?: React.ReactNode;

  // Layout
  /** Slide-in side */
  side?: DrawerSide;
  /** Drawer width */
  size?: DrawerSize;

  // Behavior
  /** Disable close on outside click (default: false, i.e., allows closing) */
  disableCloseOnOutsideClick?: boolean;
  /** Disable close on escape key (default: false, i.e., allows closing) */
  disableCloseOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Enable swipe to close on mobile */
  swipeToClose?: boolean;
  /** Swipe threshold in pixels (default: 100) */
  swipeThreshold?: number;

  // Theme
  /** Override theme */
  theme?: PageShellTheme;

  // Accessibility
  /** Accessible label (uses title by default) */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes for content */
  className?: string;
  /** Additional CSS classes for overlay */
  overlayClassName?: string;
}

/**
 * PageDrawer.Header props
 */
export interface PageDrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageDrawer.Body props
 */
export interface PageDrawerBodyProps {
  children: React.ReactNode;
  className?: string;
  /** Disable default padding */
  noPadding?: boolean;
}

/**
 * PageDrawer.Footer props
 */
export interface PageDrawerFooterProps {
  children: React.ReactNode;
  className?: string;
  /** Footer alignment */
  align?: 'left' | 'center' | 'right' | 'between';
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * PageDrawer.Header - Structured header section
 */
function PageDrawerHeader({ children, className }: PageDrawerHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 px-6 py-4 border-b border-border',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageDrawer.Body - Scrollable content area
 */
function PageDrawerBody({ children, className, noPadding = false }: PageDrawerBodyProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        !noPadding && 'px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageDrawer.Footer - Action buttons area
 */
function PageDrawerFooter({
  children,
  className,
  align = 'right',
}: PageDrawerFooterProps) {
  const alignClasses: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/30',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// PageDrawer Component
// =============================================================================

const PageDrawerRoot = React.forwardRef<HTMLDivElement, PageDrawerProps>(function PageDrawerRoot({
  open,
  onOpenChange,
  // Content
  title,
  description,
  children,
  footer,
  // Layout
  side = 'right',
  size = 'md',
  // Behavior
  disableCloseOnOutsideClick = false,
  disableCloseOnEscape = false,
  showCloseButton = true,
  swipeToClose = true,
  swipeThreshold = 100,
  // Theme - we may use this later for theme-specific styling
  // theme,
  // Accessibility
  ariaLabel,
  testId,
  className,
  overlayClassName,
}, ref) {
  // Resolve behavior props
  const shouldCloseOnOutsideClick = !disableCloseOnOutsideClick;
  const shouldCloseOnEscape = !disableCloseOnEscape;

  // Try to get context, but don't fail if not available
  let contextConfig;
  try {
    const context = usePageShellContext();
    contextConfig = context.config;
  } catch {
    // Context not available, use defaults
    contextConfig = null;
  }

  // Swipe handling state
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  // Handle touch start
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!swipeToClose) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [swipeToClose]);

  // Handle touch move
  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!swipeToClose || !touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    // Determine if swipe is in the correct direction to close
    const isValidSwipe =
      (side === 'right' && deltaX > 0) ||
      (side === 'left' && deltaX < 0);

    if (isValidSwipe) {
      setIsSwiping(true);
      setSwipeOffset(Math.abs(deltaX));
    }
  }, [swipeToClose, side]);

  // Handle touch end
  const handleTouchEnd = React.useCallback(() => {
    if (!swipeToClose || !isSwiping) {
      touchStartRef.current = null;
      return;
    }

    // If swipe is beyond threshold, close the drawer
    if (swipeOffset >= swipeThreshold) {
      onOpenChange(false);
    }

    // Reset state
    touchStartRef.current = null;
    setSwipeOffset(0);
    setIsSwiping(false);
  }, [swipeToClose, isSwiping, swipeOffset, swipeThreshold, onOpenChange]);

  // Calculate transform based on swipe
  const swipeTransform = React.useMemo(() => {
    if (!isSwiping || swipeOffset === 0) return undefined;
    const direction = side === 'right' ? 1 : -1;
    return `translateX(${direction * swipeOffset}px)`;
  }, [isSwiping, swipeOffset, side]);

  // Handle pointer down outside
  const handlePointerDownOutside = (e: Event) => {
    if (!shouldCloseOnOutsideClick) {
      e.preventDefault();
    }
  };

  // Handle escape key
  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (!shouldCloseOnEscape) {
      e.preventDefault();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className={cn(MODAL_OVERLAY_CLASSES, overlayClassName)} />

        {/* Content */}
        <DialogPrimitive.Content
          ref={ref}
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={handleEscapeKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label={ariaLabel ?? title}
          data-testid={testId}
          style={{
            ...getDrawerThemeStyles(),
            transform: swipeTransform,
            transition: isSwiping ? 'none' : undefined,
          }}
          className={cn(
            // Base
            'fixed inset-y-0 flex flex-col',
            'bg-background border-border shadow-xl',
            // Size
            DRAWER_SIZE_CLASSES[size],
            // Position
            DRAWER_POSITION_CLASSES[side],
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-300 data-[state=open]:duration-300',
            DRAWER_SLIDE_ANIMATIONS[side],
            // Focus
            'focus:outline-none',
            // Touch
            'touch-pan-y',
            className
          )}
        >
          {/* Swipe indicator for mobile */}
          {swipeToClose && (
            <div
              className="flex justify-center py-2 sm:hidden touch-none"
              aria-hidden="true"
            >
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
          )}

          {/* Header */}
          <PageDrawerHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showCloseButton && (
                <DialogPrimitive.Close
                  className={cn(
                    'flex-shrink-0 p-2 -m-2 rounded-md',
                    'text-muted-foreground hover:text-foreground',
                    'hover:bg-muted transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
            </div>
          </PageDrawerHeader>

          {/* Body */}
          <PageDrawerBody>{children}</PageDrawerBody>

          {/* Footer */}
          {footer && <PageDrawerFooter>{footer}</PageDrawerFooter>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

PageDrawerRoot.displayName = 'PageDrawer';

// =============================================================================
// Compound Component Export
// =============================================================================

/**
 * PageDrawer with compound components for custom layouts
 */
export const PageDrawer = Object.assign(PageDrawerRoot, {
  Header: PageDrawerHeader,
  Body: PageDrawerBody,
  Footer: PageDrawerFooter,
});
