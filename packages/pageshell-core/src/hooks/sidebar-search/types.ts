/**
 * Sidebar Search Types
 *
 * @module hooks/sidebar-search/types
 */

import type React from 'react';

// =============================================================================
// Navigation Item Types
// =============================================================================

export interface SearchableNavItem {
  /** Navigation href */
  href: string;
  /** Display title */
  title: string;
  /** Icon identifier (string or component) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: string | React.ComponentType<any>;
  /** Section label this item belongs to */
  sectionLabel?: string;
  /** Keywords for searching */
  keywords?: string[];
}

export interface SearchableNavSection {
  /** Section label */
  label?: string;
  /** Navigation items */
  items: SearchableNavItem[];
}

// =============================================================================
// Highlight Types
// =============================================================================

export interface HighlightSegment {
  /** Text content of this segment */
  text: string;
  /** Whether this segment is a match */
  isMatch: boolean;
}

// =============================================================================
// Search Result Types
// =============================================================================

export interface SearchResult extends SearchableNavItem {
  /** Match score (higher is better) */
  score: number;
  /** Title split into highlight segments (safe, no HTML) */
  highlightSegments: HighlightSegment[];
}

// =============================================================================
// Hook Options & Return Types
// =============================================================================

export interface UseSidebarSearchOptions {
  /** Navigation sections to search */
  sections: SearchableNavSection[];
  /** Callback when item is selected (receives full SearchResult with score and highlights) */
  onSelect?: (item: SearchResult) => void;
  /** Enable global keyboard shortcut (Cmd+K / Ctrl+K) */
  enableShortcut?: boolean;
  /** Maximum results to show */
  maxResults?: number;
  /** Minimum query length before searching */
  minQueryLength?: number;
}

export interface UseSidebarSearchReturn {
  /** Current search query */
  query: string;
  /** Update the search query */
  setQuery: (query: string) => void;
  /** Filtered and ranked results */
  results: SearchResult[];
  /** Currently selected index in results */
  selectedIndex: number;
  /** Whether search is open/active */
  isOpen: boolean;
  /** Open the search */
  open: () => void;
  /** Close the search */
  close: () => void;
  /** Toggle search open/close */
  toggle: () => void;
  /** Select next result */
  selectNext: () => void;
  /** Select previous result */
  selectPrev: () => void;
  /** Confirm current selection */
  confirmSelection: () => void;
  /** Clear the search */
  clear: () => void;
  /** Props for the search input */
  inputProps: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    'aria-label': string;
    'aria-activedescendant': string | undefined;
    role: 'combobox';
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-autocomplete': 'list';
  };
  /** ID for the results listbox (for aria-controls) */
  listboxId: string;
}
