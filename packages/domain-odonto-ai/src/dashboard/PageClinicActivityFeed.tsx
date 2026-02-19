'use client';

/**
 * PageClinicActivityFeed - Activity feed list with timeline
 *
 * Displays a vertical timeline of recent clinic activity (appointments,
 * payments, treatments, patient events, alerts). Each item shows a type
 * icon, title, description, relative timestamp, and optional actor.
 *
 * @example
 * ```tsx
 * <PageClinicActivityFeed
 *   items={[
 *     { id: '1', type: 'appointment', title: 'Appointment completed', description: 'Maria Silva - Cleaning', timestamp: '2026-02-18T10:30:00Z', actor: 'Dr. Santos' },
 *     { id: '2', type: 'payment', title: 'Payment received', description: 'R$ 350.00', timestamp: '2026-02-18T10:15:00Z' },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ActivityFeedItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageClinicActivityFeedProps {
  /** Activity feed items */
  items: ActivityFeedItem[];
  /** Maximum number of items to show */
  maxItems?: number;
  /** Override title text */
  title?: string;
  /** Override empty state text */
  emptyText?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_ICON: Record<ActivityFeedItem['type'], string> = {
  appointment: 'calendar',
  payment: 'dollar-sign',
  treatment: 'clipboard',
  patient: 'user',
  alert: 'alert-triangle',
};

const TYPE_COLOR: Record<ActivityFeedItem['type'], string> = {
  appointment: 'bg-blue-500/10 text-blue-500',
  payment: 'bg-emerald-500/10 text-emerald-500',
  treatment: 'bg-purple-500/10 text-purple-500',
  patient: 'bg-sky-500/10 text-sky-500',
  alert: 'bg-amber-500/10 text-amber-500',
};

// =============================================================================
// Helpers — timestamp
// =============================================================================

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (diffDays > 0) return rtf.format(-diffDays, 'day');
    if (diffHours > 0) return rtf.format(-diffHours, 'hour');
    if (diffMins > 0) return rtf.format(-diffMins, 'minute');
    return rtf.format(-diffSecs, 'second');
  } catch {
    return isoString;
  }
}

// =============================================================================
// Component
// =============================================================================

export function PageClinicActivityFeed({
  items,
  maxItems = 10,
  title,
  emptyText,
  className,
}: PageClinicActivityFeedProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <PageIcon name="activity" className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {title ?? tPageShell('domain.odonto.dashboard.activity.title', 'Recent Activity')}
        </h3>
      </div>

      {/* Feed */}
      {visibleItems.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyText ?? tPageShell('domain.odonto.dashboard.activity.empty', 'No recent activity')}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-7 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

          <ul className="relative">
            {visibleItems.map((item, index) => (
              <li key={item.id} className="relative flex gap-3 px-4 py-3">
                {/* Timeline dot & icon */}
                <div
                  className={cn(
                    'relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                    TYPE_COLOR[item.type],
                  )}
                >
                  <PageIcon name={TYPE_ICON[item.type]} className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(item.timestamp)}</span>
                    {item.actor && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>{item.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
