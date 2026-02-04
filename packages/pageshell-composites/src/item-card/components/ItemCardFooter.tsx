/**
 * ItemCardFooter Component
 *
 * Footer with timestamp and action buttons.
 *
 * @module item-card/components/ItemCardFooter
 */

'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@pageshell/core';
import { Button, PageIcon } from '@pageshell/primitives';
import type { ItemCardFooterProps } from '../types';
import { useItemCardContext } from '../context';
import { sizeClasses } from '../constants';
import { formatRelativeTime } from '../utils';

export function ItemCardFooter({
  timestamp,
  timestampIcon = 'clock',
  primaryAction,
  secondaryAction,
  children,
  className,
  LinkComponent,
}: ItemCardFooterProps) {
  const { size, LinkComponent: contextLink } = useItemCardContext();
  const sizes = sizeClasses[size ?? 'md'];
  const Link = LinkComponent ?? contextLink;

  const formattedTime = useMemo(() => {
    if (!timestamp) return null;
    return formatRelativeTime(timestamp);
  }, [timestamp]);

  const renderAction = (action: ItemCardFooterProps['primaryAction'], isPrimary: boolean) => {
    if (!action) return null;

    const content = (
      <Button
        size="sm"
        variant={isPrimary ? 'default' : 'ghost'}
        disabled={action.disabled}
        onClick={action.onClick}
        className={cn(
          'gap-1.5',
          !isPrimary && 'text-muted-foreground hover:text-foreground'
        )}
      >
        {action.loading && (
          <PageIcon name="loader" className="h-3.5 w-3.5 animate-spin" />
        )}
        {action.icon && !action.loading && (
          <PageIcon name={action.icon} className="h-3.5 w-3.5" />
        )}
        {action.label}
      </Button>
    );

    if (action.href && Link) {
      return (
        <Link href={action.href} className="contents">
          {content}
        </Link>
      );
    }

    if (action.href) {
      return (
        <a href={action.href} className="contents">
          {content}
        </a>
      );
    }

    return content;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between pt-3 border-t border-border',
        className
      )}
    >
      {/* Timestamp */}
      {formattedTime && (
        <span
          className={cn(
            'text-muted-foreground inline-flex items-center gap-1.5',
            sizes.footer
          )}
        >
          <PageIcon name={timestampIcon} className="h-3.5 w-3.5" />
          {formattedTime}
        </span>
      )}

      {/* Custom content or actions */}
      {children ? (
        <div className="flex items-center gap-2">{children}</div>
      ) : (primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2">
          {secondaryAction && renderAction(secondaryAction, false)}
          {primaryAction && renderAction(primaryAction, true)}
        </div>
      )}
    </div>
  );
}

ItemCardFooter.displayName = 'ItemCardFooter';
