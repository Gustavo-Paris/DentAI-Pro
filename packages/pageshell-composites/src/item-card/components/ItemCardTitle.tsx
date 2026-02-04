/**
 * ItemCardTitle Component
 *
 * Card title with optional truncation.
 *
 * @module item-card/components/ItemCardTitle
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import type { ItemCardTitleProps } from '../types';
import { useItemCardContext } from '../context';
import { sizeClasses } from '../constants';

export function ItemCardTitle({ children, className, truncate = 2 }: ItemCardTitleProps) {
  const { size } = useItemCardContext();
  const sizes = sizeClasses[size ?? 'md'];

  const truncateClass =
    truncate === true
      ? 'truncate'
      : typeof truncate === 'number'
        ? `line-clamp-${truncate}`
        : '';

  return (
    <h3
      className={cn(
        'font-semibold text-foreground leading-snug mb-1.5',
        sizes.title,
        truncateClass,
        className
      )}
    >
      {children}
    </h3>
  );
}

ItemCardTitle.displayName = 'ItemCardTitle';
