/**
 * PageGrid Component
 *
 * Responsive grid layout for displaying lists of items.
 * Supports loading states, empty states, and various column configurations.
 *
 * @package @pageshell/layouts
 *
 * @example Basic grid
 * <PageGrid
 *   items={courses}
 *   renderItem={(course) => <CourseCard course={course} />}
 *   columns={4}
 * />
 *
 * @example With loading state
 * <PageGrid
 *   items={courses}
 *   renderItem={(course) => <CourseCard course={course} />}
 *   isLoading={isLoading}
 *   skeletonCount={8}
 *   skeleton={<CourseCardSkeleton />}
 * />
 *
 * @example With empty state
 * <PageGrid
 *   items={courses}
 *   renderItem={(course) => <CourseCard course={course} />}
 *   emptyState={{
 *     title: "Nenhum curso encontrado",
 *     description: "Comece criando seu primeiro curso",
 *     action: { label: "Criar Curso", href: "/new" }
 *   }}
 *   LinkComponent={Link}
 * />
 *
 * @example Asymmetric layout with column spanning
 * <PageGrid
 *   items={dashboardCards}
 *   renderItem={(card) => <DashboardCard {...card} />}
 *   columns={3}
 *   allowColSpan
 *   getColSpan={(card) => card.featured ? 2 : 1}
 * />
 */

'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@pageshell/core';
import { usePageShellContext } from '@pageshell/theme';
import { gapClasses, colSpanClasses, animationClasses } from './constants';
import { buildColumnClasses } from './utils';
import { GridEmptyState, GridSkeleton } from './components';
import type { PageGridProps } from './types';

// =============================================================================
// PageGrid Component
// =============================================================================

export function PageGrid<T>({
  items,
  renderItem,
  columns = 4,
  responsive,
  autoFit = false,
  minItemWidth = 280,
  gap = 6,
  animated = true,
  animation = 'fade',
  maxAnimationDelay = 8,
  isLoading = false,
  skeletonCount = 4,
  skeleton,
  emptyState,
  keyExtractor,
  allowColSpan = false,
  getColSpan,
  className,
  itemClassName,
  ariaLabel,
  testId,
  LinkComponent,
}: PageGridProps<T>) {
  const { config } = usePageShellContext();

  // Get column span for an item
  const getItemColSpan = (item: T, index: number): string => {
    if (!allowColSpan || !getColSpan) return '';

    const span = getColSpan(item, index);
    if (span < 1 || span > 6) return '';

    return colSpanClasses[span] || '';
  };

  // Grid style for auto-fit
  const gridStyle = useMemo(
    () =>
      autoFit
        ? {
            display: 'grid' as const,
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
          }
        : undefined,
    [autoFit, minItemWidth]
  );

  // Get item key
  const getItemKey = useCallback(
    (item: T, index: number): string | number => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if ('id' in obj) return String(obj.id);
        if ('_id' in obj) return String(obj._id);
        if ('key' in obj) return String(obj.key);
      }
      return index;
    },
    [keyExtractor]
  );

  // Build column classes
  const columnClassesStr = buildColumnClasses(autoFit, responsive, columns);

  // Common grid props for accessibility
  const gridProps = {
    role: 'list' as const,
    'aria-label': ariaLabel,
    'data-testid': testId,
    className: cn('grid', columnClassesStr, gapClasses[gap], className),
    style: gridStyle,
  };

  // Loading state
  if (isLoading && skeleton) {
    return (
      <div {...gridProps} aria-busy="true">
        <GridSkeleton
          count={skeletonCount}
          skeleton={skeleton}
          animated={animated}
          animation={animation}
          maxDelay={maxAnimationDelay}
          config={config}
          itemClassName={itemClassName}
        />
      </div>
    );
  }

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div {...gridProps}>
        <GridEmptyState emptyState={emptyState} LinkComponent={LinkComponent} />
      </div>
    );
  }

  // Empty without state configured
  if (items.length === 0) {
    return null;
  }

  // Normal grid
  return (
    <div {...gridProps}>
      {items.map((item, index) => (
        <div
          key={getItemKey(item, index)}
          role="listitem"
          className={cn(
            animated &&
              animation !== 'none' && [
                animationClasses[animation],
                config.animateDelay(Math.min(index + 1, maxAnimationDelay)),
              ],
            getItemColSpan(item, index),
            itemClassName
          )}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

PageGrid.displayName = 'PageGrid';
