'use client';

/**
 * CardSkeletonFactory
 *
 * Factory function for creating card skeleton components
 * with consistent structure and animation.
 *
 * @module skeleton-factory
 */

import * as React from 'react';
import type { FC } from 'react';
import { cn } from '@pageshell/core';
import { Card, Skeleton, EditorialCard } from '@pageshell/primitives';
import type {
  CardSkeletonConfig,
  CardSkeletonProps,
  CardSkeletonPreset,
} from './types';
import { getCardSkeletonPreset } from './presets';

/**
 * Size mappings for icon skeletons
 */
const ICON_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

/**
 * Gap mappings for content lines
 */
const GAP_SIZES = {
  tight: 'space-y-1',
  normal: 'space-y-2',
  loose: 'space-y-3',
};

/**
 * Creates a card skeleton component from configuration
 *
 * @param config - The skeleton configuration
 * @returns A React component that renders the skeleton
 *
 * @example
 * ```tsx
 * // Create a custom skeleton
 * const MyCardSkeleton = createCardSkeleton({
 *   variant: 'compact',
 *   header: { icon: true, lines: 2 },
 *   content: { lines: 3, widths: ['60%', '80%', '40%'] },
 *   footer: { showAction: true },
 * });
 *
 * // Use in component
 * <MyCardSkeleton index={0} />
 * ```
 */
export function createCardSkeleton(
  config: CardSkeletonConfig
): FC<CardSkeletonProps> {
  const CardSkeletonComponent: FC<CardSkeletonProps> = ({
    index = 0,
    className,
  }) => {
    const delay = config.animationDelay ?? index * 100;

    // Render based on variant
    switch (config.variant) {
      case 'editorial':
        return renderEditorialSkeleton(config, className, delay);
      case 'avatar':
        return renderAvatarSkeleton(config, className, delay);
      case 'compact':
      default:
        return renderCompactSkeleton(config, className, delay);
    }
  };

  CardSkeletonComponent.displayName = 'CardSkeleton';
  return CardSkeletonComponent;
}

/**
 * Renders a compact card skeleton
 */
