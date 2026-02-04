/**
 * SearchInput Component
 *
 * Debounced search input for PageToolbar.
 *
 * @package @pageshell/layouts
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@pageshell/core';
import type { PageToolbarSearch, PageToolbarVariant } from '../types';

// =============================================================================
// Component
// =============================================================================

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar...',
  debounceMs = 300,
  variant,
}: PageToolbarSearch & { variant: PageToolbarVariant }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onChange(localValue);
      onSubmit(localValue);
    }
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <Search
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
          variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'flex w-full rounded-md border border-border bg-background px-3 py-2',
          'text-sm ring-offset-background file:border-0 file:bg-transparent',
          'file:text-sm file:font-medium placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'pl-9 pr-8',
          variant === 'compact' && 'h-8 text-sm'
        )}
        aria-label={placeholder}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm',
            'text-muted-foreground hover:text-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
