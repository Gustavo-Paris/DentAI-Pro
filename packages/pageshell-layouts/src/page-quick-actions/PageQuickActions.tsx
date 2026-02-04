'use client';

/**
 * PageQuickActions Component - Gradient Glow Design
 *
 * Renders a grid of quick action links with icons.
 * Regular actions use vertical layout with icon on top.
 * Featured actions use horizontal layout with gradient border and glow effect.
 *
 * @example
 * <PageQuickActions
 *   actions={[
 *     { label: "Ver Analytics", href: "/analytics", icon: TrendingUp },
 *     { label: "Configurações", href: "/settings", icon: Settings },
 *   ]}
 * />
 *
 * @example With Link component:
 * import Link from 'next/link';
 * <PageQuickActions
 *   actions={[...]}
 *   LinkComponent={Link}
 * />
 */

import { type ComponentType, type ReactNode } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';
import { resolveIcon, type IconProp, type StatusVariant } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

/** Link component type for framework-agnostic usage */
export type LinkComponentType = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

/** Badge configuration for quick actions */
export interface QuickActionBadge {
  /** Badge label */
  label?: string;
  /** Count value (alternative to label) */
  count?: number;
  /** Badge variant */
  variant?: StatusVariant;
}

/** Quick action item configuration */
export interface QuickAction {
  /** Action label */
  label: string;
  /** Description (shown in featured actions) */
  description?: string;
  /** Action href */
  href?: string;
  /** Click handler (alternative to href) */
  onClick?: () => void;
  /** Action icon */
  icon?: IconProp;
  /** Icon color */
  iconColor?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'rose';
  /** Featured action (uses horizontal layout with gradient border) */
  featured?: boolean;
  /** Badge */
  badge?: QuickActionBadge;
}

/** PageQuickActions props */
export interface PageQuickActionsProps {
  /** Quick action items */
  actions: QuickAction[];
  /** Section title */
  title?: string;
  /** Animation delay */
  animationDelay?: number;
  /** Custom Link component for framework-agnostic usage */
  LinkComponent?: LinkComponentType;
  /** Test ID */
  testId?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Icon Color Configurations (inline to avoid broken CSS variables)
// =============================================================================

const iconColorConfig = {
  violet: {
    bg: 'bg-violet-500/15',
    bgHover: 'group-hover:bg-violet-500/25',
    text: 'text-violet-400',
    glow: 'group-hover:shadow-violet-500/30',
    border: 'border-violet-500/30',
    borderHover: 'group-hover:border-violet-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    bgHover: 'group-hover:bg-cyan-500/25',
    text: 'text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/30',
    border: 'border-cyan-500/30',
    borderHover: 'group-hover:border-cyan-500/50',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    bgHover: 'group-hover:bg-emerald-500/25',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/30',
    border: 'border-emerald-500/30',
    borderHover: 'group-hover:border-emerald-500/50',
  },
  amber: {
    bg: 'bg-amber-500/15',
    bgHover: 'group-hover:bg-amber-500/25',
    text: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/30',
    border: 'border-amber-500/30',
    borderHover: 'group-hover:border-amber-500/50',
  },
  blue: {
    bg: 'bg-blue-500/15',
    bgHover: 'group-hover:bg-blue-500/25',
    text: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/30',
    border: 'border-blue-500/30',
    borderHover: 'group-hover:border-blue-500/50',
  },
  rose: {
    bg: 'bg-rose-500/15',
    bgHover: 'group-hover:bg-rose-500/25',
    text: 'text-rose-400',
    glow: 'group-hover:shadow-rose-500/30',
    border: 'border-rose-500/30',
    borderHover: 'group-hover:border-rose-500/50',
  },
} as const;

type IconColorKey = keyof typeof iconColorConfig;

// =============================================================================
// Badge Color Configurations
// =============================================================================

const badgeColorConfig: Record<StatusVariant, string> = {
  primary: 'bg-primary/15 text-primary border-primary/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
  info: 'bg-info/15 text-info border-info/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  success: 'bg-success/15 text-success border-success/30',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  default: 'bg-muted text-muted-foreground border-border',
  outline: 'bg-transparent text-muted-foreground border-border',
  muted: 'bg-muted/50 text-muted-foreground border-muted',
};

/**
 * Renders a badge for quick action cards
 */
function QuickActionBadgeElement({ badge }: { badge: QuickActionBadge }) {
  const colorClass = badgeColorConfig[badge.variant ?? 'default'];
  const displayText = badge.count !== undefined ? badge.count : badge.label;

  if (!displayText && displayText !== 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5',
        'text-xs font-medium rounded-full border',
        'min-w-[1.25rem]',
        colorClass
      )}
    >
      {displayText}
    </span>
  );
}

// =============================================================================
// Default Link Component
// =============================================================================

function DefaultLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// =============================================================================
// PageQuickActions Component
// =============================================================================

