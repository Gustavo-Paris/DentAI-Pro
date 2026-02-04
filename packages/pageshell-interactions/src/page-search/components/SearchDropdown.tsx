/**
 * SearchDropdown Component
 *
 * Dropdown for recent searches and suggestions in PageSearch.
 *
 * @package @pageshell/interactions
 */

'use client';

import type { ReactNode, RefObject } from 'react';
import { Clock, ChevronRight, Loader2 } from 'lucide-react';
import { cn, useHandlerMap } from '@pageshell/core';

// =============================================================================
// Props
// =============================================================================

export interface SearchDropdownProps<T> {
  // State
  isOpen: boolean;
  highlightedIndex: number;
  localValue: string;
  animateClass: string;
  listRef: RefObject<HTMLUListElement | null>;

  // Recent searches
  recentSearches: string[];
  maxRecent: number;
  onClearRecent?: () => void;
  onRecentSelect: (search: string) => void;

  // Suggestions
  suggestions: T[];
  isLoadingSuggestions: boolean;
  renderSuggestion?: (item: T, index: number) => ReactNode;
  onSuggestionSelect: (item: T) => void;
  getSuggestionKey: (item: T, index: number) => string;
}

// =============================================================================
// Component
// =============================================================================

export function SearchDropdown<T>({
  isOpen,
  highlightedIndex,
  localValue,
  animateClass,
  listRef,
  recentSearches,
  maxRecent,
  onClearRecent,
  onRecentSelect,
  suggestions,
  isLoadingSuggestions,
  renderSuggestion,
  onSuggestionSelect,
  getSuggestionKey,
}: SearchDropdownProps<T>) {
  // Items to show in dropdown
  const recentToShow = recentSearches.slice(0, maxRecent);
  const hasRecent = recentToShow.length > 0 && !localValue;
  const hasSuggestions = suggestions.length > 0 && localValue.length > 0;
  const showDropdown = isOpen && (hasRecent || hasSuggestions || isLoadingSuggestions);

  // Handler map for recent searches
  const { getHandler: getRecentSearchHandler } = useHandlerMap((search: string) => {
    onRecentSelect(search);
  });

  // Handler map for suggestions
  const { getHandler: getSuggestionHandler } = useHandlerMap((index: number) => {
    const item = suggestions[index];
    if (item) {
      onSuggestionSelect(item);
    }
  });

  if (!showDropdown) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute z-50 w-full mt-1 py-1 rounded-lg border border-border bg-popover shadow-lg',
        animateClass
      )}
    >
      <ul
        ref={listRef}
        id="search-listbox"
        role="listbox"
        className="max-h-64 overflow-y-auto"
      >
        {/* Loading */}
        {isLoadingSuggestions && localValue && (
          <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </li>
        )}

        {/* Recent searches */}
        {hasRecent && (
          <>
            <li className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Buscas recentes
              </span>
              {onClearRecent && (
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </li>
            {recentToShow.map((search, index) => (
              <li
                key={search}
                id={`search-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={getRecentSearchHandler(search)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                  highlightedIndex === index
                    ? 'bg-muted text-foreground'
                    : 'text-foreground hover:bg-muted/50'
                )}
              >
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{search}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </li>
            ))}
          </>
        )}

        {/* Suggestions */}
        {hasSuggestions && !isLoadingSuggestions && (
          <>
            {suggestions.map((item, index) => (
              <li
                key={getSuggestionKey(item, index)}
                id={`search-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={getSuggestionHandler(index)}
                className={cn(
                  'px-3 py-2 cursor-pointer transition-colors',
                  highlightedIndex === index
                    ? 'bg-muted text-foreground'
                    : 'text-foreground hover:bg-muted/50'
                )}
              >
                {renderSuggestion ? (
                  renderSuggestion(item, index)
                ) : (
                  <span className="text-sm">{String(item)}</span>
                )}
              </li>
            ))}
          </>
        )}

        {/* No results */}
        {!isLoadingSuggestions && localValue && suggestions.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            Nenhum resultado encontrado
          </li>
        )}
      </ul>
    </div>
  );
}
