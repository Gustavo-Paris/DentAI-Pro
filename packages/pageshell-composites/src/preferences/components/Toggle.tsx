/**
 * Toggle Component
 *
 * Accessible toggle switch for preferences.
 *
 * @module preferences/components/Toggle
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';

export interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  describedBy?: string;
}

export function Toggle({ id, checked, onChange, disabled, label, describedBy }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      className={cn(
        'relative shrink-0 w-11 h-6 rounded-full transition-colors touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-popover shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

Toggle.displayName = 'Toggle';
