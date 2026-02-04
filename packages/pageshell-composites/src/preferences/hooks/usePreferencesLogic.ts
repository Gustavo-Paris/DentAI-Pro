/**
 * usePreferencesLogic Hook
 *
 * Extracted logic from PreferencesPage for better separation of concerns.
 * Handles state synchronization, optimistic updates, and toggle handling.
 *
 * @module preferences/hooks/usePreferencesLogic
 */

'use client';

import * as React from 'react';
import type { PreferenceSection } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UsePreferencesLogicOptions<TData extends object> {
  /** Query result with data */
  queryData?: TData;
  /** Preference sections configuration */
  sections: PreferenceSection[];
  /** Toggle handler */
  onToggle: (key: string, value: boolean) => Promise<void> | void;
  /** Enable optimistic updates */
  optimistic?: boolean;
}

export interface UsePreferencesLogicReturn {
  /** Current preference values */
  values: Record<string, boolean>;
  /** Keys currently being updated */
  loadingKeys: Set<string>;
  /** Handle toggle for a preference */
  handleToggle: (key: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function usePreferencesLogic<TData extends object = Record<string, boolean>>(
  options: UsePreferencesLogicOptions<TData>
): UsePreferencesLogicReturn {
  const {
    queryData,
    sections,
    onToggle,
    optimistic = true,
  } = options;

  // ===========================================================================
  // State
  // ===========================================================================

  const [localValues, setLocalValues] = React.useState<Record<string, boolean>>(
    {}
  );
  const [loadingKeys, setLoadingKeys] = React.useState<Set<string>>(new Set());

  // ===========================================================================
  // Sync local values with query data
  // ===========================================================================

  React.useEffect(() => {
    if (queryData) {
      const booleanValues: Record<string, boolean> = {};
      sections.forEach((section) => {
        section.preferences.forEach((pref) => {
          const value = queryData[pref.key as keyof TData];
          booleanValues[pref.key] =
            typeof value === 'boolean' ? value : pref.defaultValue ?? false;
        });
      });
      setLocalValues(booleanValues);
    }
  }, [queryData, sections]);

  // ===========================================================================
  // Toggle Handler
  // ===========================================================================

  const handleToggle = React.useCallback(
    async (key: string) => {
      const currentValue = localValues[key] ?? false;
      const newValue = !currentValue;

      // Optimistic update
      if (optimistic) {
        setLocalValues((prev) => ({ ...prev, [key]: newValue }));
      }

      // Track loading
      setLoadingKeys((prev) => new Set(prev).add(key));

      try {
        await onToggle(key, newValue);
      } catch {
        // Revert on error
        if (optimistic) {
          setLocalValues((prev) => ({ ...prev, [key]: currentValue }));
        }
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [localValues, onToggle, optimistic]
  );

  return {
    values: localValues,
    loadingKeys,
    handleToggle,
  };
}
