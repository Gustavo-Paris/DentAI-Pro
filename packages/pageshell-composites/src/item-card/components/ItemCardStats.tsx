/**
 * ItemCardStats Component
 *
 * Stats row with icons and labels.
 *
 * @module item-card/components/ItemCardStats
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon } from '@pageshell/primitives';
import type { ItemCardStatsProps } from '../types';
import { useItemCardContext } from '../context';
import { sizeClasses } from '../constants';

export function ItemCardStats({ stats, className }: ItemCardStatsProps) {
  const { size } = useItemCardContext();
  const sizes = sizeClasses[size ?? 'md'];

  if (!stats || stats.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 text-muted-foreground mb-4',
        sizes.stats,
        className
      )}
    >
      {stats.map((stat, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5"
          title={stat.tooltip}
        >
          {stat.icon && <PageIcon name={stat.icon} className="h-3.5 w-3.5" />}
          {stat.label}
        </span>
      ))}
    </div>
  );
}

ItemCardStats.displayName = 'ItemCardStats';
