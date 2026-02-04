/**
 * SidebarSearch - Search component for sidebar navigation
 *
 * Features:
 * - Cmd+K / Ctrl+K keyboard shortcut
 * - Fuzzy search with highlighting
 * - Keyboard navigation
 * - Accessible with proper ARIA
 * - Collapsed mode: icon-only with tooltip
 *
 * @module primitives/SidebarSearch
 */

'use client';

import * as React from 'react';
import { Search, Command, X } from 'lucide-react';
import {
  cn,
  useSidebarSearch,
  type SearchableNavSection,
  type SearchResult,
} from '@pageshell/core';
import { Dialog, DialogContent, DialogTitle, Tooltip, TooltipTrigger, TooltipContent } from '@pageshell/primitives';
import { resolveIcon } from '@pageshell/primitives';
import { useLayoutAdapters } from './LayoutContext';
import { useCollapsibleSidebarOptional } from './CollapsibleSidebar';

// =============================================================================
// Types
// =============================================================================

export interface SidebarSearchProps {
  /** Navigation sections to search */
  sections: SearchableNavSection[];
  /** Callback when item is selected (receives the full SearchResult) */
  onSelect?: (item: SearchResult) => void;
  /** Show in sidebar header as input (default: false, shows as button) */
  inline?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show keyboard shortcut hint (default: true) */
  showShortcut?: boolean;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Search component for sidebar navigation.
 *
 * @example
 * ```tsx
 * <SidebarSearch
 *   sections={navSections}
 *   onSelect={(item) => router.push(item.href)}
 * />
 * ```
 */
export function SidebarSearch({
  sections,
  onSelect,
  inline = false,
  placeholder = 'Buscar...',
  showShortcut = true,
  className,
}: SidebarSearchProps) {
  const { renderLink } = useLayoutAdapters();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const collapsible = useCollapsibleSidebarOptional();
  const isCollapsed = collapsible?.isCollapsed ?? false;

  // Store refs to result items for programmatic click
  const resultRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    query,
    results,
    selectedIndex,
    isOpen,
    open,
    close,
    inputProps: baseInputProps,
    listboxId,
  } = useSidebarSearch({
    sections,
    onSelect,
    enableShortcut: true,
  });

  // Custom Enter handler to click the actual link element
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    baseInputProps.onKeyDown(e);

