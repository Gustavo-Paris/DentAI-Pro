/**
 * ItemCard Component
 *
 * A compound component for displaying list items as cards.
 * Provides a consistent pattern for: icon/avatar, status, title, description,
 * stats row, timestamp, and actions.
 *
 * @module item-card
 *
 * @example Basic usage
 * ```tsx
 * <ItemCard
 *   title="My Brainstorm"
 *   description="Target audience: Developers"
 *   icon="lightbulb"
 *   status={{ label: "Draft", variant: "info" }}
 *   stats={[
 *     { icon: "target", label: "5 objectives" },
 *     { icon: "layers", label: "3 modules" },
 *   ]}
 *   timestamp={new Date()}
 *   primaryAction={{ label: "Continue", href: "/brainstorms/123" }}
 * />
 * ```
 *
 * @example With compound components
 * ```tsx
 * <ItemCard href="/items/123">
 *   <ItemCard.Header icon="database" iconColor="primary">
 *     <ItemCard.Status label="Active" variant="success" />
 *   </ItemCard.Header>
 *   <ItemCard.Title>My Knowledge Base</ItemCard.Title>
 *   <ItemCard.Description>Collection of learning resources</ItemCard.Description>
 *   <ItemCard.Stats stats={[{ icon: "file", label: "12 files" }]} />
 *   <ItemCard.Footer timestamp={new Date()}>
 *     <Button size="sm">View</Button>
 *   </ItemCard.Footer>
 * </ItemCard>
 * ```
 */

'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@pageshell/core';
import { Card } from '@pageshell/primitives';
import type { ItemCardProps } from './types';
import { ItemCardContext } from './context';
import { sizeClasses, variantClasses } from './constants';
import {
  ItemCardHeader,
  ItemCardTitle,
  ItemCardDescription,
  ItemCardStats,
  ItemCardFooter,
  ItemCardActions,
  ItemCardSkeleton,
} from './components';

// =============================================================================
// Main Component
// =============================================================================

function ItemCardRoot({
  // Identity
  title,
  description,
  // Visual
  icon,
  iconColor = 'primary',
  status,
  avatar,
  // Content
  stats,
  timestamp,
  timestampIcon = 'clock',
  children,
  // Actions
  primaryAction,
  secondaryAction,
  menuActions,
  // Link
  href,
  LinkComponent,
  // Variants
  size = 'md',
  orientation = 'vertical',
  variant = 'default',
  selected = false,
  disabled = false,
  loading = false,
  // Styling
  className,
  testId,
}: ItemCardProps) {
  const sizes = sizeClasses[size];

  // Loading state
  if (loading) {
    return (
      <ItemCardSkeleton
        size={size}
        showIcon={!!icon || !!avatar}
        showStatus={!!status}
        showStats={!!stats && stats.length > 0}
        className={className}
      />
    );
  }

  // Build card content
  const cardContent = (
    <>
      {/* Header with icon and status */}
      {(icon || avatar || status || menuActions) && (
        <ItemCardHeader
          icon={icon}
          iconColor={iconColor}
          avatar={avatar}
          status={status}
          menuActions={menuActions}
        />
      )}

      {/* Title */}
      <ItemCardTitle>{title}</ItemCardTitle>

      {/* Description */}
      {description && <ItemCardDescription>{description}</ItemCardDescription>}

      {/* Custom content */}
      {children}

      {/* Stats row */}
      {stats && stats.length > 0 && <ItemCardStats stats={stats} />}

      {/* Footer */}
      {(timestamp || primaryAction || secondaryAction) && (
        <ItemCardFooter
          timestamp={timestamp}
          timestampIcon={timestampIcon}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          LinkComponent={LinkComponent}
        />
      )}
    </>
  );

  const cardClasses = cn(
    sizes.container,
    'h-full transition-all duration-200',
    variantClasses[variant],
    href && 'cursor-pointer group',
    selected && 'ring-2 ring-primary ring-offset-2',
    disabled && 'opacity-50 pointer-events-none',
    className
  );

  // Wrap with context
  const contextValue = useMemo(
    () => ({ size, orientation, disabled, LinkComponent }),
    [size, orientation, disabled, LinkComponent]
  );

  const wrappedContent = (
    <ItemCardContext.Provider value={contextValue}>
      <Card className={cardClasses} data-testid={testId}>
        {cardContent}
      </Card>
    </ItemCardContext.Provider>
  );

  // Link mode
  if (href) {
    if (LinkComponent) {
      return (
        <LinkComponent href={href} className="block h-full">
          {wrappedContent}
        </LinkComponent>
      );
    }
    return (
      <a href={href} className="block h-full">
        {wrappedContent}
      </a>
    );
  }

  return wrappedContent;
}

// =============================================================================
// Compound Component Export
// =============================================================================

export const ItemCard = Object.assign(ItemCardRoot, {
  Header: ItemCardHeader,
  Title: ItemCardTitle,
  Description: ItemCardDescription,
  Stats: ItemCardStats,
  Footer: ItemCardFooter,
  Actions: ItemCardActions,
  Skeleton: ItemCardSkeleton,
  displayName: 'ItemCard' as const,
});
