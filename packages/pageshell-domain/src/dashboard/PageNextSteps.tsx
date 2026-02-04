'use client';

/**
 * PageNextSteps
 *
 * Next steps/actions component for dashboard.
 * Shows upcoming lessons or recommended actions.
 *
 * @example Basic usage
 * ```tsx
 * <PageNextSteps
 *   items={[
 *     {
 *       key: '1',
 *       href: '/courses/react/lesson-1',
 *       icon: 'play',
 *       title: 'Próxima aula',
 *       subtitle: 'Componentes e Props',
 *       estimatedTime: 15,
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

export interface PageNextStepItem {
  /** Unique item key */
  key: string;
  /** Step href */
  href: string;
  /** Step icon */
  icon?: IconName;
  /** Step title */
  title: string;
  /** Step subtitle */
  subtitle?: string;
  /** Estimated time in minutes */
  estimatedTime?: number;
}

export interface PageNextStepsProps {
  /** Section title */
  title?: string;
  /** Section icon */
  icon?: IconName;
  /** Step items */
  items: PageNextStepItem[];
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

export function PageNextSteps({
  title = 'Proximos Passos',
  icon = 'zap',
  items,
  maxItems,
  animationDelay = 4,
  className,
}: PageNextStepsProps) {
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
        <PageIcon name={icon} className="w-4 h-4 text-accent" />
        <h2 className="portal-heading portal-heading-md">{title}</h2>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {displayItems.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className="portal-next-action group"
          >
            <div className="portal-next-action-icon">
              <PageIcon name={item.icon ?? 'play'} />
            </div>
            <div className="portal-next-action-content">
              <p className="portal-next-action-title group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <div className="portal-next-action-meta">
                {item.subtitle && <span>{item.subtitle}</span>}
                {item.estimatedTime && (
                  <span className="flex items-center gap-1">
                    <PageIcon name="clock" className="w-3 h-3" />
                    ~{item.estimatedTime} min
                  </span>
                )}
              </div>
            </div>
            <PageIcon
              name="arrow-right"
              className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
