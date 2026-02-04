/**
 * ThemeSelector Primitive
 *
 * Compact theme mode selector for UserMenu integration.
 * Supports light, dark, and system modes.
 *
 * @module primitives/ThemeSelector
 */

'use client';

import * as React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeSelectorProps {
  /** Current theme mode */
  value: ThemeMode;
  /** Callback when theme mode changes */
  onChange: (mode: ThemeMode) => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

const modes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Escuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
];

/**
 * Compact theme mode selector.
 *
 * @example
 * ```tsx
 * // In UserMenu
 * <UserMenu
 *   user={user}
 *   themeToggle={
 *     <ThemeSelector
 *       value={themeMode}
 *       onChange={setThemeMode}
 *     />
 *   }
 * />
 * ```
 */
export function ThemeSelector({
  value,
  onChange,
  size = 'sm',
  className,
}: ThemeSelectorProps) {
  const sizeClasses = {
    sm: {
      container: 'h-7 p-0.5 gap-0.5',
      button: 'h-6 w-6',
      icon: 'h-3.5 w-3.5',
    },
    md: {
      container: 'h-8 p-1 gap-1',
      button: 'h-6 w-6',
      icon: 'h-4 w-4',
    },
  };

  const { container, button, icon } = sizeClasses[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-muted/50 border border-border',
        container,
        className
      )}
      role="radiogroup"
      aria-label="Select theme"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={mode.label}
            title={mode.label}
            onClick={() => onChange(mode.value)}
            className={cn(
              'flex items-center justify-center rounded transition-all duration-150',
              button,
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className={icon} />
          </button>
        );
      })}
    </div>
  );
}
