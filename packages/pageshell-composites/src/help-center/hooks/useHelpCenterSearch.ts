/**
 * useHelpCenterSearch Hook
 *
 * Handles search state and filtering for HelpCenterPage.
 *
 * @module help-center/hooks/useHelpCenterSearch
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  HelpCenterFAQSection,
  HelpCenterArticleConfig,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseHelpCenterSearchOptions {
  /** FAQ sections to search */
  faqSections?: HelpCenterFAQSection[];
  /** Articles to search */
  articles?: HelpCenterArticleConfig[];
  /** Initial search query */
  initialQuery?: string;
  /** External search handler */
  onSearch?: (query: string) => void;
}

export interface UseHelpCenterSearchResult {
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Whether currently searching */
  isSearching: boolean;
  /** Filtered FAQ sections */
  filteredFAQSections: HelpCenterFAQSection[];
  /** Filtered articles */
  filteredArticles: HelpCenterArticleConfig[];
  /** Clear search */
  clearSearch: () => void;
  /** Handle form submit */
  handleSearchSubmit: (e: React.FormEvent) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useHelpCenterSearch(
  options: UseHelpCenterSearchOptions
): UseHelpCenterSearchResult {
  const {
    faqSections = [],
    articles = [],
    initialQuery = '',
    onSearch,
  } = options;

  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Whether we're in search mode
  const isSearching = searchQuery.trim().length > 0;

  // Filter FAQ sections based on search
  const filteredFAQSections = useMemo(() => {
    if (!isSearching) return [];

    const query = searchQuery.toLowerCase();

    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [faqSections, searchQuery, isSearching]);

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!isSearching) return [];

    const query = searchQuery.toLowerCase();

    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query)
    );
  }, [articles, searchQuery, isSearching]);

  // Handle search query change
  const handleSetSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearch?.(query);
    },
    [onSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    onSearch?.('');
  }, [onSearch]);

  // Handle form submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Search is reactive, just prevent page reload
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    isSearching,
    filteredFAQSections,
    filteredArticles,
    clearSearch,
    handleSearchSubmit,
  };
}
