/**
 * useWizardKeyboardNav Hook
 *
 * Provides keyboard navigation for wizard-style interfaces.
 * Supports arrow keys (← →) and Enter for step navigation.
 *
 * @module hooks/wizard/useWizardKeyboardNav
 */

'use client';

import { useEffect, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseWizardKeyboardNavOptions {
  /**
   * Callback when user presses → or Enter (next action)
   */
  onNext: () => void;

  /**
   * Callback when user presses ← (previous action)
   */
  onPrevious: () => void;

  /**
   * Whether next action is allowed
   * @default true
   */
  canGoNext?: boolean;

  /**
   * Whether previous action is allowed
   * @default true
   */
  canGoPrevious?: boolean;

  /**
   * Enable/disable keyboard navigation
   * @default true
   */
  enabled?: boolean;
}

export interface UseWizardKeyboardNavResult {
  /**
   * Keyboard hints for display in UI
   */
  keyboardHints: {
    next: string;
    previous: string;
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that handles keyboard navigation for wizards.
 *
 * Listens for:
 * - ArrowRight or Enter → triggers onNext
 * - ArrowLeft → triggers onPrevious
 *
 * Ignores key events when focus is on input, textarea, or select elements.
 *
 * @example
 * ```tsx
 * const { keyboardHints } = useWizardKeyboardNav({
 *   onNext: handleNext,
 *   onPrevious: handlePrevious,
 *   canGoNext: !isLoading && !nextDisabled,
 *   canGoPrevious: currentStep > 1,
 *   enabled: keyboardNavigation,
 * });
 *
 * // Display hints in UI
 * <span>{keyboardHints.previous}</span>
 * <span>{keyboardHints.next}</span>
 * ```
 */
export function useWizardKeyboardNav(
  options: UseWizardKeyboardNavOptions
): UseWizardKeyboardNavResult {
  const {
    onNext,
    onPrevious,
    canGoNext = true,
    canGoPrevious = true,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is on form elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (canGoNext) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (canGoPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, canGoNext, canGoPrevious, onNext, onPrevious]);

  const keyboardHints = useMemo(
    () => ({
      next: '→ or Enter',
      previous: '←',
    }),
    []
  );

  return { keyboardHints };
}
