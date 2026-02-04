/**
 * usePreferencesLogic - Headless Preferences Logic Hook
 *
 * Encapsulates preferences/settings state management: toggle states,
 * optimistic updates, loading states, and section organization.
 * Can be used independently for custom UIs or with PreferencesPage.
 *
 * @module hooks/preferences
 *
 * @example Basic usage
 * ```tsx
 * const prefs = usePreferencesLogic({
 *   data: userPreferences,
 *   sections: [
 *     { id: 'notifications', title: 'Notificações', preferences: [
 *       { key: 'emailEnabled', label: 'Emails' },
 *       { key: 'pushEnabled', label: 'Push' },
 *     ]},
 *   ],
 *   onToggle: (key, value) => updatePreference({ [key]: value }),
 * });
 *
 * // Use with custom UI
 * {prefs.sections.map(section => (
 *   <div key={section.id}>
 *     <h3>{section.title}</h3>
 *     {section.items.map(item => (
 *       <label key={item.key}>
 *         <input
 *           type="checkbox"
 *           checked={item.checked}
 *           onChange={() => prefs.toggle(item.key)}
 *           disabled={item.isLoading}
 *         />
 *         {item.label}
 *       </label>
 *     ))}
 *   </div>
 * ))}
 * ```
 *
 * @example With optimistic updates
 * ```tsx
 * const prefs = usePreferencesLogic({
 *   data: preferences,
 *   sections: [...],
 *   onToggle: async (key, value) => {
 *     await api.preferences.update.mutateAsync({ [key]: value });
 *   },
 *   optimistic: true, // UI updates immediately
 * });
 * ```
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  UsePreferencesLogicOptions,
  UsePreferencesLogicReturn,
  PreferenceItemState,
  PreferenceSectionState,
} from './types';

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePreferencesLogic<TData extends object>(
  options: UsePreferencesLogicOptions<TData>
): UsePreferencesLogicReturn {
  const {
    data,
    sections: sectionConfigs,
    onToggle,
    optimistic = true,
    onToggleComplete,
    onToggleError,
  } = options;

  // Local state for optimistic updates
  const [optimisticValues, setOptimisticValues] = useState<Record<string, boolean>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [errorKeys, setErrorKeys] = useState<Map<string, string>>(new Map());

  // Clear optimistic values when data changes
  useEffect(() => {
    if (data) {
      setOptimisticValues({});
    }
  }, [data]);

  // Get actual value for a key
  const getValue = useCallback((key: string, defaultValue?: boolean): boolean => {
    // Optimistic value takes precedence
    if (key in optimisticValues) {
      return optimisticValues[key]!;
    }
    // Then actual data
    if (data && key in data) {
      return Boolean((data as Record<string, unknown>)[key]);
    }
    // Finally default
    return defaultValue ?? false;
  }, [data, optimisticValues]);

  // Compute values map
  const values = useMemo<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {};
    sectionConfigs.forEach((section) => {
      section.preferences.forEach((pref) => {
        result[pref.key] = getValue(pref.key, pref.defaultValue);
      });
    });
    return result;
  }, [sectionConfigs, getValue]);

  // Compute preference items with state
  const preferences = useMemo<PreferenceItemState[]>(() => {
    return sectionConfigs.flatMap((section) =>
      section.preferences.map((pref) => ({
        ...pref,
        checked: getValue(pref.key, pref.defaultValue),
        isLoading: loadingKeys.has(pref.key),
        hasError: errorKeys.has(pref.key),
        errorMessage: errorKeys.get(pref.key),
      }))
    );
  }, [sectionConfigs, getValue, loadingKeys, errorKeys]);

  // Compute sections with state
  const sections = useMemo<PreferenceSectionState[]>(() => {
    return sectionConfigs.map((section) => {
      const items = section.preferences.map((pref) => ({
        ...pref,
        checked: getValue(pref.key, pref.defaultValue),
        isLoading: loadingKeys.has(pref.key),
        hasError: errorKeys.has(pref.key),
        errorMessage: errorKeys.get(pref.key),
      }));

      const checkedCount = items.filter((i) => i.checked).length;

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        icon: section.icon,
        iconColor: section.iconColor,
        items,
        isLoading: items.some((i) => i.isLoading),
        allChecked: checkedCount === items.length,
        someChecked: checkedCount > 0 && checkedCount < items.length,
        noneChecked: checkedCount === 0,
      };
    });
  }, [sectionConfigs, getValue, loadingKeys, errorKeys]);

  // Computed values
  const isLoading = loadingKeys.size > 0;
  const hasErrors = errorKeys.size > 0;
  const totalCount = preferences.length;
  const enabledCount = preferences.filter((p) => p.checked).length;
  const disabledCount = totalCount - enabledCount;

  // Toggle action
  const toggle = useCallback(async (key: string): Promise<void> => {
    const currentValue = getValue(key);
    const newValue = !currentValue;

    // Set loading
    setLoadingKeys((prev) => new Set(prev).add(key));
    setErrorKeys((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });

    // Optimistic update
    if (optimistic) {
      setOptimisticValues((prev) => ({ ...prev, [key]: newValue }));
    }

    try {
      await onToggle(key, newValue);
      onToggleComplete?.(key, newValue, true);

      // Clear optimistic value on success (real data will update)
      if (optimistic) {
        setOptimisticValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } catch (error) {
      // Revert optimistic value
      if (optimistic) {
        setOptimisticValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      // Set error
      const message = error instanceof Error ? error.message : 'Erro ao atualizar';
      setErrorKeys((prev) => new Map(prev).set(key, message));
      onToggleError?.(key, error);
      onToggleComplete?.(key, newValue, false);
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [getValue, optimistic, onToggle, onToggleComplete, onToggleError]);

  // Set value directly
  const setValue = useCallback(async (key: string, value: boolean): Promise<void> => {
    const currentValue = getValue(key);
    if (currentValue === value) return;

    setLoadingKeys((prev) => new Set(prev).add(key));
    setErrorKeys((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });

    if (optimistic) {
      setOptimisticValues((prev) => ({ ...prev, [key]: value }));
    }

    try {
      await onToggle(key, value);
      onToggleComplete?.(key, value, true);

      if (optimistic) {
        setOptimisticValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } catch (error) {
      if (optimistic) {
        setOptimisticValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      const message = error instanceof Error ? error.message : 'Erro ao atualizar';
      setErrorKeys((prev) => new Map(prev).set(key, message));
      onToggleError?.(key, error);
      onToggleComplete?.(key, value, false);
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [getValue, optimistic, onToggle, onToggleComplete, onToggleError]);

  // Toggle all in section
  const toggleSection = useCallback(async (sectionId: string, value: boolean): Promise<void> => {
    const section = sectionConfigs.find((s) => s.id === sectionId);
    if (!section) return;

    const keys = section.preferences
      .filter((p) => !p.disabled)
      .map((p) => p.key);

    await Promise.all(keys.map((key) => setValue(key, value)));
  }, [sectionConfigs, setValue]);

  // Toggle all
  const toggleAll = useCallback(async (value: boolean): Promise<void> => {
    const keys = sectionConfigs
      .flatMap((s) => s.preferences)
      .filter((p) => !p.disabled)
      .map((p) => p.key);

    await Promise.all(keys.map((key) => setValue(key, value)));
  }, [sectionConfigs, setValue]);

  // Clear error
  const clearError = useCallback((key: string): void => {
    setErrorKeys((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback((): void => {
    setErrorKeys(new Map());
  }, []);

  // Get preference by key
  const getPreference = useCallback((key: string): PreferenceItemState | undefined => {
    return preferences.find((p) => p.key === key);
  }, [preferences]);

  // Check loading
  const isKeyLoading = useCallback((key: string): boolean => {
    return loadingKeys.has(key);
  }, [loadingKeys]);

  // Check error
  const hasKeyError = useCallback((key: string): boolean => {
    return errorKeys.has(key);
  }, [errorKeys]);

  // Get error message
  const getKeyError = useCallback((key: string): string | undefined => {
    return errorKeys.get(key);
  }, [errorKeys]);

  return {
    // State
    sections,
    preferences,
    values,
    loadingKeys,
    errorKeys,

    // Computed
    isLoading,
    hasErrors,
    totalCount,
    enabledCount,
    disabledCount,

    // Actions
    toggle,
    setValue,
    toggleSection,
    toggleAll,
    clearError,
    clearAllErrors,

    // Utilities
    getPreference,
    isKeyLoading,
    hasKeyError,
    getKeyError,
  };
}
