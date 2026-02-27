import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  computeProportionLines,
  useProportionLines,
} from './useProportionLines';
import type { ToothBoundsPct, DSDAnalysis } from '@/types/dsd';

// =============================================================================
// Helpers
// =============================================================================

/** Build a minimal DSDAnalysis for testing (only fields the function uses). */
function makeAnalysis(overrides?: Partial<DSDAnalysis>): DSDAnalysis {
  return {
    facial_midline: 'centrada',
    dental_midline: 'alinhada',
    smile_line: 'média',
    buccal_corridor: 'adequado',
    occlusal_plane: 'nivelado',
    golden_ratio_compliance: 0.85,
    symmetry_score: 0.9,
    suggestions: [],
    observations: [],
    confidence: 'alta',
    ...overrides,
  };
}

/**
 * Create a symmetric set of 6 teeth representing a typical anterior segment.
 *
 * Layout (center X positions):
 *   tooth 1 (right lateral): x=30, w=6
 *   tooth 2 (right central): x=38, w=10
 *   tooth 3 (left central):  x=50, w=10    <-- widest pair
 *   tooth 4 (left lateral):  x=50, w=10    <-- widest pair (but see below)
 *   ...
 *
 * We model them as:
 *   Right canine:   x=24, w=5
 *   Right lateral:  x=32, w=6.18
 *   Right central:  x=42, w=10
 *   Left central:   x=52, w=10
 *   Left lateral:   x=62, w=6.18
 *   Left canine:    x=70, w=5
 *
 * Widths roughly follow golden ratio: 10, 6.18, 3.82
 * We use 5 for canine to keep numbers simple.
 */
function makeSixTeeth(): ToothBoundsPct[] {
  return [
    { x: 24, y: 50, width: 5, height: 14 },    // right canine
    { x: 32, y: 48, width: 6.18, height: 15 },  // right lateral
    { x: 42, y: 46, width: 10, height: 16 },     // right central
    { x: 52, y: 46, width: 10, height: 16 },     // left central
    { x: 62, y: 48, width: 6.18, height: 15 },   // left lateral
    { x: 70, y: 50, width: 5, height: 14 },      // left canine
  ];
}

