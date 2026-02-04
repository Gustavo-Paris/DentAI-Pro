'use client';

/**
 * PageBreadcrumbs Component
 *
 * Renders accessible breadcrumb navigation for page hierarchy.
 * Used by PageShell and PageHeader components.
 *
 * Supports ref forwarding for integration with animation libraries and focus management.
 *
 * @example Basic usage
 * <PageBreadcrumbs
 *   items={[
 *     { label: "Dashboard", href: "/dashboard" },
 *     { label: "Courses", href: "/courses" },
 *     { label: "React Avançado" }
 *   ]}
 * />
 *
 * @example With icons
 * <PageBreadcrumbs
 *   items={[
 *     { label: "Home", href: "/", icon: Home },
 *     { label: "Settings", icon: Settings }
 *   ]}
 * />
 */

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@pageshell/core';
import { resolveIcon, type IconProp } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PageBreadcrumb {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Optional icon */
  icon?: IconProp;
}

export interface PageBreadcrumbsProps {
  /** Breadcrumb items */
  items: PageBreadcrumb[];
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Separator icon size */
  separatorSize?: 'sm' | 'md';
  /** Maximum width for truncating labels */
  maxLabelWidth?: number;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic usage */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

// =============================================================================
// Size configurations
// =============================================================================

const sizeClasses = {
  sm: {
    text: 'text-xs',
    gap: 'gap-1',
    icon: 'h-3 w-3',
    separator: 'h-3 w-3',
  },
  md: {
    text: 'text-sm',
    gap: 'gap-1.5',
    icon: 'h-3.5 w-3.5',
    separator: 'h-3.5 w-3.5',
  },
};

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
// PageBreadcrumbs Component
// =============================================================================

/**
 * PageBreadcrumbs - Accessible breadcrumb navigation
 *
 * Supports ref forwarding for integration with animation libraries and focus management.
 */
export const PageBreadcrumbs = React.forwardRef<HTMLElement, PageBreadcrumbsProps>(
  function PageBreadcrumbs(
    {
      items,
      className,
      size = 'md',
      maxLabelWidth = 200,
      testId,
      LinkComponent = DefaultLink,
    },
    ref
  ) {
    if (!items.length) return null;

    const styles = sizeClasses[size];
    const Link = LinkComponent;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={className}
        data-testid={testId}
      >
      <ol className={cn('flex items-center', styles.gap, styles.text, 'text-muted-foreground')}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = resolveIcon(item.icon);

          return (
            <li key={index} className={cn('flex items-center', styles.gap)}>
              {/* Separator (not on first item) */}
              {index > 0 && (
                <ChevronRight
                  className={cn(styles.separator, 'text-muted-foreground/50 flex-shrink-0')}
                  aria-hidden="true"
                />
              )}

              {/* Link or current page */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1',
                    'hover:text-foreground transition-colors',
                    'hover:underline underline-offset-4'
                  )}
                >
                  {Icon && <Icon className={cn(styles.icon, 'flex-shrink-0')} aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isLast && 'text-foreground font-medium'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className={cn(styles.icon, 'flex-shrink-0')} aria-hidden="true" />}
                  <span
                    className="truncate"
                    style={{ maxWidth: maxLabelWidth }}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
  }
);

PageBreadcrumbs.displayName = 'PageBreadcrumbs';
