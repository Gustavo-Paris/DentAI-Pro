/**
 * SettingsPage Section Item
 *
 * Sidebar navigation item for SettingsPage.
 *
 * @module settings/components/SectionItem
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface SectionItemProps {
  /** Section configuration */
  section: {
    id: string;
    label: string;
    icon?: IconProp;
    description?: string;
  };
  /** Whether this section is active */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Ref callback for button */
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

// =============================================================================
// Component
// =============================================================================

export const SectionItem = React.memo(function SectionItem({
  section,
  isActive,
  onClick,
  buttonRef,
}: SectionItemProps) {
  const Icon = resolveIcon(section.icon);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
        'hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && 'bg-muted font-medium'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-5 w-5 mt-0.5 flex-shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm transition-colors',
            isActive ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {section.label}
        </div>
        {section.description && (
          <div className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
            {section.description}
          </div>
        )}
      </div>
    </button>
  );
});

SectionItem.displayName = 'SectionItem';