function renderCompactSkeleton(
  config: CardSkeletonConfig,
  className?: string,
  delay?: number
): React.JSX.Element {
  const { header, content, footer } = config;

  return (
    <Card
      className={cn('p-4', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: icon + content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          {header?.icon && (
            <Skeleton
              className={cn(ICON_SIZES[header.iconSize ?? 'md'], 'rounded-lg')}
            />
          )}

          {/* Content area */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Header lines */}
            {header?.lines && (
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: header.lines }).map((_, i) => (
                  <Skeleton
                    key={`header-${i}`}
                    className="h-4"
                    style={{
                      width: header.lineWidths?.[i] ?? `${60 + i * 10}%`,
                    }}
                  />
                ))}
                {header.badge && (
                  <Skeleton className="h-5 w-16 rounded-full" />
                )}
              </div>
            )}

            {/* Content lines */}
            {content?.lines && (
              <div className={cn(GAP_SIZES[content.gap ?? 'normal'])}>
                {Array.from({ length: content.lines }).map((_, i) => (
                  <Skeleton
                    key={`content-${i}`}
                    className="h-3"
                    style={{
                      width: content.widths?.[i] ?? `${50 + i * 10}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: action button */}
        {footer?.showAction && (
          <Skeleton
            className="h-9 rounded-lg"
            style={{ width: footer.actionWidth ?? '7rem' }}
          />
        )}
      </div>

      {/* Footer stats */}
      {footer?.showStats && footer.statCount && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          {Array.from({ length: footer.statCount }).map((_, i) => (
            <Skeleton
              key={`stat-${i}`}
              className="h-4 w-20"
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Renders an editorial card skeleton (with image)
 */
function renderEditorialSkeleton(
  config: CardSkeletonConfig,
  className?: string,
  delay?: number
): React.JSX.Element {
  const { image, header, content, footer } = config;

  return (
    <EditorialCard
      variant="static"
      shadowIntensity="subtle"
      className={cn('h-full', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden bg-muted"
        style={{ aspectRatio: image?.aspectRatio ?? '4/3' }}
      >
        <Skeleton className="absolute inset-0" animation="shimmer" />
        {image?.showBadge && (
          <div className="absolute left-0 top-3 sm:top-4">
            <Skeleton className="h-5 w-20 sm:h-6 sm:w-24" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 lg:p-6">
        {/* Rating placeholder for courses */}
        <div className="mb-3 flex items-center gap-1.5 sm:mb-4 sm:gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5" />
            ))}
          </div>
          <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
        </div>

        {/* Title */}
        <div className="mb-4 space-y-2 sm:mb-5">
          {Array.from({ length: header?.lines ?? 2 }).map((_, i) => (
            <Skeleton
              key={`title-${i}`}
              className="h-5 sm:h-6"
              style={{ width: header?.lineWidths?.[i] ?? (i === 0 ? '100%' : '75%') }}
            />
          ))}
        </div>

        {/* Creator/avatar */}
        <div className="mt-auto flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full sm:h-8 sm:w-8" />
          <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-14 sm:h-3 sm:w-16" />
            <Skeleton className="h-5 w-16 sm:h-6 sm:w-20" />
          </div>
        </div>
      </div>
    </EditorialCard>
  );
}

/**
 * Renders an avatar card skeleton
 */
function renderAvatarSkeleton(
  config: CardSkeletonConfig,
  className?: string,
  delay?: number
): React.JSX.Element {
  const { image, header, content, footer } = config;

  return (
    <EditorialCard
      variant="static"
      className={cn('h-full', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Avatar image */}
      <Skeleton
        className="w-full rounded-none"
        style={{ aspectRatio: image?.aspectRatio ?? '1/1' }}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Name and expertise */}
        {header?.lines && (
          <div className="space-y-2">
            {Array.from({ length: header.lines }).map((_, i) => (
              <Skeleton
                key={`header-${i}`}
                className={i === 0 ? 'h-6' : 'h-4'}
                style={{ width: header.lineWidths?.[i] ?? `${75 + i * 10}%` }}
              />
            ))}
          </div>
        )}

        {/* Stats row */}
        {content?.lines && (
          <div className="mt-3 flex items-center gap-4">
            {Array.from({ length: content.lines }).map((_, i) => (
              <Skeleton
                key={`stat-${i}`}
                className="h-4"
                style={{ width: content.widths?.[i] ?? '40%' }}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-5 w-10 rounded-none" />
          <Skeleton className="h-5 w-14 rounded-none" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <Skeleton className="h-3 w-16 rounded-none" />
          <Skeleton className="mt-1 h-6 w-20 rounded-none" />
        </div>
        <Skeleton className="h-4 w-16 rounded-none" />
      </div>
    </EditorialCard>
  );
}

/**
 * Creates a card skeleton from a preset
 *
 * @param preset - The preset name
 * @returns A React component that renders the skeleton
 *
 * @example
 * ```tsx
 * const BrainstormSkeleton = createCardSkeletonFromPreset('brainstorm');
 * const CourseSkeleton = createCardSkeletonFromPreset('course');
 *
 * // Use in component
 * <BrainstormSkeleton index={0} />
 * ```
 */
export function createCardSkeletonFromPreset(
  preset: CardSkeletonPreset
): FC<CardSkeletonProps> {
  const config = getCardSkeletonPreset(preset);
  return createCardSkeleton(config);
}

/**
 * Pre-built skeleton components for common card types
 */
export const BrainstormCardSkeleton = createCardSkeletonFromPreset('brainstorm');
export const CourseCardSkeleton = createCardSkeletonFromPreset('course');
export const MentorCardSkeleton = createCardSkeletonFromPreset('mentor');
export const ServiceCardSkeleton = createCardSkeletonFromPreset('service');
export const PackageCardSkeleton = createCardSkeletonFromPreset('package');
