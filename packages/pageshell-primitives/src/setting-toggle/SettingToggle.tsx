'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { cn } from '@pageshell/core';

/**
 * Theme-aware Switch Component
 *
 * A toggle switch that automatically adapts to the current theme (admin, creator, student).
 * Uses CSS custom properties for theming:
 * - --theme-primary: Active/checked color (falls back to primary)
 * - --theme-surface: Inactive/unchecked background
 * - --theme-border: Border color
 *
 * @example
 * // Basic usage
 * <ThemeSwitch checked={enabled} onCheckedChange={setEnabled} />
 *
 * // With id for label association
 * <label htmlFor="notifications">Enable notifications</label>
 * <ThemeSwitch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
 */

export interface ThemeSwitchProps {
  /** Controlled checked state */
  checked: boolean;
  /** Callback when checked state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Optional id for label association */
  id?: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Additional className for the switch */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function ThemeSwitch({
  checked,
  onCheckedChange,
  id,
  disabled = false,
  className,
  size = 'md',
}: ThemeSwitchProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  }, [disabled, onCheckedChange, checked]);

  const sizeClasses = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-3.5 w-3.5',
      translate: checked ? 'translate-x-4' : 'translate-x-0.5',
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: checked ? 'translate-x-6' : 'translate-x-1',
    },
  };

  const { track, thumb, translate } = sizeClasses[size];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200',
        'border border-border',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        track,
        checked
          ? 'bg-primary border-primary'
          : 'bg-muted',
        !disabled && 'hover:opacity-90',
        className
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-background shadow-sm ring-0 transition-transform duration-200',
          thumb,
          translate
        )}
      />
    </button>
  );
}

/**
 * Setting Toggle Component
 *
 * A complete settings row with label, optional description, and theme-aware switch.
 * Perfect for settings pages across all themes.
 *
 * @example
 * <SettingToggle
 *   id="email-notifications"
 *   label="Email Notifications"
 *   description="Receive email updates about your account"
 *   checked={emailEnabled}
 *   onCheckedChange={setEmailEnabled}
 * />
 */

export interface SettingToggleProps extends Omit<ThemeSwitchProps, 'className'> {
  /** Label text displayed next to the switch */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether this is a highlighted/featured setting */
  highlighted?: boolean;
}

export function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  highlighted = false,
  className,
  size = 'md',
}: SettingToggleProps) {
  const toggleId = id || `setting-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        highlighted && 'p-3 rounded-lg bg-muted/50',
        disabled && 'opacity-50',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <label
          htmlFor={toggleId}
          className={cn(
            'text-sm font-medium cursor-pointer',
            disabled ? 'cursor-not-allowed text-muted-foreground' : 'text-foreground'
          )}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ThemeSwitch
        id={toggleId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        size={size}
      />
    </div>
  );
}
