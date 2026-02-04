/**
 * SearchInput Primitive
 *
 * Search input with icon and clear button.
 * Consolidates the common search pattern used across composites.
 *
 * @module input/SearchInput
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Search, X } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Container className */
  containerClassName?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SearchInput component
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 *
 * <SearchInput
 *   value={search}
 *   onValueChange={setSearch}
 *   placeholder="Buscar..."
 * />
 * ```
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      value,
      onValueChange,
      onClear,
      placeholder = 'Search...',
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      onValueChange('');
      onClear?.();
    };

    return (
      <div className={cn('relative', containerClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            // Use text-base (16px) to prevent iOS Safari zoom on focus
            'w-full min-h-[44px] pl-10 pr-10 py-2 text-base',
            'bg-muted border border-border rounded-lg',
            'text-foreground placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
