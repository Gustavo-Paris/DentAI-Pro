'use client';

/**
 * PageModal - Theme-aware modal component for PageShell
 *
 * Renders modals that respect the current PageShell theme.
 * Uses inline styles to work correctly with Radix portals.
 *
 * @example Basic usage
 * ```tsx
 * <PageShell theme="creator" ...>
 *   {(data) => (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Open Modal</Button>
 *       <PageModal
 *         open={open}
 *         onOpenChange={setOpen}
 *         title="Edit Course"
 *         description="Update course details"
 *       >
 *         <form>...</form>
 *       </PageModal>
 *     </>
 *   )}
 * </PageShell>
 * ```
 *
 * @example Form modal with submission
 * ```tsx
 * <PageModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Create Item"
 *   footer={
 *     <PageModalFooter
 *       onCancel={() => setOpen(false)}
 *       onSubmit={handleSubmit}
 *       isSubmitting={isPending}
 *     />
 *   }
 * >
 *   <Input label="Name" ... />
 * </PageModal>
 * ```
 */

import * as React from 'react';
// NOTE: Uses Radix directly instead of @pageshell/primitives because:
// - Requires raw primitive access for theme detection from DOM
// - Custom portal wrapper for dark/light mode inheritance
// - Custom overlay and content styling via shared modal utilities
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import type { PageShellTheme } from '@pageshell/theme';
import {
  getModalThemeStyles,
  MODAL_OVERLAY_CLASSES,
  MODAL_CONTENT_BASE_CLASSES,
  MODAL_SIZE_CLASSES,
  MobileDragIndicator,
  type ModalSize,
} from '@pageshell/primitives';

// =============================================================================
// Portal Theme Detection
// =============================================================================

/**
 * Hook to detect theme and dark mode from DOM for portal rendering.
 * Portals render outside the normal React tree, so we need to detect
 * the current theme/mode from the DOM.
 */
