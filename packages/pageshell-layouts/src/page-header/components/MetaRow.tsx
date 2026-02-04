/**
 * MetaRow Component
 *
 * Meta information row for PageHeader.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { PageHeaderMeta } from '../types';

// =============================================================================
// Component
// =============================================================================

export function MetaRow({
  items,
  className,
}: {
  items: PageHeaderMeta[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {items.map((item, index) => {
        const Icon = resolveIcon(item.icon);

        return (
          <div
            key={index}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="text-muted-foreground/70">{item.label}:</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
