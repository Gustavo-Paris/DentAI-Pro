/**
 * PageSearch Types
 *
 * @package @pageshell/interactions
 */

import type { ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

/** Search variant */
export type PageSearchVariant = 'default' | 'minimal' | 'expanded';

/** Filter option */
export interface PageSearchFilterOption {
  value: string;
  label: string;
}

/** Filter configuration */
export interface PageSearchFilter {
  key: string;
  label: string;
  options: PageSearchFilterOption[];
}

/**
 * PageSearch component props
 */
export interface PageSearchProps<T = unknown> {
  // Value
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler (on Enter) */
  onSubmit?: (value: string) => void;

  // Autocomplete
  /** Suggestion items */
  suggestions?: T[];
  /** Render function for suggestions */
  renderSuggestion?: (item: T, index: number) => ReactNode;
  /** Suggestion select handler */
  onSuggestionSelect?: (item: T) => void;
  /** Key extractor for suggestions */
  suggestionKeyExtractor?: (item: T) => string;
  /** Loading state for suggestions */
  isLoadingSuggestions?: boolean;

  // Recent searches
  /** Recent search strings */
  recentSearches?: string[];
  /** Clear recent searches handler */
  onClearRecent?: () => void;
  /** Recent search select handler */
  onRecentSelect?: (search: string) => void;
  /** Max recent items to show */
  maxRecent?: number;

  // Filters
  /** Filter configurations */
  filters?: PageSearchFilter[];
  /** Active filter values */
  activeFilters?: Record<string, string>;
  /** Filter change handler */
  onFilterChange?: (key: string, value: string | null) => void;

  // Layout
  /** Visual variant */
  variant?: PageSearchVariant;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Show clear button */
  showClearButton?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;

  // Keyboard shortcuts
  /** Enable global Command+K / Ctrl+K shortcut to focus */
  enableGlobalShortcut?: boolean;
  /** Custom keyboard shortcut key (default: 'k') */
  shortcutKey?: string;
  /** Show shortcut hint in input */
  showShortcutHint?: boolean;

  // Accessibility
  /** Accessible label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional CSS classes */
  className?: string;
}
