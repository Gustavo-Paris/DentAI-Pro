/**
 * ListPageCardMedia Component
 *
 * Renders media (image thumbnails) for ListPageCard with aspect ratio,
 * hover zoom, and optional badge overlay support.
 *
 * @module list/components/ListPageCardMedia
 * @see ADR-0059 - ListPage Native Card Enhancements
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { MediaConfig } from '../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface ListPageCardMediaProps {
  /** Image source URL */
  src: string | null | undefined;
  /** Alt text for the image */
  alt?: string;
  /** Media configuration */
  config?: MediaConfig;
  /** Badge content to overlay on media */
  badgeContent?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  'video': 'aspect-video',
  '16/9': 'aspect-video',
  'square': 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  'auto': '',
};

const ROUNDED_CLASSES: Record<string, string> = {
  'none': 'rounded-none',
  'sm': 'rounded-sm',
  'md': 'rounded-md',
  'lg': 'rounded-lg',
  'top': 'rounded-t-lg',
};

const BADGE_POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-2 right-2',
  'top-left': 'top-2 left-2',
  'bottom-right': 'bottom-2 right-2',
  'bottom-left': 'bottom-2 left-2',
};

const OBJECT_FIT_CLASSES: Record<string, string> = {
  'cover': 'object-cover',
  'contain': 'object-contain',
  'fill': 'object-fill',
};

// =============================================================================
// Component
// =============================================================================

export function ListPageCardMedia({
  src,
  alt = '',
  config = {},
  badgeContent,
  className,
}: ListPageCardMediaProps) {
  const {
    aspectRatio = 'video',
    hoverZoom = false,
    objectFit = 'cover',
    rounded = 'top',
    badgeOverlay = false,
    badgePosition = 'top-right',
    fallback = 'none',
    fallbackIcon = 'image',
  } = config;

  // No image and no fallback - don't render
  if (!src && fallback === 'none') {
    return null;
  }

  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] ?? ASPECT_RATIO_CLASSES['video'];
  const roundedClass = ROUNDED_CLASSES[rounded] ?? ROUNDED_CLASSES['top'];
  const positionClass = BADGE_POSITION_CLASSES[badgePosition] ?? BADGE_POSITION_CLASSES['top-right'];
  const objectFitClass = OBJECT_FIT_CLASSES[objectFit] ?? OBJECT_FIT_CLASSES['cover'];

  // Render fallback icon when no source
  const FallbackIconComponent = fallbackIcon ? resolveIcon(fallbackIcon) : null;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectClass,
        roundedClass,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full transition-transform duration-300',
            objectFitClass,
            hoverZoom && 'group-hover:scale-105'
          )}
        />
      ) : fallback === 'icon' && FallbackIconComponent ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <FallbackIconComponent className="h-12 w-12 text-muted-foreground/50" />
        </div>
      ) : null}

      {/* Badge overlay */}
      {badgeOverlay && badgeContent && (
        <div className={cn('absolute z-10', positionClass)}>
          {badgeContent}
        </div>
      )}
    </div>
  );
}

ListPageCardMedia.displayName = 'ListPageCardMedia';
