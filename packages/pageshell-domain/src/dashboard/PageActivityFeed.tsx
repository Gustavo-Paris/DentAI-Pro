'use client';

/**
 * PageActivityFeed
 *
 * Activity feed component showing recent user actions.
 * Displays completed lessons, achievements, etc.
 *
 * @example Basic usage
 * ```tsx
 * <PageActivityFeed
 *   items={[
 *     {
 *       key: '1',
 *       icon: 'check-circle-2',
 *       title: 'Completou aula',
 *       subtitle: 'Introdução ao React',
 *       timestamp: new Date(),
 *     }
 *   ]}
 * />
 * ```
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@pageshell/core';
import { PageIcon, type IconName } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PageActivityFeedItem {
  /** Unique item key */
  key: string;
  /** Activity icon */
  icon?: IconName;
  /** Activity title */
  title: string;
  /** Activity subtitle */
  subtitle?: string;
  /** Activity timestamp */
  timestamp: Date | string;
}

export interface PageActivityFeedProps {
  /** Section title */
  title?: string;
  /** Section icon */
  icon?: IconName;
  /** Activity items */
  items: PageActivityFeedItem[];
  /** Maximum items to show */
  maxItems?: number;
  /** Animation delay index */
  animationDelay?: number;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageActivityFeed({
  title = 'Atividade Recente',
  icon = 'activity',
  items,
  maxItems,
  animationDelay = 4,
  className,
}: PageActivityFeedProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'portal-section-card',
        `portal-animate-in portal-animate-in-delay-${animationDelay}`,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <PageIcon name={icon} className="w-4 h-4 text-primary" />
        <h2 className="portal-heading portal-heading-md">{title}</h2>
      </div>

      {/* Items */}
      <div>
        {displayItems.map((item) => (
          <div key={item.key} className="portal-activity-item">
            <div className="portal-activity-icon">
              <PageIcon name={item.icon ?? 'check-circle-2'} />
            </div>
            <div className="portal-activity-content">
              <p className="portal-activity-title">{item.title}</p>
              {item.subtitle && (
                <p className="portal-activity-subtitle">{item.subtitle}</p>
              )}
            </div>
            <span className="portal-activity-time">
              {formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
