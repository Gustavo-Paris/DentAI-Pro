/**
 * useAutoSave Hook
 *
 * Reusable auto-save functionality for forms.
 * Debounces changes and saves automatically.
 *
 * @module hooks/form/useAutoSave
 */

'use client';

import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions<T> {
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Save handler */
  onAutoSave: (data: T) => Promise<void> | void;
  /** Get current data */
  getData: () => T;
  /** Duration to show "saved" status before returning to idle */
  savedDisplayMs?: number;
}

export interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Manually trigger save */
  triggerSave: () => Promise<void>;
  /** Reset status to idle */
  resetStatus: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useAutoSave<T>(options: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const {
    enabled,
    isDirty,
    debounceMs = 2000,
    onAutoSave,
    getData,
    savedDisplayMs = 2000,
  } = options;

  const [status, setStatus] = React.useState<AutoSaveStatus>('idle');

  // Refs for stable callbacks
  const onAutoSaveRef = React.useRef(onAutoSave);
  const getDataRef = React.useRef(getData);

  React.useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
    getDataRef.current = getData;
  }, [onAutoSave, getData]);

  // Auto-save effect
  React.useEffect(() => {
    if (!enabled || !isDirty) return;

    const timer = setTimeout(async () => {
      try {
        setStatus('saving');
        const data = getDataRef.current();
        await onAutoSaveRef.current(data);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), savedDisplayMs);
      } catch {
        setStatus('error');
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [enabled, isDirty, debounceMs, savedDisplayMs]);

  const triggerSave = React.useCallback(async () => {
    try {
      setStatus('saving');
      const data = getDataRef.current();
      await onAutoSaveRef.current(data);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), savedDisplayMs);
    } catch {
      setStatus('error');
    }
  }, [savedDisplayMs]);

  const resetStatus = React.useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    status,
    triggerSave,
    resetStatus,
  };
}
