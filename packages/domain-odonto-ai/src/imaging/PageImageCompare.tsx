'use client';

/**
 * PageImageCompare - Side-by-side image comparison
 *
 * Accepts an ImageComparisonPair and displays before/after dental images
 * with labels and dates. Responsive layout: side-by-side on desktop,
 * stacked on mobile.
 *
 * @example
 * ```tsx
 * <PageImageCompare
 *   pair={{
 *     before: { id: '1', url: '/img/before.jpg', type: 'periapical', ... },
 *     after:  { id: '2', url: '/img/after.jpg',  type: 'periapical', ... },
 *     label: 'Treatment progress',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { ImageComparisonPair, DentalImageInfo } from './types';
import type { DentalImageType } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageImageCompareProps {
  /** Before/after image pair */
  pair: ImageComparisonPair;
  /** Additional CSS class names */
  className?: string;
  /** Override label for "Before" */
  beforeLabel?: string;
  /** Override label for "After" */
  afterLabel?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_LABEL: Record<DentalImageType, string> = {
  periapical: tPageShell('domain.odonto.imaging.compare.typePeriapical', 'Periapical'),
  panoramic: tPageShell('domain.odonto.imaging.compare.typePanoramic', 'Panoramic'),
  bitewing: tPageShell('domain.odonto.imaging.compare.typeBitewing', 'Bitewing'),
  cephalometric: tPageShell('domain.odonto.imaging.compare.typeCephalometric', 'Cephalometric'),
  'intraoral-photo': tPageShell('domain.odonto.imaging.compare.typeIntraoral', 'Intraoral Photo'),
  cbct: tPageShell('domain.odonto.imaging.compare.typeCbct', 'CBCT'),
};

// =============================================================================
// Sub-components
// =============================================================================

function ComparisonPanel({
  image,
  label,
}: {
  image: DentalImageInfo;
  label: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden">
      {/* Label header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <StatusBadge variant="outline" label={TYPE_LABEL[image.type]} />
      </div>

      {/* Image */}
      <div className="relative w-full aspect-video bg-muted">
        <img
          src={image.url}
          alt={`${label} - ${TYPE_LABEL[image.type]}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Date info */}
      <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
        <PageIcon name="calendar" className="w-3 h-3" />
        {image.capturedDate}
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageImageCompare({
  pair,
  className,
  beforeLabel = tPageShell('domain.odonto.imaging.compare.before', 'Before'),
  afterLabel = tPageShell('domain.odonto.imaging.compare.after', 'After'),
}: PageImageCompareProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Comparison title */}
      {pair.label && (
        <h3 className="text-sm font-semibold text-foreground">{pair.label}</h3>
      )}

      {/* Side-by-side / stacked layout */}
      <div className="flex flex-col md:flex-row gap-4">
        <ComparisonPanel image={pair.before} label={beforeLabel} />

        {/* Arrow indicator */}
        <div className="flex items-center justify-center">
          <PageIcon
            name="arrow-right"
            className="w-5 h-5 text-muted-foreground hidden md:block"
          />
          <PageIcon
            name="arrow-down"
            className="w-5 h-5 text-muted-foreground md:hidden"
          />
        </div>

        <ComparisonPanel image={pair.after} label={afterLabel} />
      </div>
    </div>
  );
}
