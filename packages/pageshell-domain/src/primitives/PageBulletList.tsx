'use client';

/**
 * PageBulletList - Declarative bullet list primitive
 *
 * Renders a simple list with consistent styling.
 * Used for bullet points, checklists, numbered lists inside alerts, cards, etc.
 *
 * @example Basic usage
 * ```tsx
 * <PageBulletList
 *   items={[
 *     'Primeiro item',
 *     'Segundo item',
 *     'Terceiro item',
 *   ]}
 * />
 * ```
 *
 * @example With check icons
 * ```tsx
 * <PageBulletList
 *   variant="check"
 *   items={[
 *     'Acesso ilimitado',
 *     'Suporte prioritário',
 *     'Atualizações gratuitas',
 *   ]}
 * />
 * ```
 *
 * @example Numbered list
 * ```tsx
 * <PageBulletList
 *   variant="number"
 *   items={[
 *     'Faça login na plataforma',
 *     'Acesse as configurações',
 *     'Clique em "Solicitar Reembolso"',
 *   ]}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { usePageShellContextOptional } from '@pageshell/theme';

// =============================================================================
// Types
// =============================================================================

/**
 * List marker variant
 */
export type PageBulletListVariant = 'disc' | 'check' | 'number' | 'none';

/**
 * Text size
 */
export type PageBulletListSize = 'xs' | 'sm' | 'base';

/**
 * Gap between items
 */
export type PageBulletListGap = 'none' | 'xs' | 'sm' | 'md';

/**
 * PageBulletList component props
 */
export interface PageBulletListProps {
  /** List items - strings or ReactNodes */
  items: (string | ReactNode)[];
  /** Marker variant (default: 'disc') */
  variant?: PageBulletListVariant;
  /** Text size (default: 'sm') */
  size?: PageBulletListSize;
  /** Gap between items (default: 'xs') */
  gap?: PageBulletListGap;
  /** Inherit color from parent (useful inside PageAlert) */
  inheritColor?: boolean;
  /** Animation delay index (default: 0 = no animation) */
  animationDelay?: number;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Styling Maps
// =============================================================================

const sizeClasses: Record<PageBulletListSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
};

const gapClasses: Record<PageBulletListGap, string> = {
  none: 'space-y-0',
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-3',
};

const markerClasses: Record<PageBulletListVariant, string> = {
  disc: 'list-disc',
  number: 'list-decimal',
  check: 'list-none',
  none: 'list-none',
};

// =============================================================================
// Component
// =============================================================================

export function PageBulletList({
  items,
  variant = 'disc',
  size = 'sm',
  gap = 'xs',
  inheritColor = true,
  animationDelay = 0,
  testId,
}: PageBulletListProps) {
  // Try to get context (optional - works outside PageShell too)
  let delayClass = '';
  let animateClass = '';

  const context = usePageShellContextOptional();
  if (context && animationDelay > 0) {
    delayClass = context.config.animateDelay(animationDelay);
    animateClass = context.config.animate;
  }

  if (items.length === 0) {
    return null;
  }

  const isOrdered = variant === 'number';
  const ListTag = isOrdered ? 'ol' : 'ul';
  const CheckIcon = variant === 'check' ? resolveIcon('check') : null;

  const listClassName = cn(
    sizeClasses[size],
    gapClasses[gap],
    markerClasses[variant],
    variant === 'disc' && 'ml-4',
    variant === 'number' && 'ml-5',
    !inheritColor && 'text-foreground',
    animateClass,
    delayClass
  );

  return (
    <ListTag className={listClassName} data-testid={testId}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            variant === 'check' && 'flex items-start gap-2'
          )}
        >
          {variant === 'check' && CheckIcon && (
            <CheckIcon
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          {item}
        </li>
      ))}
    </ListTag>
  );
}
