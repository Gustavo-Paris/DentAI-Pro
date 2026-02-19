'use client';

/**
 * PageDentalImage - Dental image viewer
 *
 * Displays a dental image with type badge, date, patient name,
 * captured-by info, and description. Includes placeholder zoom controls
 * and click-to-expand behavior.
 *
 * @example
 * ```tsx
 * <PageDentalImage
 *   image={{
 *     id: '1',
 *     url: '/images/panoramic-001.jpg',
 *     type: 'panoramic',
 *     patientId: 'p1',
 *     patientName: 'Maria Silva',
 *     capturedDate: '2026-02-10',
 *     capturedBy: 'Dr. Santos',
 *     description: 'Panoramic radiograph - routine check',
 *     createdAt: '2026-02-10',
 *     updatedAt: '2026-02-10',
 *   }}
 *   onExpand={(id) => console.log('expand', id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { DentalImageInfo } from './types';
import type { DentalImageType } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageDentalImageProps {
  /** Image data to display */
  image: DentalImageInfo;
  /** Callback when the image is clicked for full-screen expansion */
  onExpand?: (id: string) => void;
  /** Callback for zoom-in action */
  onZoomIn?: () => void;
  /** Callback for zoom-out action */
  onZoomOut?: () => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_LABEL: Record<DentalImageType, string> = {
  periapical: tPageShell('domain.odonto.imaging.viewer.typePeriapical', 'Periapical'),
  panoramic: tPageShell('domain.odonto.imaging.viewer.typePanoramic', 'Panoramic'),
  bitewing: tPageShell('domain.odonto.imaging.viewer.typeBitewing', 'Bitewing'),
  cephalometric: tPageShell('domain.odonto.imaging.viewer.typeCephalometric', 'Cephalometric'),
  'intraoral-photo': tPageShell('domain.odonto.imaging.viewer.typeIntraoral', 'Intraoral Photo'),
  cbct: tPageShell('domain.odonto.imaging.viewer.typeCbct', 'CBCT'),
};

// =============================================================================
// Component
// =============================================================================

export function PageDentalImage({
  image,
  onExpand,
  onZoomIn,
  onZoomOut,
  className,
}: PageDentalImageProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Image container */}
      <div
        role="button"
        tabIndex={0}
        className="relative w-full aspect-video bg-muted cursor-pointer group"
        onClick={() => onExpand?.(image.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand?.(image.id);
          }
        }}
        aria-label={tPageShell('domain.odonto.imaging.viewer.expandLabel', 'Click to expand image')}
      >
        <img
          src={image.url}
          alt={`${TYPE_LABEL[image.type]} - ${image.patientName}`}
          className="w-full h-full object-contain"
        />

        {/* Type badge overlay */}
        <div className="absolute top-2 left-2">
          <StatusBadge variant="accent" label={TYPE_LABEL[image.type]} />
        </div>

        {/* Expand hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <PageIcon
            name="maximize"
            className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 space-y-3">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onZoomIn}>
            <PageIcon name="zoom-in" className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onZoomOut}>
            <PageIcon name="zoom-out" className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <PageIcon name="user" className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground font-medium">{image.patientName}</span>
          </div>

          <div className="flex items-center gap-2">
            <PageIcon name="calendar" className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{image.capturedDate}</span>
          </div>

          {image.capturedBy && (
            <div className="flex items-center gap-2">
              <PageIcon name="camera" className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {tPageShell('domain.odonto.imaging.viewer.capturedBy', 'Captured by')}: {image.capturedBy}
              </span>
            </div>
          )}

          {image.teeth && image.teeth.length > 0 && (
            <div className="flex items-center gap-2">
              <PageIcon name="hash" className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {tPageShell('domain.odonto.imaging.viewer.teeth', 'Teeth')}: {image.teeth.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {image.description && (
          <p className="text-sm text-muted-foreground border-t border-border pt-3">
            {image.description}
          </p>
        )}
      </div>
    </div>
  );
}
