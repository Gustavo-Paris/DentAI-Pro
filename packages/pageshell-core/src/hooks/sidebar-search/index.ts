/**
 * Sidebar Search Module
 *
 * Provides fuzzy search functionality for sidebar navigation with:
 * - Fuzzy search across navigation items
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Keyboard shortcut (Cmd+K / Ctrl+K)
 * - Match highlighting (safe, no HTML injection)
 *
 * @module hooks/sidebar-search
 */

// Main hook
export { useSidebarSearch } from './useSidebarSearchCore';

// Types
export type {
  SearchableNavItem,
  SearchableNavSection,
  HighlightSegment,
  SearchResult,
  UseSidebarSearchOptions,
  UseSidebarSearchReturn,
} from './types';

// Utilities (for extension)
export { fuzzyScore, createHighlightSegments, flattenSections } from './utils';
