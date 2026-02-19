'use client';

/**
 * PageImageAnnotation - Image annotation overlay
 *
 * Renders annotation markers on top of a dental image. Each annotation
 * is displayed as a marker, rectangle, circle, or arrow with a label
 * tooltip on hover.
 *
 * @example
 * ```tsx
 * <PageImageAnnotation
 *   image={{
 *     id: '1',
 *     url: '/img/periapical.jpg',
 *     type: 'periapical',
 *     patientId: 'p1',
 *     patientName: 'Maria Silva',
 *     capturedDate: '2026-02-10',
 *     annotations: [
 *       { id: 'a1', x: 30, y: 40, label: 'Caries', type: 'marker', color: '#ef4444' },
 *       { id: 'a2', x: 50, y: 20, width: 15, height: 10, label: 'Crown', type: 'rectangle' },
 *     ],
 *     createdAt: '2026-02-10',
 *     updatedAt: '2026-02-10',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { DentalImageInfo, ImageAnnotationData } from './types';
import type { DentalImageType } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageImageAnnotationProps {
  /** Image with annotations to render */
  image: DentalImageInfo;
  /** Callback when an annotation is clicked */
  onAnnotationClick?: (annotationId: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_LABEL: Record<DentalImageType, string> = {
  periapical: tPageShell('domain.odonto.imaging.annotation.typePeriapical', 'Periapical'),
  panoramic: tPageShell('domain.odonto.imaging.annotation.typePanoramic', 'Panoramic'),
  bitewing: tPageShell('domain.odonto.imaging.annotation.typeBitewing', 'Bitewing'),
  cephalometric: tPageShell('domain.odonto.imaging.annotation.typeCephalometric', 'Cephalometric'),
  'intraoral-photo': tPageShell('domain.odonto.imaging.annotation.typeIntraoral', 'Intraoral Photo'),
  cbct: tPageShell('domain.odonto.imaging.annotation.typeCbct', 'CBCT'),
};

const DEFAULT_COLOR = '#3b82f6';

// =============================================================================
// Sub-components
// =============================================================================

function AnnotationMarker({
  annotation,
  onClick,
}: {
  annotation: ImageAnnotationData;
  onClick?: (id: string) => void;
}) {
  const color = annotation.color || DEFAULT_COLOR;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${annotation.x}%`,
    top: `${annotation.y}%`,
  };

  function handleClick() {
    onClick?.(annotation.id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(annotation.id);
    }
  }

  const commonProps = {
    role: 'button' as const,
    tabIndex: 0,
    className: 'group cursor-pointer',
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    'aria-label': annotation.label,
  };

  switch (annotation.type) {
    case 'marker':
      return (
        <div
          {...commonProps}
          style={{
            ...baseStyle,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: color }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {annotation.label}
          </div>
        </div>
      );

    case 'rectangle':
      return (
        <div
          {...commonProps}
          style={{
            ...baseStyle,
            width: `${annotation.width || 10}%`,
            height: `${annotation.height || 10}%`,
            border: `2px solid ${color}`,
            backgroundColor: `${color}20`,
          }}
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {annotation.label}
          </div>
        </div>
      );

    case 'circle':
      return (
        <div
          {...commonProps}
          style={{
            ...baseStyle,
            width: `${annotation.width || 10}%`,
            height: `${annotation.height || 10}%`,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            backgroundColor: `${color}20`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {annotation.label}
          </div>
        </div>
      );

    case 'arrow':
      return (
        <div
          {...commonProps}
          style={{
            ...baseStyle,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px]"
            style={{ borderBottomColor: color }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {annotation.label}
          </div>
        </div>
      );
  }
}

// =============================================================================
// Component
// =============================================================================

export function PageImageAnnotation({
  image,
  onAnnotationClick,
  className,
}: PageImageAnnotationProps) {
  const annotations = image.annotations || [];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <StatusBadge variant="accent" label={TYPE_LABEL[image.type]} />
        {annotations.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {annotations.length}{' '}
            {tPageShell('domain.odonto.imaging.annotation.count', 'annotations')}
          </span>
        )}
      </div>

      {/* Image with overlay */}
      <div className="relative w-full aspect-video rounded-lg bg-muted overflow-hidden">
        <img
          src={image.url}
          alt={`${TYPE_LABEL[image.type]} - ${image.patientName}`}
          className="w-full h-full object-contain"
        />

        {/* Annotation overlays */}
        {annotations.map((annotation) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            onClick={onAnnotationClick}
          />
        ))}
      </div>
    </div>
  );
}
