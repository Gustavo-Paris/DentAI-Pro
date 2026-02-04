/**
 * useFormModalShortcuts - Keyboard Shortcuts Hook for Form Modals
 *
 * Provides customizable keyboard shortcuts for form modals.
 * Handles cross-platform modifier keys (Cmd on Mac = Ctrl on Windows/Linux),
 * conditional execution, and scoping to specific elements.
 *
 * @module hooks/useFormModalShortcuts
 *
 * @example Basic usage - Submit and close
 * ```tsx
 * function MyFormModal({ onClose, onSubmit }: Props) {
 *   useFormModalShortcuts({
 *     shortcuts: [
 *       { key: 'Escape', action: onClose },
 *       { key: 'Enter', modifiers: ['cmd'], action: onSubmit },
 *     ],
 *   });
 *
 *   return <form>...</form>;
 * }
 * ```
 *
 * @example With conditional execution
 * ```tsx
 * const { isValid, isSubmitting } = useForm();
 *
 * useFormModalShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'Enter',
 *       modifiers: ['cmd'],
 *       action: handleSubmit,
 *       when: () => isValid && !isSubmitting, // Only submit if valid
 *     },
 *   ],
 * });
 * ```
 *
 * @example Scoped to element
 * ```tsx
 * const formRef = useRef<HTMLFormElement>(null);
 *
 * useFormModalShortcuts({
 *   shortcuts: [{ key: 's', modifiers: ['cmd'], action: handleSave }],
 *   scope: formRef, // Only listen within the form
 * });
 * ```
 *
 * @example Disable shortcuts temporarily
 * ```tsx
 * const [isEditing, setIsEditing] = useState(false);
 *
 * useFormModalShortcuts({
 *   shortcuts: [{ key: 'Escape', action: onClose }],
 *   enabled: !isEditing, // Disable when editing
 * });
 * ```
 */

'use client';

import { useCallback, useEffect, type RefObject } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Modifier keys for shortcuts
 * - 'cmd': Meta key on Mac, Ctrl on Windows/Linux
 * - 'ctrl': Ctrl key on all platforms
 * - 'shift': Shift key
 * - 'alt': Alt/Option key
 */
export type ShortcutModifier = 'cmd' | 'ctrl' | 'shift' | 'alt';

/**
 * Shortcut definition
 */
export interface Shortcut {
  /** Key to listen for (e.g., 'Enter', 's', 'Escape') */
  key: string;
  /** Modifier keys required */
  modifiers?: ShortcutModifier[];
  /** Action to execute */
  action: () => void | Promise<void>;
  /** Condition to check before executing */
  when?: () => boolean;
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Options for useFormModalShortcuts
 */
export interface UseFormModalShortcutsOptions {
  /** Shortcuts to register */
  shortcuts: Shortcut[];
  /** Enable/disable all shortcuts */
  enabled?: boolean;
  /** Scope shortcuts to this element (default: document) */
  scope?: RefObject<HTMLElement | null>;
}

// =============================================================================
// Constants
// =============================================================================

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if the pressed modifier keys match the required modifiers
 */
function matchesModifiers(
  event: KeyboardEvent,
  modifiers?: ShortcutModifier[]
): boolean {
  if (!modifiers || modifiers.length === 0) {
    // No modifiers required - ensure none are pressed
    return !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  const requiredCmd = modifiers.includes('cmd');
  const requiredCtrl = modifiers.includes('ctrl');
  const requiredShift = modifiers.includes('shift');
  const requiredAlt = modifiers.includes('alt');

  // On Mac, 'cmd' uses metaKey. On Windows/Linux, treat 'cmd' as ctrlKey
  const cmdPressed = isMac ? event.metaKey : event.ctrlKey;
  const ctrlPressed = event.ctrlKey;

  // Check required modifiers are pressed
  if (requiredCmd && !cmdPressed) return false;
  if (requiredCtrl && !ctrlPressed) return false;
  if (requiredShift && !event.shiftKey) return false;
  if (requiredAlt && !event.altKey) return false;

  // Check no extra modifiers are pressed (except when cmd=ctrl on non-Mac)
  if (!requiredCmd && !requiredCtrl) {
    if (event.metaKey || event.ctrlKey) return false;
  } else if (requiredCmd && !requiredCtrl && !isMac) {
    // On non-Mac, cmd uses ctrl, so don't check for extra ctrl
  } else if (!requiredCmd && requiredCtrl) {
    // Ctrl is required but cmd is not - check metaKey isn't pressed on Mac
    if (isMac && event.metaKey) return false;
  }

  if (!requiredShift && event.shiftKey) return false;
  if (!requiredAlt && event.altKey) return false;

  return true;
}

/**
 * Normalize key to lowercase for comparison
 */
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Register keyboard shortcuts for form modals
 *
 * @param options - Shortcut configuration
 */
export function useFormModalShortcuts({
  shortcuts,
  enabled = true,
  scope,
}: UseFormModalShortcutsOptions): void {
  // ===========================================================================
  // Event Handler
  // ===========================================================================

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const pressedKey = normalizeKey(event.key);

      for (const shortcut of shortcuts) {
        const targetKey = normalizeKey(shortcut.key);

        if (
          pressedKey === targetKey &&
          matchesModifiers(event, shortcut.modifiers)
        ) {
          // Check condition if provided
          if (shortcut.when && !shortcut.when()) {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }

          void shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  // ===========================================================================
  // Effect - Register Event Listener
  // ===========================================================================

  useEffect(() => {
    if (!enabled) return;

    const target = scope?.current ?? document;
    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, scope]);
}
