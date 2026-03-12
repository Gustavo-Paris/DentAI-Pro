import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProportionLines } from '@/hooks/domain/dsd/useProportionLines';

// =============================================================================
// Types
// =============================================================================

export type ProportionLayerType = 'midline' | 'goldenRatio' | 'smileArc';

interface ProportionOverlayProps {
  lines: ProportionLines;
  visibleLayers: Set<ProportionLayerType>;
  containerWidth: number;
  containerHeight: number;
  /** Whether the midline has been manually adjusted (shows indicator). */
  isMidlineAdjusted?: boolean;
  /** Callback when the user drags the midline. Delta is in percentage (0-100). */
  onMidlineOffsetChange?: (deltaX: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

// SVG attributes require resolved color values — CSS custom properties
// not universally supported in SVG stroke/fill attributes.
const COLORS = {
  midline: '#ef4444', // red
  goldenRatio: '#f59e0b', // amber
  goldenRatioGood: '#22c55e', // green (ratio close to ideal)
  smileArc: '#22c55e', // green
} as const;

/** Tolerance for comparing actual ratio vs golden ratio (1.618). */
const GOLDEN_RATIO_TOLERANCE = 0.2;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build a smooth SVG path string from an array of pixel-space points using
 * quadratic Bezier curves.
 *
 * For two points, draws a straight line.
 * For three or more, uses the midpoints of adjacent segments as on-curve
 * points with the original points as control points, producing a smooth curve.
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  // Start at the first point
  let d = `M${points[0].x},${points[0].y}`;

  // Line to the midpoint between the first and second point
  const mid0X = (points[0].x + points[1].x) / 2;
  const mid0Y = (points[0].y + points[1].y) / 2;
  d += ` L${mid0X},${mid0Y}`;

  // For each interior point, use it as a quadratic Bezier control point
  // with the midpoint to the next point as the endpoint
  for (let i = 1; i < points.length - 1; i++) {
    const cpX = points[i].x;
    const cpY = points[i].y;
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${cpX},${cpY} ${midX},${midY}`;
  }

  // Line to the last point
  const last = points[points.length - 1];
  d += ` L${last.x},${last.y}`;

  return d;
}

// =============================================================================
// Helpers — tooth position labels
// =============================================================================

/** Map positional index (from midline outward) to a human-readable label. */
function toothPositionLabel(index: number, t: (key: string) => string): string {
  const labels = [
    t('components.wizard.dsd.proportionOverlay.toothCentral'),
    t('components.wizard.dsd.proportionOverlay.toothLateral'),
    t('components.wizard.dsd.proportionOverlay.toothCanine'),
    t('components.wizard.dsd.proportionOverlay.toothPremolar'),
  ];
  return labels[index] ?? `#${index + 1}`;
}

// =============================================================================
// Component
// =============================================================================

export function ProportionOverlay({
  lines,
  visibleLayers,
  containerWidth,
  containerHeight,
  isMidlineAdjusted,
  onMidlineOffsetChange,
}: ProportionOverlayProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startClientX: number; startMidlinePct: number } | null>(null);

  if (!containerWidth || !containerHeight) return null;

  /** Convert percentage X to pixel value. */
  const px = (pct: number) => (pct / 100) * containerWidth;
  /** Convert percentage Y to pixel value. */
  const py = (pct: number) => (pct / 100) * containerHeight;

  const showMidline = visibleLayers.has('midline') && lines.midline;
  const showGoldenRatio =
    visibleLayers.has('goldenRatio') && lines.goldenRatio.length > 0;
  const showSmileArc =
    visibleLayers.has('smileArc') && lines.smileArc.length >= 2;

  const canDragMidline = showMidline && !!onMidlineOffsetChange;

  return (
    <svg
      aria-label={t('components.wizard.dsd.proportionOverlay.ariaLabel')}
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Midline — red dashed vertical line (draggable when enabled)       */}
      {/* ----------------------------------------------------------------- */}
      {showMidline && (() => {
        const midX = px(lines.midline!.x);
        const yStart = py(lines.midline!.yStart);
        const yEnd = py(lines.midline!.yEnd);
        const handleRadius = 5;

        const handlePointerDown = (e: React.PointerEvent) => {
          if (!canDragMidline) return;
          e.preventDefault();
          e.stopPropagation();
          (e.target as SVGElement).setPointerCapture(e.pointerId);
          dragStartRef.current = { startClientX: e.clientX, startMidlinePct: lines.midline!.x };
          setIsDragging(true);
        };
        const handlePointerMove = (e: React.PointerEvent) => {
          if (!isDragging || !dragStartRef.current || !canDragMidline) return;
          const deltaPixels = e.clientX - dragStartRef.current.startClientX;
          const deltaPct = (deltaPixels / containerWidth) * 100;
          onMidlineOffsetChange!(deltaPct);
        };
        const handlePointerUp = (e: React.PointerEvent) => {
          if (!isDragging) return;
          (e.target as SVGElement).releasePointerCapture(e.pointerId);
          setIsDragging(false);
          dragStartRef.current = null;
        };

        return (
          <g style={canDragMidline ? { pointerEvents: 'auto' } : undefined}>
            <line
              x1={midX}
              y1={yStart}
              x2={midX}
              y2={yEnd}
              stroke={COLORS.midline}
              strokeWidth={1}
              strokeDasharray="6 4"
              strokeOpacity={0.6}
            />
            {/* Drag handle — visible circle at top of midline */}
            {canDragMidline && (
              <circle
                cx={midX}
                cy={yStart + handleRadius + 2}
                r={handleRadius}
                fill={COLORS.midline}
                fillOpacity={isDragging ? 0.7 : 0.4}
                stroke="white"
                strokeWidth={1}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            )}
            {/* Wider invisible hit area for easier drag on mobile */}
            {canDragMidline && (
              <line
                x1={midX}
                y1={yStart}
                x2={midX}
                y2={yEnd}
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: isDragging ? 'grabbing' : 'ew-resize', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            )}
            <text
              x={midX + 6}
              y={yStart + 12}
              fill={COLORS.midline}
              fontSize={9}
              fontWeight={500}
              opacity={0.7}
            >
              {t('components.wizard.dsd.proportionOverlay.midline')}
              {isMidlineAdjusted ? ` (${t('components.wizard.dsd.proportionOverlay.midlineAdjusted')})` : ''}
            </text>
          </g>
        );
      })()}

      {/* ----------------------------------------------------------------- */}
      {/* Golden Ratio — amber/green brackets                               */}
      {/* ----------------------------------------------------------------- */}
      {showGoldenRatio &&
        lines.goldenRatio.map((bracket, idx) => {
          const isGood =
            Math.abs(bracket.ratio - bracket.ideal) <= GOLDEN_RATIO_TOLERANCE;
          const color = isGood ? COLORS.goldenRatioGood : COLORS.goldenRatio;

          // Pixel positions for the two teeth
          const cx1 = px(bracket.x1);
          const hw1 = px(bracket.w1) / 2;
          const cx2 = px(bracket.x2);
          const hw2 = px(bracket.w2) / 2;
          const bracketY = py(bracket.y) - 4; // slightly above the teeth

          // End-cap height
          const capH = 3;

          return (
            <g key={`gr-${idx}`}>
              {/* Bracket for tooth 1 (wider) */}
              <line
                x1={cx1 - hw1}
                y1={bracketY}
                x2={cx1 + hw1}
                y2={bracketY}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />
              {/* Left end cap */}
              <line
                x1={cx1 - hw1}
                y1={bracketY - capH}
                x2={cx1 - hw1}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />
              {/* Right end cap */}
              <line
                x1={cx1 + hw1}
                y1={bracketY - capH}
                x2={cx1 + hw1}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />

              {/* Bracket for tooth 2 (narrower) */}
              <line
                x1={cx2 - hw2}
                y1={bracketY}
                x2={cx2 + hw2}
                y2={bracketY}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />
              {/* Left end cap */}
              <line
                x1={cx2 - hw2}
                y1={bracketY - capH}
                x2={cx2 - hw2}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />
              {/* Right end cap */}
              <line
                x1={cx2 + hw2}
                y1={bracketY - capH}
                x2={cx2 + hw2}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={0.75}
                strokeOpacity={0.7}
              />

              {/* Ratio label below brackets — glass-pill with tooth pair + ratio */}
              <g>
                <title>
                  {t('components.wizard.dsd.proportionOverlay.ratioTooltip', {
                    inner: bracket.innerTooth ?? toothPositionLabel(bracket.innerIndex, t),
                    outer: bracket.outerTooth ?? toothPositionLabel(bracket.innerIndex + 1, t),
                    ratio: bracket.ratio.toFixed(2),
                    ideal: String(bracket.ideal),
                  })}
                </title>
                {/* Glass-pill background */}
                <rect
                  x={(cx1 + cx2) / 2 - 22}
                  y={bracketY + capH + 2}
                  width={44}
                  height={26}
                  rx={6}
                  fill="rgba(0,0,0,0.5)"
                />
                {/* Tooth pair label (e.g., "11/12") */}
                <text
                  x={(cx1 + cx2) / 2}
                  y={bracketY + capH + 13}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight={500}
                  opacity={0.8}
                >
                  {bracket.innerTooth && bracket.outerTooth
                    ? `${bracket.innerTooth}/${bracket.outerTooth}`
                    : toothPositionLabel(bracket.innerIndex, t) + '/' + toothPositionLabel(bracket.innerIndex + 1, t)}
                </text>
                {/* Ratio value */}
                <text
                  x={(cx1 + cx2) / 2}
                  y={bracketY + capH + 24}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  fontWeight={600}
                >
                  {bracket.ratio.toFixed(2)}
                  {isGood ? ' \u2713' : ` (${bracket.ideal})`}
                </text>
              </g>
            </g>
          );
        })}

      {/* ----------------------------------------------------------------- */}
      {/* Smile Arc — green smooth curve                                    */}
      {/* ----------------------------------------------------------------- */}
      {showSmileArc && (
        <g>
          <path
            d={buildSmoothPath(
              lines.smileArc.map((p) => ({ x: px(p.x), y: py(p.y) })),
            )}
            fill="none"
            stroke={COLORS.smileArc}
            strokeWidth={1.5}
            strokeOpacity={0.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Legend — bottom-right corner                                      */}
      {/* ----------------------------------------------------------------- */}
      {(showMidline || showGoldenRatio || showSmileArc) && (() => {
        const items: Array<{ color: string; dashed?: boolean; label: string }> = [];
        if (showMidline) items.push({ color: COLORS.midline, dashed: true, label: t('components.wizard.dsd.proportionOverlay.midline') });
        if (showGoldenRatio) items.push({ color: COLORS.goldenRatio, label: t('components.wizard.dsd.proportionOverlay.goldenRatioLabel') });
        if (showSmileArc) items.push({ color: COLORS.smileArc, label: t('components.wizard.dsd.proportionOverlay.smileArcLabel') });
        const legendH = items.length * 14 + 6;
        return (
          <g transform={`translate(${containerWidth - 128}, ${containerHeight - legendH - 8})`}>
            <rect x={0} y={0} width={120} height={legendH} rx={6} fill="rgba(0,0,0,0.65)" />
            {items.map((item, i) => (
              <g key={item.label}>
                <line
                  x1={6} y1={10 + i * 14}
                  x2={14} y2={10 + i * 14}
                  stroke={item.color}
                  strokeWidth={item.dashed ? 1 : 1.5}
                  strokeDasharray={item.dashed ? '3 1' : undefined}
                />
                <text x={18} y={13 + i * 14} fill="white" fontSize={7} fontWeight={400}>
                  {item.label}
                </text>
              </g>
            ))}
          </g>
        );
      })()}
    </svg>
  );
}
