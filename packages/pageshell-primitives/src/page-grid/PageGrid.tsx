/**
 * PageGrid Primitive
 *
 * Responsive grid layout for displaying lists of items.
 * Supports loading states, empty states, and various column configurations.
 *
 * @module page-grid
 */

'use client';

import {
  type ReactNode,
  type ReactElement,
  isValidElement,
  useMemo,
  type ComponentType,
} from 'react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export type PageGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
export type PageGridGap = 2 | 3 | 4 | 5 | 6 | 8;

/**
 * Animation variant for grid items
 */
export type PageGridAnimation = 'fade' | 'slide-up' | 'scale' | 'none';

export interface PageGridResponsive {
  /** Columns at sm breakpoint (640px) */
  sm?: PageGridColumns;
  /** Columns at md breakpoint (768px) */
  md?: PageGridColumns;
  /** Columns at lg breakpoint (1024px) */
  lg?: PageGridColumns;
  /** Columns at xl breakpoint (1280px) */
  xl?: PageGridColumns;
  /** Columns at 2xl breakpoint (1536px) */
  '2xl'?: PageGridColumns;
}

/**
 * Empty state configuration (primitive version - action is ReactNode only)
 */
export interface PageGridEmptyState {
  /** Empty state title */
  title: string;
  /** Empty state description */
  description?: string;
  /** Optional icon - accepts component or React element */
  icon?: ComponentType<{ className?: string }> | ReactElement;
  /** Optional action - ReactNode */
  action?: ReactNode;
}

/**
 * Animation config for grid items
 */
export interface PageGridAnimationConfig {
  /** Base animation class */
  animateClass: string;
  /** Function to get delay class by index */
  animateDelayClass: (index: number) => string;
}

export interface PageGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of columns (fixed) */
  columns?: PageGridColumns;
  /** Responsive column configuration */
  responsive?: PageGridResponsive;
  /** Enable auto-fit columns based on minItemWidth */
  autoFit?: boolean;
  /** Minimum item width for auto-fit (in pixels) */
  minItemWidth?: number;
  /** Gap between items */
  gap?: PageGridGap;
  /** Enable staggered animation */
  animated?: boolean;
  /** Animation variant */
  animation?: PageGridAnimation;
  /** Animation config (from theme context) */
  animationConfig?: PageGridAnimationConfig;
  /** Maximum animation delay index */
  maxAnimationDelay?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton items to show when loading */
  skeletonCount?: number;
  /** Skeleton component to render when loading */
  skeleton?: ReactNode;
  /** Empty state configuration */
  emptyState?: PageGridEmptyState;
  /** Custom key extractor function */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Enable column spanning for asymmetric layouts */
  allowColSpan?: boolean;
  /** Function to determine col-span for each item */
  getColSpan?: (item: T, index: number) => number;
  /** Additional CSS classes for the grid container */
  className?: string;
  /** Additional CSS classes for each item wrapper */
  itemClassName?: string;
  /** Accessible label for the grid */
  ariaLabel?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Class Mappings
// =============================================================================

const columnClasses: Record<PageGridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const responsiveColumnClasses = {
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
  },
  '2xl': {
    1: '2xl:grid-cols-1',
    2: '2xl:grid-cols-2',
    3: '2xl:grid-cols-3',
    4: '2xl:grid-cols-4',
    5: '2xl:grid-cols-5',
    6: '2xl:grid-cols-6',
  },
};

const gapClasses: Record<PageGridGap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
};

const colSpanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
};

const animationClasses: Record<PageGridAnimation, string> = {
  fade: 'portal-animate-fade',
  'slide-up': 'portal-animate-slide-up',
  scale: 'portal-animate-scale',
  none: '',
};

// Default animation config (uses portal-animate-* classes)
const defaultAnimationConfig: PageGridAnimationConfig = {
  animateClass: 'portal-animate-in',
  animateDelayClass: (index: number) => `portal-animate-in-delay-${Math.min(index, 8)}`,
};

// =============================================================================
// Sub-components
// =============================================================================

function GridEmptyState({ emptyState }: { emptyState: PageGridEmptyState }) {
  const renderIcon = () => {
    if (!emptyState.icon) return null;

    if (isValidElement(emptyState.icon)) {
      return emptyState.icon;
    }

    const IconComponent = emptyState.icon as ComponentType<{ className?: string }>;
    return <IconComponent className="h-12 w-12" />;
  };

  return (
    <div
      className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      {emptyState.icon && (
        <div className="mb-4 text-muted-foreground">{renderIcon()}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{emptyState.title}</h3>
      {emptyState.description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {emptyState.description}
        </p>
      )}
      {emptyState.action && <div className="mt-4">{emptyState.action}</div>}
    </div>
  );
}

function GridSkeleton({
  count,
  skeleton,
  animated,
  animation,
  maxDelay,
  config,
  itemClassName,
}: {
  count: number;
  skeleton: ReactNode;
  animated: boolean;
  animation: PageGridAnimation;
  maxDelay: number;
  config: PageGridAnimationConfig;
  itemClassName?: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`skeleton-${index}`}
          role="listitem"
          aria-hidden="true"
          className={cn(
            animated && animation !== 'none' && animationClasses[animation],
            animated && config.animateDelayClass(Math.min(index + 1, maxDelay)),
            itemClassName
          )}
        >
          {skeleton}
        </div>
      ))}
    </>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * PageGrid - Responsive grid layout primitive
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
 *     action: <Button>Criar Curso</Button>
 *   }}
 * />
 */
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
  animationConfig = defaultAnimationConfig,
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
}: PageGridProps<T>) {
  // Get column span for an item
  const getItemColSpan = (item: T, index: number): string => {
    if (!allowColSpan || !getColSpan) return '';

    const span = getColSpan(item, index);
    if (span < 1 || span > 6) return '';

    return colSpanClasses[span] || '';
  };

  // Build column classes
  const buildColumnClasses = (): string => {
    if (autoFit) {
      return '';
    }

    if (responsive) {
      const classes: string[] = ['grid-cols-1'];

      if (responsive.sm) {
        classes.push(responsiveColumnClasses.sm[responsive.sm]);
      }
      if (responsive.md) {
        classes.push(responsiveColumnClasses.md[responsive.md]);
      }
      if (responsive.lg) {
        classes.push(responsiveColumnClasses.lg[responsive.lg]);
      }
      if (responsive.xl) {
        classes.push(responsiveColumnClasses.xl[responsive.xl]);
      }
      if (responsive['2xl']) {
        classes.push(responsiveColumnClasses['2xl'][responsive['2xl']]);
      }

      return classes.join(' ');
    }

    // Fixed columns with default responsive behavior
    const defaultResponsive: Record<PageGridColumns, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    };

    return defaultResponsive[columns];
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
  const getItemKey = (item: T, index: number): string | number => {
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
  };

  // Common grid props
  const gridProps = {
    role: 'list' as const,
    'aria-label': ariaLabel,
    'data-testid': testId,
    className: cn('grid', buildColumnClasses(), gapClasses[gap], className),
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
          config={animationConfig}
          itemClassName={itemClassName}
        />
      </div>
    );
  }

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div {...gridProps}>
        <GridEmptyState emptyState={emptyState} />
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
                animationConfig.animateDelayClass(Math.min(index + 1, maxAnimationDelay)),
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