export function PageQuickActions({
  actions,
  title = 'Ações Rápidas',
  className,
  animationDelay,
  testId,
  ariaLabel,
  LinkComponent = DefaultLink,
}: PageQuickActionsProps) {
  const { config } = usePageShellContext();

  // Use provided delay or fixed default (avoids hydration mismatch from getNextDelay counter)
  const delay = animationDelay ?? 3;
  const delayClass = delay > 0 ? config.animateDelay(delay) : '';

  const featuredActions = actions.filter((a) => a.featured);
  const regularActions = actions.filter((a) => !a.featured);

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel || title || 'Ações rápidas'}
      data-testid={testId}
      className={cn(config.animate, delayClass, className)}
    >
      {/* Section Header */}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <Zap
            className="w-4 h-4"
            style={{ color: config.accent }}
            aria-hidden="true"
          />
          <h3 className={cn(config.heading, config.headingMd)}>{title}</h3>
        </div>
      )}

      {/* Featured Actions - Full width with gradient border */}
      {featuredActions.length > 0 && (
        <div className="space-y-3 mb-4">
          {featuredActions.map((action) => (
            <FeaturedAction
              key={action.href ?? action.label}
              action={action}
              LinkWrapper={LinkComponent}
            />
          ))}
        </div>
      )}

      {/* Regular Actions Grid - Vertical layout */}
      {regularActions.length > 0 && (
        <div
          className={cn(
            'grid gap-3',
            // Responsive columns based on action count
            regularActions.length <= 2
              ? 'grid-cols-2'
              : regularActions.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4'
          )}
        >
          {regularActions.map((action) => (
            <RegularAction
              key={action.href ?? action.label}
              action={action}
              LinkWrapper={LinkComponent}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ActionProps {
  action: QuickAction;
  LinkWrapper: LinkComponentType;
}

/**
 * Featured Action - Horizontal layout with gradient border and glow
 */
function FeaturedAction({ action, LinkWrapper }: ActionProps) {
  const Link = LinkWrapper;
  const Icon = resolveIcon(action.icon);
  const colorKey = (action.iconColor ?? 'violet') as IconColorKey;
  const colors = iconColorConfig[colorKey] ?? iconColorConfig.violet;

  // Generate unique ID for description if present
  const descriptionId = action.description
    ? `action-desc-${action.label.toLowerCase().replace(/\s+/g, '-')}`
    : undefined;

  const sharedClassName = cn(
    'group relative flex items-center gap-4 p-5 w-full text-left',
    'bg-card rounded-2xl border',
    colors.border,
    colors.borderHover,
    'transition-all duration-300 ease-out',
    'hover:-translate-y-1 hover:shadow-lg',
    colors.glow
  );

  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl',
          'flex items-center justify-center',
          colors.bg,
          colors.bgHover,
          'transition-all duration-300'
        )}
        aria-hidden="true"
      >
        {Icon && <Icon className={cn('w-6 h-6', colors.text)} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">
            {action.label}
          </span>
          {action.badge && <QuickActionBadgeElement badge={action.badge} />}
        </div>
        {action.description && (
          <span
            id={descriptionId}
            className="block text-sm text-muted-foreground mt-0.5"
          >
            {action.description}
          </span>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight
        className={cn(
          'flex-shrink-0 w-5 h-5 text-muted-foreground',
          'transition-all duration-300',
          'group-hover:translate-x-1',
          `group-hover:${colors.text}`
        )}
        aria-hidden="true"
      />
    </>
  );

  // Use Link for href, button for onClick
  if (action.href) {
    return (
      <Link href={action.href} className={sharedClassName} aria-describedby={descriptionId}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={sharedClassName} aria-describedby={descriptionId}>
      {content}
    </button>
  );
}

/**
 * Regular Action - Vertical layout with icon on top
 */
function RegularAction({ action, LinkWrapper }: ActionProps) {
  const Link = LinkWrapper;
  const Icon = resolveIcon(action.icon);
  const colorKey = (action.iconColor ?? 'violet') as IconColorKey;
  const colors = iconColorConfig[colorKey] ?? iconColorConfig.violet;

  const sharedClassName = cn(
    'group flex flex-col items-center justify-center gap-3',
    'p-5 min-h-[100px] w-full',
    'bg-card rounded-2xl border border-border',
    'transition-all duration-300 ease-out',
    'hover:-translate-y-1 hover:scale-[1.02]',
    'hover:border-primary/40 hover:shadow-lg',
    'hover:shadow-primary/10'
  );

  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'w-11 h-11 rounded-xl',
          'flex items-center justify-center',
          colors.bg,
          colors.bgHover,
          'transition-all duration-300',
          'group-hover:scale-110 group-hover:shadow-md',
          colors.glow
        )}
        aria-hidden="true"
      >
        {Icon && <Icon className={cn('w-[22px] h-[22px]', colors.text)} />}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm font-medium text-muted-foreground text-center',
          'transition-colors duration-200',
          'group-hover:text-foreground'
        )}
      >
        {action.label}
      </span>
    </>
  );

  // Use Link for href, button for onClick
  if (action.href) {
    return (
      <Link href={action.href} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={sharedClassName}>
      {content}
    </button>
  );
}
