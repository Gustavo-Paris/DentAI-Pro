'use client';

/**
 * BottomSheet - Mobile Bottom Sheet Primitive
 *
 * A mobile-first bottom sheet component with swipe gestures.
 * Works with useBottomSheet hook for full gesture control.
 *
 * @module bottom-sheet
 *
 * @example Basic usage
 * ```tsx
 * const { sheetProps } = useBottomSheet({ open, onOpenChange });
 *
 * <BottomSheet
 *   open={open}
 *   onClose={() => onOpenChange(false)}
 *   title="Edit Item"
 *   {...sheetProps}
 * >
 *   <Form />
 * </BottomSheet>
 * ```
 *
 * @example With footer actions
 * ```tsx
 * <BottomSheet
 *   open={open}
 *   onClose={handleClose}
 *   title="Confirm Action"
 *   description="Are you sure?"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button variant="outline" onClick={handleClose}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </div>
 *   }
 *   {...sheetProps}
 * >
 *   <p>This action cannot be undone.</p>
 * </BottomSheet>
 * ```
 *
 * @example With custom handle
 * ```tsx
 * <BottomSheet
 *   open={open}
 *   onClose={handleClose}
 *   handle={<div className="w-16 h-2 rounded-full bg-violet-500/50" />}
 *   {...sheetProps}
 * >
 *   Content
 * </BottomSheet>
 * ```
 */

import {
  type ReactNode,
  type CSSProperties,
  type TouchEvent,
  type RefObject,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@pageshell/core';
import { X } from 'lucide-react';
import { GlassOverlay } from '../glass-overlay';
import { useDetectedPortalTheme, type PortalTheme } from '../modal';

// =============================================================================
// Types
// =============================================================================

export interface BottomSheetProps {
  /** Open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet ref (from useBottomSheet) */
  sheetRef?: RefObject<HTMLDivElement | null>;
  /** Sheet style (from useBottomSheet) */
  style?: CSSProperties;
  /** Touch handlers (from useBottomSheet) */
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  /** Title */
  title?: string;
  /** Description */
  description?: string;
  /** Theme for glass effect */
  theme?: 'admin' | 'creator' | 'student';
  /** Custom handle element */
  handle?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function BottomSheet({
  open,
  onClose,
  sheetRef,
  style,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  title,
  description,
  theme = 'creator',
  handle,
  footer,
  children,
  className,
}: BottomSheetProps) {
  // State for client-side portal mounting (avoid SSR hydration issues)
  const [mounted, setMounted] = useState(false);

  // Detect theme from DOM using shared hook
  // Must be called before early return to follow React hooks rules
  const { themeClass } = useDetectedPortalTheme(theme as PortalTheme, open);

  // Mount portal only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hooks must be called unconditionally (before any early return)
  useEffect(() => {
    if (!open) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open, onClose]);

  // Early return AFTER hooks - don't render until mounted on client
  if (!open || !mounted) return null;

  // Render in portal to escape ancestor transforms that break position: fixed
  // Wrap in theme container to inherit correct CSS variables (themeClass from hook)
  const sheetContent = (
    <div className={themeClass}>
      {/* Overlay */}
      <GlassOverlay theme={theme} blur="sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={description ? 'sheet-description' : undefined}
        className={cn(
          'rounded-t-2xl',
          'border-t border-border',
          'shadow-2xl',
          'flex flex-col',
          // Simple fade animation (slide conflicts with transform from gesture hook)
          'animate-in fade-in-0 duration-200',
          'motion-reduce:animate-none',
          className
        )}
        style={{
          // Explicit positioning - don't rely on Tailwind classes that might be purged
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          // Max height to leave space at top
          maxHeight: 'calc(100vh - 2rem)',
          // Spread hook styles (transform for drag gesture, maxHeight for snap points)
          ...style,
          // Solid background for mobile
          backgroundColor: 'var(--color-popover, var(--color-card, #18181b))',
          // Safe area padding for iOS home indicator
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          {handle ?? (
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          )}
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h2
                    id="sheet-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="sheet-description"
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-muted/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal to escape any ancestor with transform/filter
  // that would create a new containing block for position: fixed
  return createPortal(sheetContent, document.body);
}

BottomSheet.displayName = 'BottomSheet';
