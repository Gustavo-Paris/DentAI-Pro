/**
 * CardListPage Section
 *
 * Renders a section of cards with header (icon, label, count).
 *
 * @module card-list/components/CardListSection
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { IconName } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface CardListSectionProps<TItem> {
  /** Section key */
  sectionKey: string;
  /** Items in this section */
  items: TItem[];
  /** Section label */
  label: string;
  /** Section icon name */
  icon?: IconName | string;
  /** Icon CSS class */
  iconClassName?: string;
  /** Label CSS class */
  labelClassName?: string;
  /** Grid CSS class */
  gridClassName?: string;
  /** Render card function */
  renderCard: (item: TItem, index: number) => React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function CardListSection<TItem>({
  sectionKey,
  items,
  label,
  icon,
  iconClassName = 'text-primary',
  labelClassName = '',
  gridClassName,
  renderCard,
}: CardListSectionProps<TItem>) {
  if (items.length === 0) return null;

  return (
    <section key={sectionKey} className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <PageIcon
            name={icon}
            className={cn('h-4 w-4', iconClassName)}
          />
        )}
        <h3 className={cn('text-sm font-semibold uppercase tracking-wider', labelClassName)}>
          {label} ({items.length})
        </h3>
      </div>
      <div className={cn(gridClassName)}>
        {items.map((item, index) => (
          // min-w-0 prevents grid items from overflowing their cell on mobile
          <div key={index} className="min-w-0">
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    </section>
  );
}

CardListSection.displayName = 'CardListSection';
