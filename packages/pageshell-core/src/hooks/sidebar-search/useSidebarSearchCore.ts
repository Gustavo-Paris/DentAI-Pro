/**
 * useSidebarSearch - Search logic for sidebar navigation
 *
 * Features:
 * - Fuzzy search across navigation items
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Keyboard shortcut (Cmd+K / Ctrl+K)
 * - Match highlighting (safe, no HTML injection)
 *
 * @module hooks/sidebar-search/useSidebarSearchCore
 */

'use client';

import type React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  SearchResult,
  UseSidebarSearchOptions,
  UseSidebarSearchReturn,
} from './types';
import { fuzzyScore, createHighlightSegments, flattenSections } from './utils';

// =============================================================================
// Counter
// =============================================================================

let searchIdCounter = 0;

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for sidebar search functionality.
 *
 * @example
 * ```tsx
 * function SidebarSearch() {
 *   const { inputProps, results, isOpen, open, close, selectedIndex } = useSidebarSearch({
 *     sections: navSections,
 *     onSelect: (item) => router.push(item.href),
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={open}>
 *         <SearchIcon />
 *       </button>
 *
 *       {isOpen && (
 *         <div>
 *           <input {...inputProps} />
 *           <ul>
 *             {results.map((result, i) => (
 *               <li key={result.href} aria-selected={i === selectedIndex}>
 *                 {result.highlightSegments.map((seg, j) => (
 *                   <span key={j} className={seg.isMatch ? 'bg-yellow-200' : ''}>
 *                     {seg.text}
 *                   </span>
 *                 ))}
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useSidebarSearch(
  options: UseSidebarSearchOptions
): UseSidebarSearchReturn {
  const {
    sections,
    onSelect,
    enableShortcut = true,
    maxResults = 10,
    minQueryLength = 1,
  } = options;

  // Unique ID for this instance
  const instanceId = useRef(`sidebar-search-${++searchIdCounter}`);
  const listboxId = `${instanceId.current}-listbox`;

  // =============================================================================
  // State
  // =============================================================================

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // =============================================================================
  // Derived State
  // =============================================================================

  const allItems = useMemo(() => flattenSections(sections), [sections]);

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < minQueryLength) return [];

    const scored = allItems
      .map((item) => {
        // Score based on title
        let score = fuzzyScore(query, item.title);

        // Boost if matches section label
        if (item.sectionLabel) {
          const sectionScore = fuzzyScore(query, item.sectionLabel);
          score = Math.max(score, sectionScore * 0.5);
        }

        // Boost if matches keywords
        if (item.keywords) {
          for (const keyword of item.keywords) {
            const keywordScore = fuzzyScore(query, keyword);
            score = Math.max(score, keywordScore * 0.7);
          }
        }

        return {
          ...item,
          score,
          highlightSegments: createHighlightSegments(query, item.title),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scored;
  }, [query, allItems, maxResults, minQueryLength]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // =============================================================================
  // Actions
  // =============================================================================

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  }, [results.length]);

  const selectPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  }, [results.length]);

  const confirmSelection = useCallback(() => {
    const selected = results[selectedIndex];
    if (selected) {
      onSelect?.(selected);
      close();
    }
  }, [results, selectedIndex, onSelect, close]);

  const clear = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
  }, []);

  // =============================================================================
  // Keyboard Shortcut (Cmd+K / Ctrl+K)
  // =============================================================================

  useEffect(() => {
    if (!enableShortcut || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, toggle]);

  // =============================================================================
  // Input Props
  // =============================================================================

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectPrev();
          break;
        case 'Enter':
          e.preventDefault();
          confirmSelection();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [selectNext, selectPrev, confirmSelection, close]
  );

  const inputProps = useMemo(
    () => ({
      value: query,
      onChange: handleInputChange,
      onKeyDown: handleInputKeyDown,
      placeholder: 'Buscar...',
      'aria-label': 'Buscar navegação',
      'aria-activedescendant': results[selectedIndex]
        ? `${listboxId}-option-${selectedIndex}`
        : undefined,
      role: 'combobox' as const,
      'aria-expanded': isOpen && results.length > 0,
      'aria-controls': listboxId,
      'aria-autocomplete': 'list' as const,
    }),
    [query, handleInputChange, handleInputKeyDown, results, selectedIndex, isOpen, listboxId]
  );

  // =============================================================================
  // Return
  // =============================================================================

  return {
    query,
    setQuery,
    results,
    selectedIndex,
    isOpen,
    open,
    close,
    toggle,
    selectNext,
    selectPrev,
    confirmSelection,
    clear,
    inputProps,
    listboxId,
  };
}