function useDetectedPortalTheme(
  themeProp: PageShellTheme | undefined,
  isOpen: boolean
): { themeClass: string; modeClass: string } {
  const [detected, setDetected] = React.useState({
    themeClass: themeProp ? `ui-theme-${themeProp}` : '',
    modeClass: 'dark',
  });

  React.useEffect(() => {
    if (!isOpen) return;

    // If theme prop provided, use it
    if (themeProp) {
      setDetected({
        themeClass: `ui-theme-${themeProp}`,
        modeClass: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
      return;
    }

    // Otherwise, detect from DOM
    const htmlClasses = document.documentElement.classList;
    const bodyClasses = document.body.classList;

    // Detect dark/light mode
    const isDark = htmlClasses.contains('dark') || bodyClasses.contains('dark');

    // Detect theme from common theme class patterns
    let themeClass = '';
    const themePatterns = ['ui-theme-', 'theme-'];
    for (const el of [document.documentElement, document.body]) {
      for (const cls of el.classList) {
        for (const pattern of themePatterns) {
          if (cls.startsWith(pattern)) {
            themeClass = cls;
            break;
          }
        }
        if (themeClass) break;
      }
      if (themeClass) break;
    }

    setDetected({
      themeClass,
      modeClass: isDark ? 'dark' : 'light',
    });
  }, [isOpen, themeProp]);

  return detected;
}

// =============================================================================
// PageModal Component
// =============================================================================

export interface PageModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title: string;
  /** Optional modal description */
  description?: string;
  /** Optional icon before title */
  icon?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (use PageModalFooter for standard buttons) */
  footer?: React.ReactNode;
  /** Override theme (defaults to PageShell context) */
  theme?: PageShellTheme;
  /** Modal size */
  size?: ModalSize;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the close button (default: true) */
  showClose?: boolean;
  /** Whether modal content is loading */
  isLoading?: boolean;
  /** Show divider between header and content */
  showHeaderDivider?: boolean;
  /** Show divider between content and footer */
  showFooterDivider?: boolean;
}

export function PageModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  theme: themeProp,
  size = 'lg',
  className,
  showClose = true,
  isLoading = false,
  showHeaderDivider = false,
  showFooterDivider = true,
}: PageModalProps) {
  // Detect theme and dark mode from DOM for portal rendering
  // Uses shared hook to ensure consistent theme detection across all modal components
  const { themeClass, modeClass } = useDetectedPortalTheme(themeProp, open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Theme mode wrapper - MUST be ancestor of theme classes for CSS selectors */}
        {/* CSS uses ".dark .ui-theme-X" or ".light .ui-theme-X" (ancestor selectors) */}
        <div className={modeClass}>
          {/* Theme wrapper - ensures CSS variables work inside portal */}
          <div className={themeClass}>
            {/* Overlay */}
            <DialogPrimitive.Overlay className={MODAL_OVERLAY_CLASSES} />

            {/* Content */}
            <DialogPrimitive.Content
              style={getModalThemeStyles()}
              className={cn(MODAL_CONTENT_BASE_CLASSES, MODAL_SIZE_CLASSES[size], className)}
            >
          {/* Mobile drag indicator */}
          <MobileDragIndicator />

          {/* Header */}
          <div
            className={cn(
              'flex items-start gap-3 px-5 pt-4 pb-3 sm:px-6 sm:pt-5',
              showHeaderDivider && 'border-b border-border pb-4'
            )}
          >
            {/* Icon */}
            {icon && (
              <div className="flex-shrink-0 mt-0.5 text-primary">{icon}</div>
            )}

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold leading-tight text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>

            {/* Close Button */}
            {showClose && (
              <DialogPrimitive.Close
                aria-label="Close"
                className={cn(
                  'flex-shrink-0 rounded-md p-1.5 -m-1.5',
                  'text-muted-foreground/70 hover:text-foreground',
                  'hover:bg-muted/80 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-popover',
                  'disabled:pointer-events-none'
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>

          {/* Content */}
          <div
            className={cn(
              'flex-1 overflow-y-auto px-5 py-3 sm:px-6',
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              children
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                'px-5 py-4 sm:px-6',
                showFooterDivider && 'border-t border-border'
              )}
            >
              {footer}
            </div>
          )}
            </DialogPrimitive.Content>
          </div>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// =============================================================================
// PageModalFooter Component
// =============================================================================

export interface PageModalFooterProps {
  /** Cancel handler */
  onCancel: () => void;
  /** Submit handler (if provided, renders as form submit button) */
  onSubmit?: () => void | Promise<void>;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Whether submit button is disabled */
  isSubmitDisabled?: boolean;
  /** Cancel button text */
  cancelText?: string;
  /** Submit button text */
  submitText?: string;
  /** Loading text */
  loadingText?: string;
  /** Submit button variant */
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Additional CSS classes */
  className?: string;
  /** Extra content before buttons (left side) */
  leftContent?: React.ReactNode;
}

export function PageModalFooter({
  onCancel,
  onSubmit,
  isSubmitting = false,
  isSubmitDisabled = false,
  cancelText = 'Cancel',
  submitText = 'Confirm',
  loadingText = 'Saving...',
  submitVariant = 'default',
  className,
  leftContent,
}: PageModalFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center',
        leftContent ? 'sm:justify-between' : 'sm:justify-end',
        className
      )}
    >
      {/* Left content */}
      {leftContent && <div className="hidden sm:block">{leftContent}</div>}

      {/* Buttons */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>
        {onSubmit && (
          <Button
            type="button"
            variant={submitVariant}
            onClick={onSubmit}
            disabled={isSubmitting || isSubmitDisabled}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              submitText
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PageModalTrigger Component
// =============================================================================

export const PageModalTrigger = DialogPrimitive.Trigger;

PageModal.displayName = 'PageModal';
PageModalFooter.displayName = 'PageModalFooter';
