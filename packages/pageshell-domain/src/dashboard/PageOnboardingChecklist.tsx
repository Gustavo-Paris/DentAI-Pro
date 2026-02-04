'use client';

/**
 * PageOnboardingChecklist
 *
 * Checklist component for onboarding/getting started steps.
 * Shows a list of actionable items with icons and descriptions.
 *
 * @example Basic usage
 * ```tsx
 * <PageOnboardingChecklist
 *   items={[
 *     {
 *       key: 'profile',
 *       href: '/settings/profile',
 *       icon: 'user',
 *       iconColor: 'primary',
 *       title: 'Complete seu perfil',
 *       description: 'Adicione foto e informações',
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

export interface PageOnboardingChecklistItem {
  /** Unique item key */
  key: string;
  /** Item href */
  href: string;
  /** Item icon */
  icon: IconName;
  /** Icon color variant */
  iconColor?: 'primary' | 'accent' | 'warning' | 'success' | 'destructive';
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Whether item is completed */
  completed?: boolean;
}

export interface PageOnboardingChecklistProps {
  /** Section title */
  title?: string;
  /** Section icon */
  icon?: IconName;
  /** Checklist items */
  items: PageOnboardingChecklistItem[];
  /** Animation delay index */
  animationDelay?: number;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const iconColorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
};

const hoverColorClasses: Record<string, string> = {
  primary: 'group-hover:text-primary',
  accent: 'group-hover:text-accent',
  warning: 'group-hover:text-warning',
  success: 'group-hover:text-success',
  destructive: 'group-hover:text-destructive',
};

// =============================================================================
// Component
// =============================================================================

export function PageOnboardingChecklist({
  title = 'Proximos Passos',
  icon = 'target',
  items,
  animationDelay = 4,
  className,
}: PageOnboardingChecklistProps) {
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
        <h3 className="portal-heading portal-heading-md">{title}</h3>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const iconClass = iconColorClasses[item.iconColor ?? 'primary'];
          const hoverClass = hoverColorClasses[item.iconColor ?? 'primary'];

          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group',
                item.completed && 'opacity-60'
              )}
            >
              <div className={cn('p-1.5 rounded-full', iconClass)}>
                <PageIcon
                  name={item.completed ? 'check' : item.icon}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex-1">
                <p className={cn('font-medium text-foreground transition-colors', hoverClass)}>
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <PageIcon
                name="arrow-right"
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-all',
                  hoverClass,
                  'group-hover:translate-x-1'
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
