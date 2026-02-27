import { useMemo } from 'react';
import type { ToothBoundsPct, DSDAnalysis } from '@/types/dsd';

// =============================================================================
// Types
// =============================================================================

export interface MidlineResult {
  /** X position of the midline in % */
  x: number;
  /** Top of the midline in % (above the tallest tooth) */
  yStart: number;
  /** Bottom of the midline in % (below the lowest tooth) */
  yEnd: number;
}

export interface GoldenRatioBracket {
  /** Center X of the first (wider) tooth in % */
  x1: number;
  /** Apparent width of the first tooth in % */
  w1: number;
  /** Center X of the second (narrower) tooth in % */
  x2: number;
  /** Apparent width of the second tooth in % */
  w2: number;
  /** Actual ratio w1/w2 */
  ratio: number;
  /** Ideal golden ratio constant */
  ideal: 1.618;
  /** Y position for the bracket label in % */
  y: number;
}

export interface SmileArcPoint {
  /** X position (center of tooth) in % */
  x: number;
  /** Y position (incisal/bottom edge of tooth) in % */
  y: number;
}

export interface ProportionLines {
  midline: MidlineResult | null;
  goldenRatioBrackets: GoldenRatioBracket[];
  smileArc: SmileArcPoint[];
}

// =============================================================================
// Constants
// =============================================================================

/** Padding (in %) added above/below tooth bounds for midline extension. */
const MIDLINE_PADDING = 2;

/** The golden ratio constant. */
const GOLDEN_RATIO = 1.618;

// =============================================================================
// Pure computation
// =============================================================================

/**
 * Compute geometric proportion overlay lines from tooth bounding boxes and
 * DSD analysis data.
 *
 * All coordinates are in percentage (0-100) of the image dimensions.
 */
export function computeProportionLines(
  bounds: ToothBoundsPct[] | undefined | null,
  _analysis: DSDAnalysis,
): ProportionLines {
  const empty: ProportionLines = {
    midline: null,
    goldenRatioBrackets: [],
    smileArc: [],
  };

  if (!bounds || bounds.length === 0) return empty;

  // --- Sort by X for consistent processing ---
  const sorted = [...bounds].sort((a, b) => a.x - b.x);

  // --- Midline ---
  const midline = computeMidline(sorted);

  // --- Golden ratio brackets ---
  const goldenRatioBrackets =
    sorted.length >= 4 ? computeGoldenRatioBrackets(sorted, midline) : [];

  // --- Smile arc ---
  const smileArc = computeSmileArc(sorted);

  return { midline, goldenRatioBrackets, smileArc };
}

// =============================================================================
// Midline
// =============================================================================

/**
 * Find the two widest teeth (presumed central incisors) and place the midline
 * at the average of their center X positions.
 *
 * The midline extends from above the tallest tooth to below the lowest tooth
 * with some padding.
 */
function computeMidline(sorted: ToothBoundsPct[]): MidlineResult {
  // Sort by width descending to find the two widest
  const byWidth = [...sorted].sort((a, b) => b.width - a.width);

  let midX: number;
  if (byWidth.length === 1) {
    midX = byWidth[0].x;
  } else {
    // Take the two widest teeth
    midX = (byWidth[0].x + byWidth[1].x) / 2;
  }

  // Compute vertical extent from all teeth
  let minTop = Infinity;
  let maxBottom = -Infinity;

  for (const t of sorted) {
    const top = t.y - t.height / 2;
    const bottom = t.y + t.height / 2;
    if (top < minTop) minTop = top;
    if (bottom > maxBottom) maxBottom = bottom;
  }

  return {
    x: midX,
    yStart: minTop - MIDLINE_PADDING,
    yEnd: maxBottom + MIDLINE_PADDING,
  };
}

// =============================================================================
// Golden ratio brackets
// =============================================================================

/**
 * For each side of the midline, sort teeth from midline outward and compute
 * the width ratio between adjacent teeth.
 *
 * Returns brackets for both left and right sides.
 */
function computeGoldenRatioBrackets(
  sorted: ToothBoundsPct[],
  midline: MidlineResult,
): GoldenRatioBracket[] {
  const midX = midline.x;

  // Split into left-of-midline and right-of-midline
  const leftSide: ToothBoundsPct[] = []; // teeth with x < midX (patient's right)
  const rightSide: ToothBoundsPct[] = []; // teeth with x >= midX (patient's left)

  for (const t of sorted) {
    if (t.x < midX) {
      leftSide.push(t);
    } else {
      rightSide.push(t);
    }
  }

  // Sort each side from midline outward
  // Left side: sort by x descending (closest to midline first)
  leftSide.sort((a, b) => b.x - a.x);
  // Right side: sort by x ascending (closest to midline first)
  rightSide.sort((a, b) => a.x - b.x);

  const brackets: GoldenRatioBracket[] = [];

  // Generate brackets for left side
  addBrackets(leftSide, brackets);
  // Generate brackets for right side
  addBrackets(rightSide, brackets);

  return brackets;
}

/**
 * Given teeth sorted from midline outward, create golden ratio brackets
 * between each adjacent pair.
 */
function addBrackets(
  teethFromMidline: ToothBoundsPct[],
  brackets: GoldenRatioBracket[],
): void {
  for (let i = 0; i < teethFromMidline.length - 1; i++) {
    const inner = teethFromMidline[i];
    const outer = teethFromMidline[i + 1];

    // The inner tooth (closer to midline) is expected to be wider
    const w1 = inner.width;
    const w2 = outer.width;
    const ratio = w2 > 0 ? w1 / w2 : 0;

    // Y position: use the top edge of the taller of the two teeth
    const y = Math.min(
      inner.y - inner.height / 2,
      outer.y - outer.height / 2,
    );

    brackets.push({
      x1: inner.x,
      w1,
      x2: outer.x,
      w2,
      ratio,
      ideal: GOLDEN_RATIO as 1.618,
      y,
    });
  }
}

// =============================================================================
// Smile arc
// =============================================================================

/**
 * Return the incisal edge (bottom of bounding box) of each tooth,
 * sorted left-to-right.
 */
function computeSmileArc(sorted: ToothBoundsPct[]): SmileArcPoint[] {
  return sorted.map((t) => ({
    x: t.x,
    y: t.y + t.height / 2,
  }));
}

// =============================================================================
// React hook
// =============================================================================

/**
 * Compute proportion overlay lines from tooth bounding boxes and DSD analysis.
 *
 * Wraps the pure `computeProportionLines` with `useMemo` for React performance.
 */
export function useProportionLines(
  bounds: ToothBoundsPct[] | undefined | null,
  analysis: DSDAnalysis,
): ProportionLines {
  return useMemo(
    () => computeProportionLines(bounds, analysis),
    [bounds, analysis],
  );
}