/** Helper: round to N decimal places for floating-point comparisons. */
function round(n: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// =============================================================================
// Tests — computeProportionLines (pure function)
// =============================================================================

describe('computeProportionLines', () => {
  // ---------------------------------------------------------------------------
  // Empty / degenerate inputs
  // ---------------------------------------------------------------------------

  it('returns null midline and empty arrays for empty bounds', () => {
    const result = computeProportionLines([], makeAnalysis());
    expect(result.midline).toBeNull();
    expect(result.goldenRatio).toEqual([]);
    expect(result.smileArc).toEqual([]);
  });

  it('returns null midline and empty arrays for undefined bounds', () => {
    const result = computeProportionLines(
      undefined as unknown as ToothBoundsPct[],
      makeAnalysis(),
    );
    expect(result.midline).toBeNull();
    expect(result.goldenRatio).toEqual([]);
    expect(result.smileArc).toEqual([]);
  });

  it('handles a single tooth — midline at tooth center, no golden ratio, one smile arc point', () => {
    const bounds: ToothBoundsPct[] = [{ x: 50, y: 45, width: 10, height: 16 }];
    const result = computeProportionLines(bounds, makeAnalysis());

    expect(result.midline).not.toBeNull();
    expect(result.midline!.x).toBe(50);
    expect(result.goldenRatio).toEqual([]);
    expect(result.smileArc).toHaveLength(1);
    expect(result.smileArc[0].x).toBe(50);
  });

  // ---------------------------------------------------------------------------
  // Midline calculation
  // ---------------------------------------------------------------------------

  describe('midline', () => {
    it('places midline between the two widest teeth (central incisors)', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      // Two widest teeth: x=42 (w=10) and x=52 (w=10)
      // Midline X = (42 + 52) / 2 = 47
      expect(result.midline).not.toBeNull();
      expect(result.midline!.x).toBe(47);
    });

    it('midline yStart is above the tallest tooth and yEnd is below', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      // Tallest teeth: y=46, h=16 → top = 46 - 16/2 = 38, bottom = 46 + 16/2 = 54
      // yStart should be at or above the minimum top edge
      // yEnd should be at or below the maximum bottom edge
      expect(result.midline!.yStart).toBeLessThanOrEqual(38);
      expect(result.midline!.yEnd).toBeGreaterThanOrEqual(54);
    });

    it('midline with two teeth of equal width picks the two widest', () => {
      const bounds: ToothBoundsPct[] = [
        { x: 40, y: 50, width: 8, height: 14 },
        { x: 55, y: 50, width: 8, height: 14 },
      ];
      const result = computeProportionLines(bounds, makeAnalysis());

      expect(result.midline!.x).toBe(47.5);
    });

    it('falls back to centroid when two widest teeth are on the same side', () => {
      const bounds: ToothBoundsPct[] = [
        { x: 20, y: 50, width: 5, height: 14 },   // left canine — narrow
        { x: 40, y: 50, width: 6, height: 15 },   // left lateral — narrow
        { x: 55, y: 50, width: 10, height: 16 },  // right central — wide
        { x: 75, y: 50, width: 12, height: 16 },  // right premolar — WIDEST, same side
      ];
      const result = computeProportionLines(bounds, makeAnalysis());
      // Centroid = (20+40+55+75)/4 = 47.5
      // Two widest: w=12(x=75) and w=10(x=55) — both clearly right of centroid
      // Guard triggers → falls back to centroid = 47.5
      expect(result.midline!.x).toBe(47.5);
    });

    it('midline with odd number of teeth still picks the two widest', () => {
      const bounds: ToothBoundsPct[] = [
        { x: 30, y: 50, width: 5, height: 14 },
        { x: 45, y: 50, width: 10, height: 16 },
        { x: 60, y: 50, width: 8, height: 15 },
      ];
      const result = computeProportionLines(bounds, makeAnalysis());

      // Two widest: w=10 (x=45) and w=8 (x=60) → midline = (45 + 60) / 2 = 52.5
      expect(result.midline!.x).toBe(52.5);
    });
  });

  // ---------------------------------------------------------------------------
  // Golden ratio brackets
  // ---------------------------------------------------------------------------

  describe('golden ratio brackets', () => {
    it('returns no brackets with fewer than 4 teeth', () => {
      const bounds: ToothBoundsPct[] = [
        { x: 40, y: 50, width: 10, height: 16 },
        { x: 50, y: 50, width: 10, height: 16 },
        { x: 60, y: 50, width: 6, height: 14 },
      ];
      const result = computeProportionLines(bounds, makeAnalysis());
      expect(result.goldenRatio).toEqual([]);
    });

    it('produces brackets for 6 symmetric teeth', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      // Each side has 3 teeth sorted from midline outward.
      // Right side from midline: central(w=10), lateral(w=6.18), canine(w=5)
      //   bracket 1: central vs lateral → ratio = 10/6.18 ≈ 1.618
      //   bracket 2: lateral vs canine → ratio = 6.18/5 = 1.236
      // Left side from midline: central(w=10), lateral(w=6.18), canine(w=5)
      //   bracket 3: central vs lateral → ratio = 10/6.18 ≈ 1.618
      //   bracket 4: lateral vs canine → ratio = 6.18/5 = 1.236

      expect(result.goldenRatio.length).toBe(4);

      // Check first bracket (right side, central→lateral)
      const b0 = result.goldenRatio[0];
      expect(b0.w1).toBe(10);
      expect(b0.w2).toBe(6.18);
      expect(round(b0.ratio)).toBe(round(10 / 6.18));
      expect(b0.ideal).toBe(1.618);
    });

    it('each bracket carries x positions and a y coordinate', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      for (const bracket of result.goldenRatio) {
        expect(typeof bracket.x1).toBe('number');
        expect(typeof bracket.x2).toBe('number');
        expect(typeof bracket.y).toBe('number');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Smile arc
  // ---------------------------------------------------------------------------

  describe('smile arc', () => {
    it('returns incisal edge points sorted left-to-right', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      expect(result.smileArc).toHaveLength(6);

      // Verify left-to-right sorting
      for (let i = 1; i < result.smileArc.length; i++) {
        expect(result.smileArc[i].x).toBeGreaterThan(result.smileArc[i - 1].x);
      }
    });

    it('y coordinates represent the bottom edge of each tooth box', () => {
      const bounds = makeSixTeeth();
      const result = computeProportionLines(bounds, makeAnalysis());

      // For each tooth: bottom edge = y + height/2
      // Right canine: 50 + 14/2 = 57
      expect(result.smileArc[0].y).toBe(57);
      // Right lateral: 48 + 15/2 = 55.5
      expect(result.smileArc[1].y).toBe(55.5);
      // Right central: 46 + 16/2 = 54
      expect(result.smileArc[2].y).toBe(54);
      // Left central: 46 + 16/2 = 54
      expect(result.smileArc[3].y).toBe(54);
      // Left lateral: 48 + 15/2 = 55.5
      expect(result.smileArc[4].y).toBe(55.5);
      // Left canine: 50 + 14/2 = 57
      expect(result.smileArc[5].y).toBe(57);
    });

    it('empty bounds → empty smile arc', () => {
      const result = computeProportionLines([], makeAnalysis());
      expect(result.smileArc).toEqual([]);
    });
  });
});

// =============================================================================
// Tests — useProportionLines (React hook)
// =============================================================================

describe('useProportionLines', () => {
  it('returns the same result as the pure function', () => {
    const bounds = makeSixTeeth();
    const analysis = makeAnalysis();

    const pure = computeProportionLines(bounds, analysis);
    const { result } = renderHook(() => useProportionLines(bounds, analysis));

    expect(result.current).toEqual(pure);
  });

  it('memoizes result for same inputs', () => {
    const bounds = makeSixTeeth();
    const analysis = makeAnalysis();

    const { result, rerender } = renderHook(() =>
      useProportionLines(bounds, analysis),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first); // referential equality
  });
});
