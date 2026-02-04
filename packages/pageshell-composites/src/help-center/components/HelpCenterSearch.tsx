/**
 * HelpCenterSearch Component
 *
 * Search input for help center.
 *
 * @module help-center/components/HelpCenterSearch
 */

'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterSearchProps {
  /** Current search query */
  value: string;
  /** Value change handler */
  onChange: (value: string) => void;
  /** Form submit handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Clear search */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** ARIA label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search for help...',
  ariaLabel = 'Search help center',
  testId = 'help-search',
  className,
}: HelpCenterSearchProps) {
  const hasValue = value.length > 0;

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn('mt-4 max-w-xl mx-auto', className)}
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-lg',
            'border border-border bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-shadow'
          )}
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'p-1 rounded-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors'
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
