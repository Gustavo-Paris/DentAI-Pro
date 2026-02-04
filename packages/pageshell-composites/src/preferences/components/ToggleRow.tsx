/**
 * ToggleRow Component
 *
 * Preference item row with icon, label, description, and toggle.
 *
 * @module preferences/components/ToggleRow
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { Loader2 } from 'lucide-react';
import type { PreferenceItem } from '../types';
import { iconColorClasses } from '../constants';
import { Toggle } from './Toggle';

export interface ToggleRowProps {
  preference: PreferenceItem;
  checked: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export function ToggleRow({ preference, checked, onToggle, isLoading }: ToggleRowProps) {
  const Icon = resolveIcon(preference.icon);

  // Generate IDs for aria-describedby
  const descriptionId = preference.description
    ? `${preference.key}-description`
    : undefined;
  const disabledReasonId =
    preference.disabled && preference.disabledReason
      ? `${preference.key}-disabled-reason`
      : undefined;

  // Combine IDs for aria-describedby
  const describedBy =
    [descriptionId, disabledReasonId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              'mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center',
              'bg-muted',
              preference.iconColor && iconColorClasses[preference.iconColor]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="space-y-1">
          <label
            htmlFor={preference.key}
            className={cn(
              'text-sm font-medium text-foreground cursor-pointer',
              preference.disabled && 'cursor-not-allowed'
            )}
          >
            {preference.label}
          </label>
          {preference.description && (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {preference.description}
            </p>
          )}
          {preference.disabled && preference.disabledReason && (
            <p
              id={disabledReasonId}
              className="text-xs text-muted-foreground italic"
            >
              {preference.disabledReason}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Toggle
          id={preference.key}
          checked={checked}
          onChange={onToggle}
          disabled={preference.disabled || isLoading}
          label={preference.label}
          describedBy={describedBy}
        />
      </div>
    </div>
  );
}

ToggleRow.displayName = 'ToggleRow';
