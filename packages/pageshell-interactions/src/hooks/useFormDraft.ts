'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface UseFormDraftOptions<T> {
  /** Unique key for localStorage (e.g., "proposal-123") */
  key: string;
  /** Current form value to auto-save */
  value?: T;
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

export interface UseFormDraftReturn<T> {
  /** The saved draft value, if any */
  draft: T | null;
  /** Whether a draft exists for this key */
  hasDraft: boolean;
  /** Timestamp of last auto-save */
  lastSaved: Date | null;
  /** Whether currently saving */
  isSaving: boolean;
  /** Manually save current value as draft */
  saveDraft: (value: T) => void;
  /** Clear the draft (call after successful server save) */
  clearDraft: () => void;
  /** Restore from draft (returns draft value) */
  restoreDraft: () => T | null;
}

export interface FormatLastSavedLabels {
  /** Label for "just now" (e.g., "Saved just now") */
  justNow: string;
  /** Label for seconds ago. Use {seconds} placeholder (e.g., "Saved {seconds}s ago") */
  secondsAgo: string;
  /** Label for minutes ago. Use {minutes} placeholder (e.g., "Saved {minutes}min ago") */
  minutesAgo: string;
  /** Label for specific time. Use {time} placeholder (e.g., "Saved at {time}") */
  atTime: string;
}

interface StoredDraft<T> {
  value: T;
  savedAt: string;
  version: number;
}

// =============================================================================
// Constants
// =============================================================================

const DRAFT_VERSION = 1;
const STORAGE_PREFIX = 'form-draft:';

// =============================================================================
// Internal Utilities
// =============================================================================

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readDraft<T>(key: string): StoredDraft<T> | null {
  const parsed = safeGetItem<StoredDraft<T>>(getStorageKey(key));
  if (!parsed) return null;

  // Version check for future migrations
  if (parsed.version !== DRAFT_VERSION) {
    safeRemoveItem(getStorageKey(key));
    return null;
  }

  return parsed;
}

function writeDraft<T>(key: string, value: T): Date {
  const savedAt = new Date();
  const draft: StoredDraft<T> = {
    value,
    savedAt: savedAt.toISOString(),
    version: DRAFT_VERSION,
  };

  safeSetItem(getStorageKey(key), draft);
  return savedAt;
}

function removeDraft(key: string): void {
  safeRemoveItem(getStorageKey(key));
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useFormDraft - Auto-save and draft recovery for forms
 *
 * Provides auto-save and draft recovery functionality for forms.
 * Saves drafts to localStorage with debouncing to prevent excessive writes.
 *
 * Features:
 * - Auto-save on value changes (debounced)
 * - Draft recovery on page reload
 * - Clear draft after successful server save
 * - "Last saved" timestamp tracking
 *
 * @example
 * ```tsx
 * const { draft, hasDraft, lastSaved, saveDraft, clearDraft, restoreDraft } = useFormDraft({
 *   key: `proposal-${proposalId}`,
 *   value: formData,
 *   debounceMs: 2000,
 * });
 * ```
 */
export function useFormDraft<T>({
  key,
  value,
  debounceMs = 2000,
  enabled = true,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [draft, setDraft] = useState<T | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousValueRef = useRef<string | undefined>(undefined);

  // Check for existing draft on mount
  useEffect(() => {
    const stored = readDraft<T>(key);
    if (stored) {
      setDraft(stored.value);
      setHasDraft(true);
      setLastSaved(new Date(stored.savedAt));
    }
  }, [key]);

  // Auto-save with debounce when value changes
  useEffect(() => {
    if (!enabled || value === undefined) return;

    // Serialize for comparison (to detect actual changes)
    const serialized = JSON.stringify(value);

    // Skip if value hasn't actually changed
    if (serialized === previousValueRef.current) return;
    previousValueRef.current = serialized;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      const savedAt = writeDraft(key, value);
      setDraft(value);
      setHasDraft(true);
      setLastSaved(savedAt);
      setIsSaving(false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, debounceMs, enabled]);

  // Manual save (immediate, no debounce)
  const saveDraft = useCallback(
    (valueToSave: T) => {
      const savedAt = writeDraft(key, valueToSave);
      setDraft(valueToSave);
      setHasDraft(true);
      setLastSaved(savedAt);
      previousValueRef.current = JSON.stringify(valueToSave);
    },
    [key]
  );

  // Clear draft (after successful server save)
  const clearDraft = useCallback(() => {
    removeDraft(key);
    setDraft(null);
    setHasDraft(false);
    setLastSaved(null);
    previousValueRef.current = undefined;
  }, [key]);

  // Restore from draft
  const restoreDraft = useCallback((): T | null => {
    const stored = readDraft<T>(key);
    return stored?.value ?? null;
  }, [key]);

  return {
    draft,
    hasDraft,
    lastSaved,
    isSaving,
    saveDraft,
    clearDraft,
    restoreDraft,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format "last saved" timestamp for display
 *
 * @param date - The date to format
 * @param labels - Localized labels for formatting
 * @param locale - Locale for time formatting (default: 'en-US')
 *
 * @example
 * ```tsx
 * const t = useTranslations('forms.draft');
 * const label = formatLastSaved(lastSaved, {
 *   justNow: t('savedJustNow'),
 *   secondsAgo: t('savedSecondsAgo'),
 *   minutesAgo: t('savedMinutesAgo'),
 *   atTime: t('savedAtTime'),
 * });
 * ```
 */
export function formatLastSaved(
  date: Date | null,
  labels: FormatLastSavedLabels,
  locale: string = 'en-US'
): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 10) {
    return labels.justNow;
  }

  if (diffSecs < 60) {
    return labels.secondsAgo.replace('{seconds}', String(diffSecs));
  }

  if (diffMins < 60) {
    return labels.minutesAgo.replace('{minutes}', String(diffMins));
  }

  const timeString = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return labels.atTime.replace('{time}', timeString);
}
