/**
 * useFormModalFocus - Auto-focus Hook for Form Modals
 *
 * Provides automatic focus management for form modals.
 * Focuses the first visible input when the modal opens,
 * with support for custom selectors and delayed focus (for animations).
 *
 * @module hooks/useFormModalFocus
 *
 * @example Basic usage
 * ```tsx
 * function MyFormModal() {
 *   const containerRef = useRef<HTMLFormElement>(null);
 *   const { focusFirst } = useFormModalFocus({ containerRef });
 *
 *   return (
 *     <form ref={containerRef}>
 *       <input name="title" />
 *       <textarea name="description" />
 *     </form>
 *   );
 * }
 * ```
 *
 * @example With custom selector
 * ```tsx
 * const { focusFirst } = useFormModalFocus({
 *   containerRef,
 *   selector: 'input[data-autofocus]', // Focus only elements with data-autofocus
 * });
 * ```
 *
 * @example With animation delay
 * ```tsx
 * const { focusFirst } = useFormModalFocus({
 *   containerRef,
 *   delayMs: 300, // Wait for modal animation to complete
 * });
 * ```
 *
 * @example Manual focus control
 * ```tsx
 * const { focusFirst, focusField } = useFormModalFocus({
 *   containerRef,
 *   disabled: true, // Disable auto-focus
 * });
 *
 * // Focus specific field on error
 * if (errors.email) {
 *   focusField('email');
 * }
 * ```
 */

'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useFormModalFocus
 */
export interface UseFormModalFocusOptions {
  /** Ref of the form container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Custom CSS selector for focusable elements (default: first visible input/textarea/select) */
  selector?: string;
  /** Delay in ms before focusing (useful for modal animations) */
  delayMs?: number;
  /** Disable auto-focus on mount */
  disabled?: boolean;
}

/**
 * Return type for useFormModalFocus
 */
export interface UseFormModalFocusReturn {
  /** Focus the first visible field matching the selector */
  focusFirst: () => void;
  /** Focus a specific field by name attribute */
  focusField: (name: string) => void;
  /** Ref to the currently focused field (updated after focus calls) */
  activeFieldRef: RefObject<HTMLElement | null>;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_SELECTOR =
  'input:not([type="hidden"]):not([disabled]):not([readonly]), ' +
  'textarea:not([disabled]):not([readonly]), ' +
  'select:not([disabled])';

const DEFAULT_DELAY_MS = 150;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if an element is visible in the DOM
 */
function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useFormModalFocus({
  containerRef,
  selector = DEFAULT_SELECTOR,
  delayMs = DEFAULT_DELAY_MS,
  disabled = false,
}: UseFormModalFocusOptions): UseFormModalFocusReturn {
  const activeFieldRef = useRef<HTMLElement | null>(null);

  // =========================================================================
  // Focus First Field
  // =========================================================================

  const focusFirst = useCallback(() => {
    if (disabled || !containerRef.current) return;

    const elements = containerRef.current.querySelectorAll<HTMLElement>(selector);

    for (const element of elements) {
      if (isElementVisible(element)) {
        element.focus();
        activeFieldRef.current = element;
        return;
      }
    }
  }, [containerRef, selector, disabled]);

  // =========================================================================
  // Focus Specific Field by Name
  // =========================================================================

  const focusField = useCallback(
    (name: string) => {
      if (disabled || !containerRef.current) return;

      const element = containerRef.current.querySelector<HTMLElement>(
        `[name="${name}"]`
      );

      if (element && isElementVisible(element)) {
        element.focus();
        activeFieldRef.current = element;
      }
    },
    [containerRef, disabled]
  );

  // =========================================================================
  // Auto-focus on Mount (with delay for animations)
  // =========================================================================

  useEffect(() => {
    if (disabled) return;

    const timeoutId = setTimeout(focusFirst, delayMs);
    return () => clearTimeout(timeoutId);
  }, [focusFirst, delayMs, disabled]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    focusFirst,
    focusField,
    activeFieldRef,
  };
}
