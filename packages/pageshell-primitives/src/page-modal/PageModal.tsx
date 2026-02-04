/**
 * PageModal - Theme-aware modal component
 *
 * Renders modals that respect the current theme.
 * Uses inline styles to work correctly with Radix portals.
 *
 * @module page-modal
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@pageshell/core';
import { Button } from '../button';
import { resolveIcon } from '../icons';
import {
  getModalThemeStyles,
  MODAL_OVERLAY_CLASSES,
  MODAL_CONTENT_BASE_CLASSES,
  MODAL_SIZE_CLASSES,
  MobileDragIndicator,
  type ModalSize,
} from '../modal';

// =============================================================================
// Hooks
// =============================================================================

/**
 * Detects theme from DOM only once on mount.
 * Avoids expensive DOM queries on every render.
 */
function useDetectedTheme(themeProp: PageModalTheme | undefined): PageModalTheme | undefined {
  const [theme, setTheme] = React.useState<PageModalTheme | undefined>(themeProp);

  React.useEffect(() => {
    if (themeProp) {
      setTheme(themeProp);
      return;
    }
    if (typeof document === 'undefined') return;

    const themeElement = document.querySelector(
      '.ui-theme-creator, .ui-theme-admin, .ui-theme-student'
    );
    if (themeElement?.classList.contains('ui-theme-creator')) {
      setTheme('creator');
    } else if (themeElement?.classList.contains('ui-theme-admin')) {
      setTheme('admin');
    } else if (themeElement?.classList.contains('ui-theme-student')) {
      setTheme('student');
    }
  }, [themeProp]);

  return theme;
}

/**
 * Detects dark mode from DOM only once on mount.
 */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = React.useState(true); // SSR default

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const dark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.style.colorScheme === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    setIsDark(dark);
  }, []);

  return isDark;
}

// =============================================================================
// Types
// =============================================================================

export type PageModalTheme = 'admin' | 'creator' | 'student';

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
  /** Override theme */
  theme?: PageModalTheme;
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
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * PageModal - Theme-aware modal component
 *
 * @example Basic usage
 * ```tsx
 * <PageModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Edit Course"
 *   description="Update course details"
 * >
 *   <form>...</form>
 * </PageModal>
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
 *
 * @example With ref for DOM access
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * <PageModal ref={modalRef} ... />
 * ```
 */
export const PageModal = React.forwardRef<HTMLDivElement, PageModalProps>(
  function PageModal(
    {
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
      testId,
    },
    ref
  ) {
  // Resolve icons
  const XIcon = resolveIcon('x');
  const LoaderIcon = resolveIcon('loader');

  // Use stable hooks instead of useMemo with DOM queries
  const detectedTheme = useDetectedTheme(themeProp);
  const isDarkMode = useIsDarkMode();

  // Build theme class
  const themeClass = [
    detectedTheme && 'ui-theme',
    detectedTheme && `ui-theme-${detectedTheme}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Theme mode wrapper */}
        <div className={isDarkMode ? 'dark' : 'light'}>
          {/* Theme wrapper */}
          <div className={themeClass}>
            {/* Overlay */}
            <DialogPrimitive.Overlay className={MODAL_OVERLAY_CLASSES} />

            {/* Content */}
            <DialogPrimitive.Content
              ref={ref}
              data-testid={testId}
              style={getModalThemeStyles()}
              className={cn(
                'themed-dialog',
                MODAL_CONTENT_BASE_CLASSES,
                MODAL_SIZE_CLASSES[size],
                className
              )}
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
                {showClose && XIcon && (
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
                    <XIcon className="h-4 w-4" />
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
                {isLoading && LoaderIcon ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
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
);

// =============================================================================
// PageModalFooter Component
// =============================================================================

export interface PageModalFooterProps {
  /** Cancel handler */
  onCancel: () => void;
  /** Submit handler */
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
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
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
  const LoaderIcon = resolveIcon('loader');

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
                {LoaderIcon && (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
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