    // If Enter was pressed and we have a selected result, click the link
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      const selectedRef = resultRefs.current.get(selectedIndex);
      if (selectedRef) {
        const link = selectedRef.querySelector('a');
        if (link) {
          link.click();
          close();
        }
      }
    }
  };

  const inputProps = {
    ...baseInputProps,
    onKeyDown: handleKeyDown,
  };

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Collapsed: icon-only button with tooltip
  if (isCollapsed) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={open}
              className={cn(
                'flex items-center justify-center w-full p-2.5 rounded-lg',
                'bg-sidebar-accent/30 hover:bg-sidebar-accent',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                'transition-colors',
                className
              )}
              aria-label={placeholder}
            >
              <Search className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <span>{placeholder}</span>
            {showShortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted">⌘K</kbd>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Search dialog - same as default variant */}
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
          <DialogContent
            className="p-0 gap-0 max-w-lg"
            style={{
              backgroundColor: 'var(--color-popover, #1e1e1e)',
              color: 'var(--color-popover-foreground, #fafafa)',
            }}
          >
            <DialogTitle className="sr-only">Buscar na navegação</DialogTitle>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                {...inputProps}
                placeholder={placeholder}
                className={cn(
                  'flex-1 bg-transparent text-base',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none'
                )}
              />
              {query && (
                <button
                  onClick={() => close()}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div
              id={listboxId}
              role="listbox"
              className="max-h-[60vh] overflow-y-auto p-2"
            >
              {query && results.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              )}
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.href}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={close}
                  renderLink={renderLink}
                  listboxId={listboxId}
                  index={index}
                  itemRef={(el) => {
                    if (el) {
                      resultRefs.current.set(index, el);
                    } else {
                      resultRefs.current.delete(index);
                    }
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd>
                  selecionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd>
                  fechar
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Inline variant: shows as compact input in sidebar header
  if (inline) {
    return (
      <div className={cn('relative', className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
        <input
          ref={inputRef}
          {...inputProps}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-9 pr-3 rounded-lg',
            'bg-sidebar-accent/50 border border-sidebar-border',
            'text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50',
            'focus:outline-none focus:ring-2 focus:ring-sidebar-primary/50',
            'transition-colors'
          )}
        />
        {results.length > 0 && query && (
          <div
            id={listboxId}
            role="listbox"
            className={cn(
              'absolute top-full left-0 right-0 mt-1 z-50',
              'bg-popover border border-border rounded-lg shadow-lg',
              'max-h-64 overflow-y-auto'
            )}
          >
            {results.map((result, index) => (
              <SearchResultItem
                key={result.href}
                result={result}
                isSelected={index === selectedIndex}
                onClick={() => {
                  onSelect?.(result);
                  close();
                }}
                renderLink={renderLink}
                listboxId={listboxId}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant: shows as button, opens dialog
  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={open}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
          'bg-sidebar-accent/30 hover:bg-sidebar-accent',
          'text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground',
          'transition-colors',
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">{placeholder}</span>
        {showShortcut && (
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-sidebar-accent text-sidebar-foreground/50">
            <Command className="w-3 h-3" />K
          </kbd>
        )}
      </button>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent
          className="p-0 gap-0 max-w-lg"
          style={{
            backgroundColor: 'var(--color-popover, #1e1e1e)',
            color: 'var(--color-popover-foreground, #fafafa)',
          }}
        >
          {/* Accessible title (visually hidden) */}
          <DialogTitle className="sr-only">Buscar na navegação</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              {...inputProps}
              placeholder={placeholder}
              className={cn(
                'flex-1 bg-transparent text-base',
                'placeholder:text-muted-foreground',
                'focus:outline-none'
              )}
            />
            {query && (
              <button
                onClick={() => close()}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div
            id={listboxId}
            role="listbox"
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {query && results.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}

            {results.map((result, index) => (
              <SearchResultItem
                key={result.href}
                result={result}
                isSelected={index === selectedIndex}
                onClick={close}
                renderLink={renderLink}
                listboxId={listboxId}
                index={index}
                itemRef={(el) => {
                  if (el) {
                    resultRefs.current.set(index, el);
                  } else {
                    resultRefs.current.delete(index);
                  }
                }}
              />
            ))}
          </div>

          {/* Footer with keyboard hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd>
                selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd>
                fechar
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// =============================================================================
// Search Result Item
// =============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  renderLink: ReturnType<typeof useLayoutAdapters>['renderLink'];
  listboxId: string;
  index: number;
  itemRef?: (el: HTMLDivElement | null) => void;
}

function SearchResultItem({
  result,
  isSelected,
  onClick,
  renderLink,
  listboxId,
  index,
  itemRef: externalRef,
}: SearchResultItemProps) {
  const Icon = result.icon ? resolveIcon(result.icon) : null;
  const internalRef = React.useRef<HTMLDivElement>(null);

  // Combined ref callback
  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      externalRef?.(el);
    },
    [externalRef]
  );

  // Scroll into view when selected
  React.useEffect(() => {
    if (isSelected && internalRef.current) {
      internalRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const itemClassName = cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
    'transition-colors',
    isSelected
      ? 'bg-primary/10 text-primary'
      : 'hover:bg-muted text-foreground'
  );

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Highlighted title */}
          <span className="truncate">
            {result.highlightSegments.map((segment, i) => (
              <span
                key={i}
                className={segment.isMatch ? 'bg-primary/20 text-primary font-medium' : ''}
              >
                {segment.text}
              </span>
            ))}
          </span>
        </div>
        {result.sectionLabel && (
          <span className="text-xs text-muted-foreground">
            {result.sectionLabel}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div
      ref={setRef}
      id={`${listboxId}-option-${index}`}
      role="option"
      aria-selected={isSelected}
    >
      {renderLink({
        item: { href: result.href, title: result.title, icon: result.icon },
        isActive: false,
        className: itemClassName,
        children: content,
        onClick,
      })}
    </div>
  );
}
