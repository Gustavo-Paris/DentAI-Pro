/**
 * useSidebarCollapse - Manages sidebar collapse state (expanded/collapsed/auto)
 *
 * Features:
 * - Toggle between expanded (w-64) and collapsed (w-16) modes
 * - Auto mode expands on hover
 * - Persists preference in localStorage
 * - Syncs across tabs
 *
 * @module hooks/useSidebarCollapse
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// =============================================================================
// Types
// =============================================================================

export type SidebarMode = 'expanded' | 'collapsed' | 'auto';

export interface UseSidebarCollapseOptions {
  /** Initial mode (default: 'expanded') */
  defaultMode?: SidebarMode;
  /** localStorage key for persistence (default: 'sidebar-mode') */
  storageKey?: string;
  /** Enable localStorage persistence (default: true) */
  persist?: boolean;
  /** Callback when mode changes */
  onModeChange?: (mode: SidebarMode) => void;
}

export interface UseSidebarCollapseReturn {
  /** Current sidebar mode */
  mode: SidebarMode;
  /** Whether sidebar is currently collapsed (visually) */
  isCollapsed: boolean;
  /** Whether sidebar is temporarily expanded (hover in auto mode) */
  isTemporarilyExpanded: boolean;
  /** Set a specific mode */
  setMode: (mode: SidebarMode) => void;
  /** Toggle between expanded and collapsed */
  toggle: () => void;
  /** Expand the sidebar */
  expand: () => void;
  /** Collapse the sidebar */
  collapse: () => void;
  /** Temporarily expand (for auto mode hover) */
  temporarilyExpand: () => void;
  /** Restore from temporary expand */
  restoreTemporary: () => void;
  /** Width class based on current state */
  widthClass: string;
  /** Width in pixels based on current state */
  widthPx: number;
}

// =============================================================================
// Constants
// =============================================================================

const EXPANDED_WIDTH = 256; // w-64
const COLLAPSED_WIDTH = 64; // w-16
const DEFAULT_STORAGE_KEY = 'sidebar-mode';

const VALID_MODES: SidebarMode[] = ['expanded', 'collapsed', 'auto'];

/**
 * Validates and deserializes a SidebarMode from storage.
 * Returns null for invalid values (will fall back to defaultMode).
 */
function deserializeSidebarMode(value: string): SidebarMode | null {
  if (VALID_MODES.includes(value as SidebarMode)) {
    return value as SidebarMode;
  }
  return null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage sidebar collapse state.
 *
 * @example
 * ```tsx
 * function SidebarContainer() {
 *   const {
 *     mode,
 *     isCollapsed,
 *     toggle,
 *     widthClass,
 *     temporarilyExpand,
 *     restoreTemporary,
 *   } = useSidebarCollapse();
 *
 *   return (
 *     <div
 *       className={widthClass}
 *       onMouseEnter={mode === 'auto' ? temporarilyExpand : undefined}
 *       onMouseLeave={mode === 'auto' ? restoreTemporary : undefined}
 *     >
 *       <SidebarContent isCollapsed={isCollapsed} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useSidebarCollapse(
  options: UseSidebarCollapseOptions = {}
): UseSidebarCollapseReturn {
  const {
    defaultMode = 'expanded',
    storageKey = DEFAULT_STORAGE_KEY,
    persist = true,
    onModeChange,
  } = options;

  // =============================================================================
  // State
  // =============================================================================

  const [storedMode, setStoredMode] = useLocalStorage<SidebarMode | null>(
    storageKey,
    null,
    {
      syncTabs: persist,
      deserializer: deserializeSidebarMode,
      serializer: (value) => value ?? '',
    }
  );

  // Use stored mode if valid, otherwise default
  const mode = persist && storedMode ? storedMode : defaultMode;

  const [isTemporarilyExpanded, setIsTemporarilyExpanded] = useState(false);

  // =============================================================================
  // Derived State
  // =============================================================================

  const isCollapsed = useMemo(() => {
    if (mode === 'collapsed') return true;
    if (mode === 'expanded') return false;
    // Auto mode: collapsed unless temporarily expanded
    return !isTemporarilyExpanded;
  }, [mode, isTemporarilyExpanded]);

  const widthClass = useMemo(() => {
    return isCollapsed ? 'w-16' : 'w-64';
  }, [isCollapsed]);

  const widthPx = useMemo(() => {
    return isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  }, [isCollapsed]);

  // =============================================================================
  // Actions
  // =============================================================================

  const setMode = useCallback(
    (newMode: SidebarMode) => {
      if (persist) {
        setStoredMode(newMode);
      }
      setIsTemporarilyExpanded(false);
      onModeChange?.(newMode);
    },
    [persist, setStoredMode, onModeChange]
  );

  const toggle = useCallback(() => {
    setMode(mode === 'expanded' ? 'collapsed' : 'expanded');
  }, [mode, setMode]);

  const expand = useCallback(() => {
    setMode('expanded');
  }, [setMode]);

  const collapse = useCallback(() => {
    setMode('collapsed');
  }, [setMode]);

  const temporarilyExpand = useCallback(() => {
    if (mode === 'auto') {
      setIsTemporarilyExpanded(true);
    }
  }, [mode]);

  const restoreTemporary = useCallback(() => {
    setIsTemporarilyExpanded(false);
  }, []);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    mode,
    isCollapsed,
    isTemporarilyExpanded,
    setMode,
    toggle,
    expand,
    collapse,
    temporarilyExpand,
    restoreTemporary,
    widthClass,
    widthPx,
  };
}
