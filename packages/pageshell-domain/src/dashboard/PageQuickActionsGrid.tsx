'use client';

/**
 * PageQuickActionsGrid
 *
 * Grid of quick action cards for dashboard.
 * Provides easy access to common actions.
 *
 * @example Basic usage
 * ```tsx
 * <PageQuickActionsGrid
 *   items={[
 *     {
 *       key: 'courses',
 *       href: '/courses',
 *       icon: 'book-open',
 *       label: 'Explorar Cursos',
 *       description: 'Encontre cursos para você',
 *     }
 *   ]}
 * />
 * ```
 */

import { Link } from 'react-router-dom';
import { cn } from '@pageshell/core';
import { PageIcon, type IconName } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PageQuickActionItem {
  /** Unique item key */
  key: string;
  /** Action href */
  href: string;
  /** Action icon */
  icon: IconName;
  /** Action label */
  label: string;
  /** Action description */
  description?: string;
}

export interface PageQuickActionsGridProps {
  /** Section title */
  title?: string;
  /** Section icon */
  icon?: IconName;
  /** Action items */
  items: PageQuickActionItem[];
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Animation delay index */
  animationDelay?: number;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const gridColsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

// =============================================================================
// Component
// =============================================================================

export function PageQuickActionsGrid({
  title = 'Acoes Rapidas',
  icon = 'zap',
  items,
  columns = 3,
  animationDelay = 5,
  className,
}: PageQuickActionsGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        `portal-animate-in portal-animate-in-delay-${animationDelay}`,
        className
      )}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <PageIcon name={icon} className="w-4 h-4 text-accent" />
          <h2 className="portal-heading portal-heading-md">{title}</h2>
        </div>
      )}

      {/* Grid */}
      <div className={cn('grid gap-4', gridColsClasses[columns])}>
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className="portal-quick-action group"
          >
            <div className="portal-quick-action-icon">
              <PageIcon name={item.icon} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium group-hover:text-primary transition-colors">
                {item.label}
              </span>
              {item.description && (
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
