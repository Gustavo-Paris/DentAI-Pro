'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMediaQuery } from '@pageshell/core';

/**
 * View mode options for ListPage
 * - 'table': Traditional table view with columns
 * - 'cards': Card grid view
 * - 'graph': Graph/network visualization view
 * - 'auto': Responsive (cards on mobile, table on desktop)
 */
export type ViewMode = 'table' | 'cards' | 'graph' | 'auto';

/**
 * Resolved view mode (never 'auto')
 */
export type ResolvedViewMode = 'table' | 'cards' | 'graph';

/**
 * Options for useViewMode hook
 */
export interface UseViewModeOptions {
  /**
   * View mode setting
   * - 'table': Always show table view
   * - 'cards': Always show card grid view
   * - 'auto': Switch based on screen size
   * @default 'table'
   */
  viewMode: ViewMode;

  /**
   * Breakpoint for mobile detection (pixels)
   * Only used when viewMode is 'auto'
   * @default 768
   */
  mobileBreakpoint?: number;

  /**
   * Which view to show on mobile when viewMode is 'auto'
   * @default 'cards'
   */
  mobileViewMode?: ResolvedViewMode;

  /**
   * Enable user toggle between table and cards view.
   * When true, shows toggle buttons and allows user to switch views.
   * @default false
   */
  enableToggle?: boolean;

  /**
   * Default view mode when toggle is enabled.
   * Only used when enableToggle is true.
   * @default 'table'
   */
  defaultViewMode?: ResolvedViewMode;

  /**
   * Persist view mode preference to localStorage.
   * - true: Uses generic key 'listpage-view-mode'
   * - string: Uses provided string as localStorage key
   * - false/undefined: No persistence
   * @default false
   */
  persistViewMode?: boolean | string;
}

/**
 * Result from useViewMode hook
 */
export interface UseViewModeResult {
  /**
   * The resolved view mode to render
   * Will never be 'auto' - always resolves to 'table', 'cards', or 'graph'
   */
  resolvedViewMode: ResolvedViewMode;

  /**
   * Whether the current viewport is considered mobile
   */
  isMobile: boolean;

  /**
   * Whether the original viewMode was 'auto'
   */
  isAuto: boolean;

  /**
   * Whether currently showing table view
   */
  isTableView: boolean;

  /**
   * Whether currently showing cards view
   */
  isCardsView: boolean;

  /**
   * Whether currently showing graph view
   */
  isGraphView: boolean;

  /**
   * Whether toggle is enabled
   */
  isToggleEnabled: boolean;

  /**
   * Set the view mode (only works when toggle is enabled)
   */
  setViewMode: (mode: ResolvedViewMode) => void;

  /**
   * Toggle between table and cards (only works when toggle is enabled)
   * Note: For graph toggle, use setViewMode directly
   */
  toggleViewMode: () => void;
}

/**
 * Get localStorage key for view mode persistence
 */
function getStorageKey(persistViewMode: boolean | string | undefined): string | null {
  if (!persistViewMode) return null;
  if (typeof persistViewMode === 'string') return persistViewMode;
  return 'listpage-view-mode';
}

/**
 * Get initial view mode from localStorage or default
 */
function getInitialViewMode(
  persistViewMode: boolean | string | undefined,
  defaultViewMode: ResolvedViewMode
): ResolvedViewMode {
  if (typeof window === 'undefined') return defaultViewMode;

  const storageKey = getStorageKey(persistViewMode);
  if (!storageKey) return defaultViewMode;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'table' || stored === 'cards' || stored === 'graph') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return defaultViewMode;
}

/**
 * useViewMode - Resolves view mode for ListPage
 *
 * Handles the 'auto' view mode by detecting screen size and
 * resolving to either 'table' or 'cards' based on viewport.
 *
 * When enableToggle is true, allows user to manually switch views
 * with optional localStorage persistence.
 *
 * @example Basic usage (no toggle)
 * ```tsx
 * const { resolvedViewMode, isCardsView } = useViewMode({
 *   viewMode: 'auto',
 *   mobileBreakpoint: 768,
 * });
 *
 * if (isCardsView) {
 *   return <CardView items={items} />;
 * }
 * return <TableView rows={rows} />;
 * ```
 *
 * @example With user toggle
 * ```tsx
 * const { resolvedViewMode, setViewMode, toggleViewMode } = useViewMode({
 *   viewMode: 'table', // Initial/fallback
 *   enableToggle: true,
 *   defaultViewMode: 'table',
 *   persistViewMode: 'my-list-view', // localStorage key
 * });
 *
 * // In your UI:
 * <button onClick={toggleViewMode}>Switch View</button>
 * // or
 * <button onClick={() => setViewMode('cards')}>Cards</button>
 * ```
 */
export function useViewMode({
  viewMode,
  mobileBreakpoint = 768,
  mobileViewMode = 'cards',
  enableToggle = false,
  defaultViewMode = 'table',
  persistViewMode = false,
}: UseViewModeOptions): UseViewModeResult {
  // Detect mobile viewport
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`);
  const isAuto = viewMode === 'auto';

  // User-selected view mode (only used when toggle is enabled)
  const [userViewMode, setUserViewMode] = useState<ResolvedViewMode>(() =>
    getInitialViewMode(persistViewMode, defaultViewMode)
  );

  // Persist to localStorage when user changes view mode
  useEffect(() => {
    if (!enableToggle) return;

    const storageKey = getStorageKey(persistViewMode);
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, userViewMode);
    } catch {
      // localStorage not available
    }
  }, [enableToggle, persistViewMode, userViewMode]);

  // Resolve the actual view mode
  const resolvedViewMode = useMemo<ResolvedViewMode>(() => {
    // When toggle is enabled, user preference takes priority
    if (enableToggle) {
      return userViewMode;
    }

    // Graph mode: always resolve to 'graph'
    if (viewMode === 'graph') {
      return 'graph';
    }

    // Auto mode: switch based on screen size
    if (viewMode === 'auto') {
      return isMobile ? mobileViewMode : 'table';
    }

    // Static mode (table or cards)
    return viewMode;
  }, [enableToggle, userViewMode, viewMode, isMobile, mobileViewMode]);

  // Set view mode handler
  const setViewMode = useCallback((mode: ResolvedViewMode) => {
    if (enableToggle) {
      setUserViewMode(mode);
    }
  }, [enableToggle]);

  // Toggle view mode handler
  const toggleViewMode = useCallback(() => {
    if (enableToggle) {
      setUserViewMode((current) => (current === 'table' ? 'cards' : 'table'));
    }
  }, [enableToggle]);

  return {
    resolvedViewMode,
    isMobile,
    isAuto,
    isTableView: resolvedViewMode === 'table',
    isCardsView: resolvedViewMode === 'cards',
    isGraphView: resolvedViewMode === 'graph',
    isToggleEnabled: enableToggle,
    setViewMode,
    toggleViewMode,
  };
}
