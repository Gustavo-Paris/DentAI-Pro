/**
 * PageToggleGroup Component
 *
 * A multi-select toggle button group for selecting multiple options.
 * Supports icons, sizes, and visual variants including a glow effect.
 *
 * @module toggle-group
 *
 * @example Basic usage
 * ```tsx
 * <PageToggleGroup
 *   value={selectedRoles}
 *   onChange={setSelectedRoles}
 *   options={[
 *     { value: 'pm', label: 'Product Manager' },
 *     { value: 'dev', label: 'Developer' },
 *   ]}
 * />
 * ```
 *
 * @example With icons and glow effect
 * ```tsx
 * <PageToggleGroup
 *   value={selectedCategories}
 *   onChange={setSelectedCategories}
 *   options={[
 *     { value: 'design', label: 'Design', icon: 'palette' },
 *     { value: 'code', label: 'Code', icon: 'code' },
 *   ]}
 *   variant="glow"
 *   helpText="Select the categories you're interested in"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn, useHandlerMap } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { PageToggleGroupProps, ToggleGroupSize } from './types';

// =============================================================================
// Size Classes
// =============================================================================

const SIZE_CLASSES: Record<ToggleGroupSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const ICON_SIZE_CLASSES: Record<ToggleGroupSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

// =============================================================================
// Component
// =============================================================================

export function PageToggleGroup({
  value,
  onChange,
  options,
  helpText,
  disabled = false,
  size = 'md',
  variant = 'glow',
  className,
}: PageToggleGroupProps) {
  // Use useHandlerMap for toggle handlers in the options map loop
  const { getHandler: getToggleHandler } = useHandlerMap((optionValue: string) => {
    if (disabled) return;

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  });

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled = disabled || option.disabled;
          const Icon = option.icon ? resolveIcon(option.icon) : null;

          return (
            <button
              key={option.value}
              type="button"
              onClick={getToggleHandler(option.value)}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                SIZE_CLASSES[size],
                isSelected
                  ? 'bg-primary text-foreground'
                  : 'bg-muted text-muted-foreground border border-border hover:border-primary'
              )}
              style={
                isSelected && variant === 'glow'
                  ? {
                      boxShadow: '0 0 12px oklch(from var(--color-primary) l c h / 0.4)',
                    }
                  : undefined
              }
            >
              {Icon && <Icon className={ICON_SIZE_CLASSES[size]} />}
              {option.label}
            </button>
          );
        })}
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground mt-2">{helpText}</p>
      )}
    </div>
  );
}

PageToggleGroup.displayName = 'PageToggleGroup';
