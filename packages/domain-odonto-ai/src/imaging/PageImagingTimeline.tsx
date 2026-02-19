'use client';

/**
 * PageImagingTimeline - Imaging history timeline
 *
 * Vertical timeline displaying dental images chronologically. Each entry
 * shows a thumbnail, image type, capture date, teeth involved, and
 * the person who captured it.
 *
 * @example
 * ```tsx
 * <PageImagingTimeline
 *   images={[
 *     { id: '1', url: '/img/pan.jpg', thumbnailUrl: '/img/pan-thumb.jpg',
 *       type: 'panoramic', patientId: 'p1', patientName: 'Maria Silva',
 *       capturedDate: '2026-02-10', capturedBy: 'Dr. Santos',
 *       teeth: [11, 12], createdAt: '2026-02-10', updatedAt: '2026-02-10' },
 *   ]}
 *   onSelect={(id) => console.log('selected', id)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { DentalImageInfo } from './types';
import type { DentalImageType } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageImagingTimelineProps {
  /** Array of dental images ordered by date */
  images: DentalImageInfo[];
  /** Callback when a timeline entry is clicked */
  onSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_LABEL: Record<DentalImageType, string> = {
  periapical: tPageShell('domain.odonto.imaging.timeline.typePeriapical', 'Periapical'),
  panoramic: tPageShell('domain.odonto.imaging.timeline.typePanoramic', 'Panoramic'),
  bitewing: tPageShell('domain.odonto.imaging.timeline.typeBitewing', 'Bitewing'),
  cephalometric: tPageShell('domain.odonto.imaging.timeline.typeCephalometric', 'Cephalometric'),
  'intraoral-photo': tPageShell('domain.odonto.imaging.timeline.typeIntraoral', 'Intraoral Photo'),
  cbct: tPageShell('domain.odonto.imaging.timeline.typeCbct', 'CBCT'),
};

// =============================================================================
// Component
// =============================================================================

export function PageImagingTimeline({
  images,
  onSelect,
  className,
}: PageImagingTimelineProps) {
  if (images.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-muted-foreground', className)}>
        <PageIcon name="image" className="w-10 h-10 mb-2" />
        <p className="text-sm">
          {tPageShell('domain.odonto.imaging.timeline.empty', 'No imaging history')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {images.map((image) => (
          <div
            key={image.id}
            role="button"
            tabIndex={0}
            className="relative flex gap-4 pl-10 cursor-pointer group"
            onClick={() => onSelect?.(image.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(image.id);
              }
            }}
          >
            {/* Timeline dot */}
            <div className="absolute left-3.5 top-3 w-3 h-3 rounded-full border-2 border-primary bg-card" />

            {/* Entry card */}
            <div className="flex-1 rounded-lg border border-border bg-card p-3 transition-colors group-hover:bg-accent/5">
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted overflow-hidden">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={TYPE_LABEL[image.type]}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="accent" label={TYPE_LABEL[image.type]} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PageIcon name="calendar" className="w-3 h-3" />
                    {image.capturedDate}
                  </div>

                  {image.teeth && image.teeth.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PageIcon name="hash" className="w-3 h-3" />
                      {tPageShell('domain.odonto.imaging.timeline.teeth', 'Teeth')}: {image.teeth.join(', ')}
                    </div>
                  )}

                  {image.capturedBy && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PageIcon name="camera" className="w-3 h-3" />
                      {image.capturedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
