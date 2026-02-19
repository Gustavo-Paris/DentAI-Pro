'use client';

/**
 * PageImageGallery - Image gallery grid
 *
 * Displays dental images as a thumbnail grid with type badges and date
 * overlays. Supports filtering by image type and click selection.
 *
 * @example
 * ```tsx
 * <PageImageGallery
 *   images={[
 *     { id: '1', url: '/img/pan.jpg', thumbnailUrl: '/img/pan-thumb.jpg',
 *       type: 'panoramic', patientId: 'p1', patientName: 'Maria Silva',
 *       capturedDate: '2026-02-10', createdAt: '2026-02-10', updatedAt: '2026-02-10' },
 *   ]}
 *   onSelect={(id) => console.log('selected', id)}
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

export interface PageImageGalleryProps {
  /** Array of dental images to display */
  images: DentalImageInfo[];
  /** Callback when a thumbnail is clicked */
  onSelect?: (id: string) => void;
  /** Currently active type filter (undefined = show all) */
  activeFilter?: DentalImageType;
  /** Callback when a type filter is selected */
  onFilterChange?: (type: DentalImageType | undefined) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_LABEL: Record<DentalImageType, string> = {
  periapical: tPageShell('domain.odonto.imaging.gallery.typePeriapical', 'Periapical'),
  panoramic: tPageShell('domain.odonto.imaging.gallery.typePanoramic', 'Panoramic'),
  bitewing: tPageShell('domain.odonto.imaging.gallery.typeBitewing', 'Bitewing'),
  cephalometric: tPageShell('domain.odonto.imaging.gallery.typeCephalometric', 'Cephalometric'),
  'intraoral-photo': tPageShell('domain.odonto.imaging.gallery.typeIntraoral', 'Intraoral Photo'),
  cbct: tPageShell('domain.odonto.imaging.gallery.typeCbct', 'CBCT'),
};

const ALL_TYPES: DentalImageType[] = [
  'periapical',
  'panoramic',
  'bitewing',
  'cephalometric',
  'intraoral-photo',
  'cbct',
];

// =============================================================================
// Component
// =============================================================================

export function PageImageGallery({
  images,
  onSelect,
  activeFilter,
  onFilterChange,
  className,
}: PageImageGalleryProps) {
  const filtered = activeFilter
    ? images.filter((img) => img.type === activeFilter)
    : images;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeFilter === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange?.(undefined)}
        >
          {tPageShell('domain.odonto.imaging.gallery.allTypes', 'All')}
        </Button>
        {ALL_TYPES.map((type) => (
          <Button
            key={type}
            variant={activeFilter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange?.(type)}
          >
            {TYPE_LABEL[type]}
          </Button>
        ))}
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <PageIcon name="image" className="w-10 h-10 mb-2" />
          <p className="text-sm">
            {tPageShell('domain.odonto.imaging.gallery.empty', 'No images found')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((image) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              className="relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer group transition-shadow hover:shadow-md"
              onClick={() => onSelect?.(image.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(image.id);
                }
              }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-muted">
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={`${TYPE_LABEL[image.type]} - ${image.patientName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />

                {/* Type badge */}
                <div className="absolute top-1.5 left-1.5">
                  <StatusBadge variant="accent" label={TYPE_LABEL[image.type]} />
                </div>

                {/* Date overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <span className="text-xs text-white">{image.capturedDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
