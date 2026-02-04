'use client';

/**
 * PageKeyValueList - Declarative key-value list primitive
 *
 * Renders a definition list (dl/dt/dd) with consistent styling.
 * Used for displaying metadata, details, or any label-value pairs.
 *
 * @example Basic usage
 * ```tsx
 * <PageKeyValueList
 *   items={[
 *     { label: 'Nome', value: 'João Silva' },
 *     { label: 'Email', value: 'joao@example.com' },
 *     { label: 'Status', value: 'Ativo' },
 *   ]}
 * />
 * ```
 *
 * @example With custom rendering
 * ```tsx
 * <PageKeyValueList
 *   items={[
 *     { label: 'Status', value: <StatusBadge status="active" /> },
 *     { label: 'Progresso', value: '85%', valueVariant: 'strong' },
 *     { label: 'Criado em', value: '25/12/2025', labelVariant: 'muted' },
 *   ]}
 *   gap="md"
 * />
 * ```
 *
 * @example Horizontal layout
 * ```tsx
 * <PageKeyValueList
 *   items={items}
 *   layout="horizontal"
 *   columns={2}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Text variant for label or value styling
 */
export type KeyValueTextVariant = 'default' | 'strong' | 'muted' | 'code';

/**
 * Individual key-value item configuration
 */
export interface KeyValueItem {
  /** Unique identifier for the item */
  id?: string;
  /** Label text (key) */
  label: string;
  /** Value content - can be string, number, or ReactNode */
  value: ReactNode;
  /** Label styling variant */
  labelVariant?: KeyValueTextVariant;
  /** Value styling variant */
  valueVariant?: KeyValueTextVariant;
  /** Hide this item conditionally */
  hidden?: boolean;
}

/**
 * Gap between items
 */
export type KeyValueGap = 'none' | 'xs' | 'sm' | 'md' | 'lg';

/**
 * Layout orientation
 */
export type KeyValueLayout = 'vertical' | 'horizontal' | 'inline';

/**
 * PageKeyValueList component props
 */
export interface PageKeyValueListProps {
  /** List of key-value items to display */
  items: KeyValueItem[];
  /** Gap between items (default: 'sm') */
  gap?: KeyValueGap;
  /** Layout orientation (default: 'vertical') */
  layout?: KeyValueLayout;
  /** Number of columns for horizontal layout (default: 1) */
  columns?: 1 | 2 | 3 | 4;
  /** Divider between items */
  divider?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Styling Maps
// =============================================================================

const gapClasses: Record<KeyValueGap, string> = {
  none: 'space-y-0',
  xs: 'space-y-1',
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-6',
};

const labelVariantClasses: Record<KeyValueTextVariant, string> = {
  default: 'text-sm font-medium text-muted-foreground',
  strong: 'text-sm font-semibold text-foreground',
  muted: 'text-xs text-muted-foreground/70',
  code: 'text-sm font-mono text-muted-foreground',
};

const valueVariantClasses: Record<KeyValueTextVariant, string> = {
  default: 'text-sm text-foreground',
  strong: 'text-sm font-medium text-foreground',
  muted: 'text-sm text-muted-foreground',
  code: 'text-sm font-mono text-foreground',
};

const columnClasses: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

// =============================================================================
// Component
// =============================================================================

export function PageKeyValueList({
  items,
  gap = 'sm',
  layout = 'vertical',
  columns = 1,
  divider = false,
  className,
  testId,
}: PageKeyValueListProps) {
  // Filter hidden items
  const visibleItems = items.filter((item) => !item.hidden);

  if (visibleItems.length === 0) {
    return null;
  }

  // Horizontal/grid layout
  if (layout === 'horizontal' && columns > 1) {
    return (
      <dl
        className={cn('grid gap-4', columnClasses[columns], className)}
        data-testid={testId}
      >
        {visibleItems.map((item, index) => (
          <div key={item.id ?? index}>
            <dt className={labelVariantClasses[item.labelVariant ?? 'default']}>
              {item.label}
            </dt>
            <dd className={cn('mt-1', valueVariantClasses[item.valueVariant ?? 'default'])}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  // Inline layout (label and value on same line)
  if (layout === 'inline') {
    return (
      <dl className={cn(gapClasses[gap], className)} data-testid={testId}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id ?? index}
            className={cn(
              'flex items-center justify-between',
              divider && index < visibleItems.length - 1 && 'pb-3 border-b border-border'
            )}
          >
            <dt className={labelVariantClasses[item.labelVariant ?? 'default']}>
              {item.label}
            </dt>
            <dd className={valueVariantClasses[item.valueVariant ?? 'default']}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  // Vertical layout (default)
  return (
    <dl className={cn(gapClasses[gap], className)} data-testid={testId}>
      {visibleItems.map((item, index) => (
        <div
          key={item.id ?? index}
          className={cn(
            divider && index < visibleItems.length - 1 && 'pb-3 border-b border-border'
          )}
        >
          <dt className={labelVariantClasses[item.labelVariant ?? 'default']}>
            {item.label}
          </dt>
          <dd className={cn('mt-1', valueVariantClasses[item.valueVariant ?? 'default'])}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
