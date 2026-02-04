/**
 * ItemCardDescription Component
 *
 * Card description/subtitle with optional truncation.
 *
 * @module item-card/components/ItemCardDescription
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import type { ItemCardDescriptionProps } from '../types';
import { useItemCardContext } from '../context';
import { sizeClasses } from '../constants';

export function ItemCardDescription({
  children,
  className,
  truncate = 1,
}: ItemCardDescriptionProps) {
  const { size } = useItemCardContext();
  const sizes = sizeClasses[size ?? 'md'];

  const truncateClass =
    truncate === true
      ? 'truncate'
      : typeof truncate === 'number'
        ? `line-clamp-${truncate}`
        : '';

  return (
    <p
      className={cn(
        'text-muted-foreground mb-4',
        sizes.description,
        truncateClass,
        className
      )}
    >
      {children}
    </p>
  );
}

ItemCardDescription.displayName = 'ItemCardDescription';
