'use client';

/**
 * PageFooterActions - Declarative Footer Actions Container
 *
 * Encapsulates the common pattern of action buttons with a top border divider.
 * Replaces manual `<div className="pt-4 border-t border-border">` wrappers.
 *
 * @example Basic usage
 * ```tsx
 * <PageFooterActions>
 *   <PageButton icon="save">Salvar</PageButton>
 * </PageFooterActions>
 * ```
 *
 * @example Multiple buttons
 * ```tsx
 * <PageFooterActions>
 *   <PageButton variant="ghost">Cancelar</PageButton>
 *   <PageButton icon="save">Salvar</PageButton>
 * </PageFooterActions>
 * ```
 *
 * @example Space between (e.g., pagination)
 * ```tsx
 * <PageFooterActions layout="between">
 *   <span className="text-sm text-muted-foreground">10 itens</span>
 *   <div className="flex gap-2">
 *     <PageButton icon="chevron-left" size="icon" />
 *     <PageButton icon="chevron-right" size="icon" />
 *   </div>
 * </PageFooterActions>
 * ```
 *
 * @example Without divider
 * ```tsx
 * <PageFooterActions divider={false}>
 *   <PageButton>Continuar</PageButton>
 * </PageFooterActions>
 * ```
 */

import * as React from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export interface PageFooterActionsProps {
  children: React.ReactNode;

  /**
   * Layout direction for the actions.
   * - 'row': Default flex row
   * - 'row-reverse': Flex row reversed
   * - 'column': Flex column (stacked)
   * - 'between': Flex row with space-between (for pagination, etc.)
   * @default 'row'
   */
  layout?: 'row' | 'row-reverse' | 'column' | 'between';

  /**
   * Gap between children (Tailwind gap values)
   * @default 3
   */
  gap?: 2 | 3 | 4 | 6;

  /**
   * Padding top (Tailwind pt values)
   * @default 4
   */
  pt?: 3 | 4 | 6;

  /**
   * Margin top (Tailwind mt values, or 'auto' for flex push)
   * @default 0
   */
  mt?: 0 | 3 | 4 | 6 | 'auto';

  /**
   * Show top border divider
   * @default true
   */
  divider?: boolean;

  /**
   * Enable responsive stacking (column on mobile, row on desktop)
   * Only applies when layout is 'row' or 'row-reverse'
   * @default false
   */
  responsive?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// =============================================================================
// Class Mappings
// =============================================================================

const layoutClasses = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  between: 'flex-row justify-between',
} as const;

const gapClasses = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
} as const;

const ptClasses = {
  3: 'pt-3',
  4: 'pt-4',
  6: 'pt-6',
} as const;

const mtClasses = {
  0: '',
  3: 'mt-3',
  4: 'mt-4',
  6: 'mt-6',
  auto: 'mt-auto',
} as const;

// =============================================================================
// Component
// =============================================================================

export function PageFooterActions({
  children,
  layout = 'row',
  gap = 3,
  pt = 4,
  mt = 0,
  divider = true,
  responsive = false,
  className,
}: PageFooterActionsProps) {
  const isRowLayout = layout === 'row' || layout === 'row-reverse';

  return (
    <div
      className={cn(
        'flex items-center',
        layoutClasses[layout],
        gapClasses[gap],
        ptClasses[pt],
        mtClasses[mt],
        divider && 'border-t border-border',
        responsive && isRowLayout && 'flex-col sm:flex-row',
        className
      )}
    >
      {children}
    </div>
  );
}

PageFooterActions.displayName = 'PageFooterActions';
