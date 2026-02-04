/**
 * PageChecklistItem Component
 *
 * A single checklist item with checkbox, label, and optional description.
 * Uses Radix UI Checkbox for accessibility.
 *
 * @module checklist-item
 *
 * @example Basic usage
 * ```tsx
 * <PageChecklistItem
 *   id="task-1"
 *   label="Complete the tutorial"
 *   checked={isComplete}
 *   onChange={setIsComplete}
 * />
 * ```
 *
 * @example With description
 * ```tsx
 * <PageChecklistItem
 *   id="task-2"
 *   label="Review documentation"
 *   description="Read through the API docs before starting"
 *   checked={checked}
 *   onChange={setChecked}
 * />
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <PageChecklistItem
 *   id="task-3"
 *   label="Deploy to production"
 *   checked={false}
 *   onChange={() => {}}
 *   disabled
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Checkbox } from '../checkbox';
import { Label } from '../label';

export interface PageChecklistItemProps {
  /** Unique ID for the checkbox */
  id: string;
  /** Label text */
  label: string;
  /** Optional description */
  description?: string;
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional className for the container */
  className?: string;
}

export function PageChecklistItem({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
}: PageChecklistItemProps) {
  const checkboxSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';
  const gap = size === 'sm' ? 'space-x-2' : 'space-x-3';

  return (
    <div
      className={cn(
        'flex items-start rounded-lg border border-transparent transition-colors',
        padding,
        gap,
        !disabled && 'hover:bg-accent hover:border-border',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={checkboxSize}
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={id}
          className={cn(
            'cursor-pointer font-medium leading-none',
            labelSize,
            disabled && 'cursor-not-allowed opacity-70',
            checked && 'line-through text-muted-foreground'
          )}
        >
          {label}
        </Label>
        {description && (
          <p
            className={cn(
              'mt-1 text-muted-foreground',
              size === 'sm' ? 'text-[10px]' : 'text-xs',
              checked && 'line-through'
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

PageChecklistItem.displayName = 'PageChecklistItem';
