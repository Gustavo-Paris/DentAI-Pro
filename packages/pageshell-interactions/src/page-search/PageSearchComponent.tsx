/**
 * PageSearch Component
 *
 * An advanced search input with autocomplete, recent searches, and filter chips.
 * Implements the combobox accessibility pattern.
 *
 * @package @pageshell/interactions
 *
 * @example Basic search
 * <PageSearch
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Buscar cursos..."
 * />
 *
 * @example With autocomplete
 * <PageSearch
 *   value={query}
 *   onChange={setQuery}
 *   suggestions={suggestions}
 *   isLoadingSuggestions={isLoading}
 *   onSuggestionSelect={(item) => router.push(`/courses/${item.id}`)}
 *   renderSuggestion={(item) => (
 *     <div className="flex items-center gap-2">
 *       <img src={item.thumbnail} className="w-8 h-8 rounded" />
 *       <span>{item.title}</span>
 *     </div>
 *   )}
 * />
 *
 * @example With recent searches
 * <PageSearch
 *   value={query}
 *   onChange={setQuery}
 *   recentSearches={recentSearches}
 *   onClearRecent={clearRecentSearches}
 *   onRecentSelect={handleRecentSelect}
 * />
 *
 * @example With filters
 * <PageSearch
 *   value={query}
 *   onChange={setQuery}
 *   filters={[
 *     { key: 'category', label: 'Categoria', options: categories },
 *     { key: 'level', label: 'Nivel', options: levels },
 *   ]}
 *   activeFilters={activeFilters}
 *   onFilterChange={handleFilterChange}
 * />
 */

'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Input } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import { variantStyles } from './constants';
import { FilterChips, SearchDropdown } from './components';
import type { PageSearchProps } from './types';

// =============================================================================
// PageSearch Component
// =============================================================================

export function PageSearch<T = unknown>({
  // Value
  value,
  onChange,
  onSubmit,
  // Autocomplete
  suggestions = [],
  renderSuggestion,
  onSuggestionSelect,
  suggestionKeyExtractor,
  isLoadingSuggestions = false,
  // Recent searches
  recentSearches = [],
  onClearRecent,
  onRecentSelect,
  maxRecent = 5,
  // Filters
  filters = [],
  activeFilters = {},
  onFilterChange,
  // Layout
  variant = 'default',
  placeholder = 'Buscar...',
  debounceMs = 300,
  showClearButton = true,
  autoFocus = false,
  // Keyboard shortcuts
  enableGlobalShortcut = false,
  shortcutKey = 'k',
  showShortcutHint = false,
  // Accessibility
  ariaLabel,
  testId,
  className,
}: PageSearchProps<T>) {
  // Try to get context, but don't fail if not available
  let config;
  try {
    const context = usePageShellContext();
    config = context.config;
  } catch {
    config = { animate: '' };
  }

  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const styles = variantStyles[variant];

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      setHighlightedIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (Command+K / Ctrl+K)
  useEffect(() => {
    if (!enableGlobalShortcut) return;

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Check for Command+K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableGlobalShortcut, shortcutKey]);

  // Detect platform for shortcut hint
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHintText = isMac ? `\u2318${shortcutKey.toUpperCase()}` : `Ctrl+${shortcutKey.toUpperCase()}`;

  // Items to show in dropdown
  const recentToShow = recentSearches.slice(0, maxRecent);
  const hasRecent = recentToShow.length > 0 && !localValue;
  const hasSuggestions = suggestions.length > 0 && localValue.length > 0;
  const showDropdown = isOpen && (hasRecent || hasSuggestions || isLoadingSuggestions);

  // Total items for keyboard navigation
  const totalItems = hasRecent ? recentToShow.length : suggestions.length;

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onChange(localValue);
    onSubmit?.(localValue);
    setIsOpen(false);
  }, [localValue, onChange, onSubmit]);

  // Handle suggestion select
  const handleSuggestionSelectInternal = useCallback(
    (item: T) => {
      onSuggestionSelect?.(item);
      setIsOpen(false);
    },
    [onSuggestionSelect]
  );

  // Handle recent select
  const handleRecentSelectInternal = useCallback(
    (search: string) => {
      setLocalValue(search);
      onChange(search);
      onRecentSelect?.(search);
      setIsOpen(false);
    },
    [onChange, onRecentSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            if (hasRecent) {
              handleRecentSelectInternal(recentToShow[highlightedIndex]!);
            } else if (hasSuggestions) {
              handleSuggestionSelectInternal(suggestions[highlightedIndex]!);
            }
          } else {
            handleSubmit();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [
      isOpen,
      totalItems,
      highlightedIndex,
      hasRecent,
      hasSuggestions,
      recentToShow,
      suggestions,
      handleRecentSelectInternal,
      handleSuggestionSelectInternal,
      handleSubmit,
    ]
  );

  // Get suggestion key
  const getSuggestionKey = (item: T, index: number): string => {
    if (suggestionKeyExtractor) {
      return suggestionKeyExtractor(item);
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if ('id' in obj) return String(obj.id);
      if ('_id' in obj) return String(obj._id);
    }
    return String(index);
  };

  // Handler for input focus
  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative', styles.container, className)}
      data-testid={testId}
    >
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'pl-10',
            showShortcutHint && enableGlobalShortcut && !localValue ? 'pr-20' : 'pr-10',
            styles.input
          )}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-label={ariaLabel ?? placeholder}
          aria-controls={showDropdown ? 'search-listbox' : undefined}
          aria-activedescendant={
            highlightedIndex >= 0 ? `search-option-${highlightedIndex}` : undefined
          }
        />
        {/* Clear, Loading, or Shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoadingSuggestions ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : localValue && showClearButton ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : showShortcutHint && enableGlobalShortcut ? (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-muted border border-border rounded">
              {shortcutHintText}
            </kbd>
          ) : null}
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
      />

      {/* Dropdown */}
      <SearchDropdown
        isOpen={isOpen}
        highlightedIndex={highlightedIndex}
        localValue={localValue}
        animateClass={config.animate}
        listRef={listRef}
        recentSearches={recentSearches}
        maxRecent={maxRecent}
        onClearRecent={onClearRecent}
        onRecentSelect={handleRecentSelectInternal}
        suggestions={suggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        renderSuggestion={renderSuggestion}
        onSuggestionSelect={handleSuggestionSelectInternal}
        getSuggestionKey={getSuggestionKey}
      />
    </div>
  );
}
