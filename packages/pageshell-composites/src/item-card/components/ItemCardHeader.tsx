/**
 * ItemCardHeader Component
 *
 * Header section with icon/avatar, status badge, and menu actions.
 *
 * @module item-card/components/ItemCardHeader
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { StatusBadge, PageIcon } from '@pageshell/primitives';
import type { ItemCardHeaderProps } from '../types';
import { useItemCardContext } from '../context';
import { sizeClasses, iconColorClasses } from '../constants';
import { ItemCardActions } from './ItemCardActions';

export function ItemCardHeader({
  icon,
  iconColor = 'primary',
  avatar,
  status,
  menuActions,
  children,
  className,
}: ItemCardHeaderProps) {
  const { size } = useItemCardContext();
  const sizes = sizeClasses[size ?? 'md'];

  return (
    <div className={cn('flex items-start justify-between gap-3 mb-3', className)}>
      <div className="flex items-center gap-2.5">
        {/* Icon or Avatar */}
        {(icon || avatar) && (
          <div
            className={cn(
              'rounded-lg flex items-center justify-center flex-shrink-0',
              sizes.icon,
              avatar ? 'overflow-hidden' : iconColorClasses[iconColor]
            )}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : icon ? (
              <PageIcon name={icon} className={sizes.iconInner} />
            ) : null}
          </div>
        )}

        {/* Status badge (from prop or children) */}
        {status && (
          <StatusBadge variant={status.variant} size="sm">
            {status.animate && (
              <PageIcon name="loader" className="h-3 w-3 animate-spin mr-1" />
            )}
            {status.label}
          </StatusBadge>
        )}
        {children}
      </div>

      {/* Actions menu */}
      {menuActions && menuActions.length > 0 && (
        <ItemCardActions menuActions={menuActions} />
      )}
    </div>
  );
}

ItemCardHeader.displayName = 'ItemCardHeader';
