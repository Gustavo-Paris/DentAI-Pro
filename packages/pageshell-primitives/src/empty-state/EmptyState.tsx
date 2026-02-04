/**
 * EmptyState Primitive
 *
 * Visual component for displaying empty or no-results states.
 * Framework-agnostic with support for custom Link components.
 *
 * @module empty-state
 */

'use client';

import { type ReactNode, type ComponentType } from 'react';
import { cn } from '@pageshell/core';
import { Button } from '../button';
import { resolveIcon, type IconProp } from '../icons';

// =============================================================================
// Types
// =============================================================================

/** Link component type for framework-agnostic usage */
export type LinkComponentType = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

/** Empty state variant */
export type EmptyStateVariant =
  | 'default'
  | 'card'
  | 'inline'
  | 'search'
  | 'data'
  | 'error'
  | 'feature'
  | 'success';

/** Empty state size */
export type EmptyStateSize = 'sm' | 'md' | 'lg';

/**
 * Empty state action configuration
 *
 * Supports both click handlers and navigation:
 * - Use `onClick` for custom handlers
 * - Use `href` for declarative navigation (preferred)
 */
export interface EmptyStateAction {
  /** Action button label */
  label: string;
  /** Click handler (use href for navigation) */
  onClick?: () => void;
  /** Navigation href (preferred over onClick for navigation) */
  href?: string;
  /** Button variant */
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
}

/** EmptyState props */
export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Icon (string from registry, ComponentType, or ReactNode) */
  icon?: IconProp | ReactNode;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Size variant */
  size?: EmptyStateSize;
  /** Wrap in card (alias for variant="card") */
  withCard?: boolean;
  /** Primary action */
  action?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
  /** Custom content below description */
  children?: ReactNode;
  /** Minimum height */
  minHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
  /** Custom Link component for framework-agnostic usage (e.g., Next.js Link) */
  LinkComponent?: LinkComponentType;
}

// =============================================================================
// Default Icons by Variant
// =============================================================================

const defaultIconsByVariant: Record<EmptyStateVariant, IconProp> = {
  default: 'box',
  card: 'folder-open',
  inline: 'box',
  search: 'search',
  data: 'file',
  error: 'alert-circle',
  feature: 'sparkles',
  success: 'check-circle',
};

// =============================================================================
// Styles Configuration
// =============================================================================

const variantStyles: Record<EmptyStateVariant, string> = {
  default: 'bg-transparent',
  card: 'rounded-lg border border-dashed border-muted-foreground/25 bg-card',
  inline: 'bg-transparent',
  search: 'bg-transparent',
  data: 'bg-transparent',
  error: 'bg-destructive/5 border border-destructive/20 rounded-lg',
  feature: 'bg-primary/5 border border-primary/20 rounded-lg',
  success: 'bg-success/5 border border-success/20 rounded-lg',
};

const iconContainerStyles: Record<EmptyStateVariant, string> = {
  default: 'bg-muted/50',
  card: 'bg-muted/50',
  inline: 'bg-muted/50',
  search: 'bg-muted/50',
  data: 'bg-muted/50',
  error: 'bg-destructive/10',
  feature: 'bg-primary/10',
  success: 'bg-success/10',
};

const iconStyles: Record<EmptyStateVariant, string> = {
  default: 'text-muted-foreground',
  card: 'text-muted-foreground',
  inline: 'text-muted-foreground',
  search: 'text-muted-foreground',
  data: 'text-muted-foreground',
  error: 'text-destructive',
  feature: 'text-primary',
  success: 'text-success',
};

