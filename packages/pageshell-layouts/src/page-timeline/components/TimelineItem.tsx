/**
 * TimelineItem Component
 *
 * Individual timeline item for PageTimeline.
 *
 * @package @pageshell/layouts
 */

'use client';

import { cn, formatCompactRelativeTime, getInitials } from '@pageshell/core';
import { iconColorClasses } from '../constants';
import type { PageTimelineItemProps } from '../types';

// =============================================================================
// Component
// =============================================================================

export function TimelineItem({
  icon: Icon,
  iconColor = 'default',
  avatar,
  title,
  description,
  timestamp,
  children,
  className,
}: PageTimelineItemProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Icon/Avatar */}
      <div
        className={cn(
          'absolute -left-8 flex items-center justify-center rounded-full border',
          avatar ? 'w-8 h-8' : 'w-6 h-6',
          !avatar && iconColorClasses[iconColor]
        )}
      >
        {avatar ? (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {avatar.src ? (
              <img src={avatar.src} alt={avatar.alt} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium">
                {avatar.fallback ?? getInitials(avatar.alt)}
              </span>
            )}
          </div>
        ) : Icon ? (
          <Icon className="h-3.5 w-3.5" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>

      {/* Content */}
      <div className="ml-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <time
            dateTime={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            {formatCompactRelativeTime(timestamp, { showSuffix: true })}
          </time>
        </div>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

TimelineItem.displayName = 'PageTimeline.Item';
