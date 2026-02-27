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
// Component
// =============================================================================

export function ProportionOverlay({
  lines,
  visibleLayers,
  containerWidth,
  containerHeight,
}: ProportionOverlayProps) {
  const { t } = useTranslation();

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

  return (
    <svg
      aria-label={t('components.dsd.proportionOverlay.ariaLabel')}
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Midline — red dashed vertical line                                */}
      {/* ----------------------------------------------------------------- */}
      {showMidline && (
        <g>
          <line
            x1={px(lines.midline!.x)}
            y1={py(lines.midline!.yStart)}
            x2={px(lines.midline!.x)}
            y2={py(lines.midline!.yEnd)}
            stroke={COLORS.midline}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            strokeOpacity={0.85}
          />
          <text
            x={px(lines.midline!.x) + 6}
            y={py(lines.midline!.yStart) + 12}
            fill={COLORS.midline}
            fontSize={10}
            fontWeight={600}
          >
            {t('components.dsd.proportionOverlay.midline')}
          </text>
        </g>
      )}

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
          const capH = 4;

          return (
            <g key={`gr-${idx}`}>
              {/* Bracket for tooth 1 (wider) */}
              <line
                x1={cx1 - hw1}
                y1={bracketY}
                x2={cx1 + hw1}
                y2={bracketY}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />
              {/* Left end cap */}
              <line
                x1={cx1 - hw1}
                y1={bracketY - capH}
                x2={cx1 - hw1}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />
              {/* Right end cap */}
              <line
                x1={cx1 + hw1}
                y1={bracketY - capH}
                x2={cx1 + hw1}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />

              {/* Bracket for tooth 2 (narrower) */}
              <line
                x1={cx2 - hw2}
                y1={bracketY}
                x2={cx2 + hw2}
                y2={bracketY}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />
              {/* Left end cap */}
              <line
                x1={cx2 - hw2}
                y1={bracketY - capH}
                x2={cx2 - hw2}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />
              {/* Right end cap */}
              <line
                x1={cx2 + hw2}
                y1={bracketY - capH}
                x2={cx2 + hw2}
                y2={bracketY + capH}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
              />

              {/* Ratio label below brackets */}
              <text
                x={(cx1 + cx2) / 2}
                y={bracketY + capH + 14}
                textAnchor="middle"
                fill={color}
                fontSize={10}
                fontWeight={600}
              >
                {bracket.ratio.toFixed(2)}
                {isGood ? ' \u2713' : ` (${bracket.ideal})`}
              </text>
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
            strokeWidth={2}
            strokeOpacity={0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label near the first point */}
          <text
            x={px(lines.smileArc[0].x)}
            y={py(lines.smileArc[0].y) + 16}
            fill={COLORS.smileArc}
            fontSize={10}
            fontWeight={600}
          >
            {t('components.dsd.proportionOverlay.smileArc')}
          </text>
        </g>
      )}
    </svg>
  );
}