const sizeStyles = {
  sm: {
    padding: 'py-8 px-4',
    icon: 'h-5 w-5',
    iconContainer: 'h-10 w-10',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    padding: 'py-12 px-4',
    icon: 'h-6 w-6',
    iconContainer: 'h-14 w-14',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    padding: 'py-16 px-6',
    icon: 'h-8 w-8',
    iconContainer: 'h-20 w-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

// =============================================================================
// Action Button Helper
// =============================================================================

function ActionButton({
  action,
  defaultVariant,
  LinkComponent,
}: {
  action: EmptyStateAction;
  defaultVariant: 'primary' | 'outline';
  LinkComponent?: LinkComponentType;
}) {
  const variant = action.variant ?? defaultVariant;

  // Render as Link when href is provided
  if (action.href) {
    // Use custom Link component if provided, otherwise use anchor
    const Link = LinkComponent || 'a';
    return (
      <Button variant={variant} asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }

  // Render as regular button when onClick is provided
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * EmptyState - Visual component for empty or no-results states
 *
 * @example Basic usage
 * ```tsx
 * <EmptyState
 *   title="No items found"
 *   description="Try adjusting your search or filters."
 * />
 * ```
 *
 * @example With action
 * ```tsx
 * <EmptyState
 *   title="No courses yet"
 *   description="Create your first course to get started."
 *   action={{
 *     label: "Create Course",
 *     onClick: () => setShowModal(true),
 *   }}
 * />
 * ```
 *
 * @example With icon (string from registry)
 * ```tsx
 * <EmptyState
 *   icon="search"
 *   title="No results"
 *   description="No items match your search."
 *   variant="search"
 * />
 * ```
 *
 * @example With Next.js Link
 * ```tsx
 * import Link from 'next/link';
 * <EmptyState
 *   title="No items"
 *   action={{ label: "Create", href: "/new" }}
 *   LinkComponent={Link}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  variant = 'default',
  size = 'md',
  withCard = false,
  action,
  secondaryAction,
  children,
  minHeight = '400px',
  className,
  testId,
  LinkComponent,
}: EmptyStateProps) {
  // Resolve variant: withCard prop takes precedence
  const resolvedVariant = withCard ? 'card' : variant;
  const sizeConfig = sizeStyles[size];
  const isCard = resolvedVariant === 'card';
  const isInline = resolvedVariant === 'inline';

  // Resolve icon
  const renderIcon = () => {
    // Determine which icon to use
    const iconToRender = icon ?? defaultIconsByVariant[resolvedVariant];

    // If it's a string, resolve from registry
    if (typeof iconToRender === 'string') {
      const ResolvedIcon = resolveIcon(iconToRender as IconProp);
      if (ResolvedIcon) {
        return (
          <ResolvedIcon
            className={cn(sizeConfig.icon, iconStyles[resolvedVariant])}
            aria-hidden="true"
          />
        );
      }
      return null;
    }

    // Check if it's a React component (function or forwardRef)
    const isFunction = typeof iconToRender === 'function';
    const isForwardRef =
      typeof iconToRender === 'object' &&
      iconToRender !== null &&
      '$$typeof' in iconToRender &&
      (iconToRender as { $$typeof?: symbol }).$$typeof === Symbol.for('react.forward_ref');

    const isReactComponent = isFunction || isForwardRef;

    // If it's a ReactNode (not a component), render it directly
    if (!isReactComponent) {
      return iconToRender;
    }

    // It's a component - render it with props
    const IconComponent = iconToRender as ComponentType<{ className?: string }>;
    return (
      <IconComponent
        className={cn(sizeConfig.icon, iconStyles[resolvedVariant])}
      />
    );
  };

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-center justify-center',
        sizeConfig.padding,
        variantStyles[resolvedVariant],
        isCard && 'p-8',
        className
      )}
      style={{ minHeight: isInline ? undefined : minHeight }}
    >
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div
          className={cn(
            'mx-auto mb-4 flex items-center justify-center rounded-full',
            sizeConfig.iconContainer,
            iconContainerStyles[resolvedVariant]
          )}
        >
          {renderIcon()}
        </div>

        {/* Title */}
        <h3 className={cn('font-semibold text-foreground', sizeConfig.title)}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'mt-2 text-muted-foreground max-w-sm mx-auto',
              sizeConfig.description
            )}
          >
            {description}
          </p>
        )}

        {/* Custom content */}
        {children && <div className="mt-4">{children}</div>}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {secondaryAction && (
              <ActionButton
                action={secondaryAction}
                defaultVariant="outline"
                LinkComponent={LinkComponent}
              />
            )}
            {action && (
              <ActionButton
                action={action}
                defaultVariant="primary"
                LinkComponent={LinkComponent}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

// =============================================================================
// Convenience Components
// =============================================================================

/**
 * EmptySearchState - Pre-configured for search results
 */
export function EmptySearchState({
  onClear,
  ...props
}: Omit<EmptyStateProps, 'variant' | 'icon'> & {
  onClear?: () => void;
}) {
  return (
    <EmptyState
      variant="search"
      icon="search"
      action={
        onClear
          ? {
              label: 'Limpar filtros',
              onClick: onClear,
              variant: 'outline',
            }
          : undefined
      }
      {...props}
    />
  );
}

EmptySearchState.displayName = 'EmptySearchState';

/**
 * EmptyDataState - Pre-configured for no data
 */
export function EmptyDataState(
  props: Omit<EmptyStateProps, 'variant' | 'icon'>
) {
  return <EmptyState variant="data" icon="folder-open" {...props} />;
}

EmptyDataState.displayName = 'EmptyDataState';
