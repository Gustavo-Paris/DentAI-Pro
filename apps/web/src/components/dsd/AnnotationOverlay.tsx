import type { DSDSuggestion, ToothBoundsPct } from '@/types/dsd';

interface AnnotationOverlayProps {
  suggestions: DSDSuggestion[];
  toothBounds: ToothBoundsPct[];
  visible: boolean;
  containerWidth: number;
  containerHeight: number;
}

import { TREATMENT_COLORS } from '@/lib/treatment-colors';

/** Extract mm measurement from proposed_change text (e.g. "aumentar 1.5mm") */
function extractMeasurement(text: string): string | null {
  const match = text.match(/(\d+[.,]?\d*)\s*mm/i);
  return match ? match[1].replace(',', '.') + 'mm' : null;
}

/** Detect if suggestion involves incisal increase */
function isIncisalIncrease(s: DSDSuggestion): boolean {
  const text = `${s.proposed_change} ${s.current_issue}`.toLowerCase();
  return (text.includes('aument') && (text.includes('incisal') || text.includes('bordo'))) ||
    text.includes('acréscimo incisal') || text.includes('acrescimo incisal');
}

/** Detect if suggestion involves cervical/gingival change */
function isCervicalChange(s: DSDSuggestion): boolean {
  const text = `${s.proposed_change} ${s.current_issue}`.toLowerCase();
  return text.includes('gengivoplastia') || text.includes('gengiv') ||
    s.treatment_indication === 'gengivoplastia';
}

export function AnnotationOverlay({
  suggestions,
  toothBounds,
  visible,
  containerWidth,
  containerHeight,
}: AnnotationOverlayProps) {
  if (!visible || !containerWidth || !containerHeight) return null;

  const normalizeTooth = (value: string | undefined): string | null => {
    if (!value) return null;
    const match = value.match(/[1-4][1-8]/);
    return match ? match[0] : null;
  };

  const boundsByTooth = new Map<string, ToothBoundsPct>();
  const fallbackBounds = toothBounds.filter((b) => {
    const tooth = normalizeTooth(b.tooth);
    if (!tooth) return true;
    boundsByTooth.set(tooth, b);
    return false;
  });

  const annotatedSuggestions = suggestions
    .filter(s => s.tooth && s.proposed_change)
    .slice(0, 20); // Limit to avoid clutter

  const usedFallbackBounds = new Set<number>();

  // Detect which annotation types are present for the legend
  const hasGingivo = annotatedSuggestions.some(s => isCervicalChange(s));
  const hasIncisal = annotatedSuggestions.some(s => isIncisalIncrease(s) && !isCervicalChange(s));

  // Track occupied label positions to avoid overlap
  const occupiedYRanges: Array<{ x: number; yMin: number; yMax: number }> = [];
  const resolveY = (x: number, baseY: number, height: number): number => {
    let y = baseY;
    const xTolerance = 30;
    for (let attempt = 0; attempt < 5; attempt++) {
      const conflict = occupiedYRanges.find(
        r => Math.abs(r.x - x) < xTolerance && y < r.yMax + 2 && y + height > r.yMin - 2,
      );
      if (!conflict) break;
      y = conflict.yMax + 3;
    }
    occupiedYRanges.push({ x, yMin: y, yMax: y + height });
    return y;
  };

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <defs>
        <marker id="arrowUp" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,6 L3,0 L6,6" fill="none" stroke="currentColor" strokeWidth="1" />
        </marker>
        <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="none" stroke="currentColor" strokeWidth="1" />
        </marker>
      </defs>
      {annotatedSuggestions.map((suggestion, idx) => {
        const suggestionTooth = normalizeTooth(suggestion.tooth);
        let bound = suggestionTooth ? boundsByTooth.get(suggestionTooth) : undefined;

        if (!bound) {
          for (const [fallbackIdx, fallbackBound] of fallbackBounds.entries()) {
            if (!usedFallbackBounds.has(fallbackIdx)) {
              bound = fallbackBound;
              usedFallbackBounds.add(fallbackIdx);
              break;
            }
          }
        }

        if (!bound) return null;

        const cx = (bound.x / 100) * containerWidth;
        const cy = (bound.y / 100) * containerHeight;
        const rx = ((bound.width * 0.8) / 100) * containerWidth / 2;
        const ry = ((bound.height * 0.7) / 100) * containerHeight / 2;
        const color = TREATMENT_COLORS[suggestion.treatment_indication || 'resina'] || '#3b82f6';

        const isGingivo = isCervicalChange(suggestion);
        const isIncisal = isIncisalIncrease(suggestion);
        const measurement = extractMeasurement(suggestion.proposed_change);

        // Resolve label Y to avoid overlap with other tooth labels
        const labelY = resolveY(cx, cy + ry + 4, 14);

        return (
          <g key={idx}>
            {/* Tooth dot marker */}
            <circle cx={cx} cy={cy} r={3} fill={color} fillOpacity={0.4} />
            {/* Treatment label — glass pill */}
            <rect
              x={cx - 14}
              y={labelY}
              width={28}
              height={14}
              rx={7}
              fill="rgba(0,0,0,0.6)"
            />
            <text
              x={cx}
              y={labelY + 10}
              textAnchor="middle"
              fill="white"
              fontSize={8}
              fontWeight={500}
            >
              {suggestion.tooth}
            </text>

            {/* Cervical measurement ruler (gengivoplasty — above tooth) */}
            {isGingivo && (
              <>
                {/* Dashed line at gingival margin */}
                <line
                  x1={cx - rx}
                  y1={cy - ry * 0.8}
                  x2={cx + rx}
                  y2={cy - ry * 0.8}
                  stroke="#ec4899"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                />
                {/* Measurement arrow + label */}
                <line
                  x1={cx + rx + 4}
                  y1={cy - ry}
                  x2={cx + rx + 4}
                  y2={cy - ry * 0.6}
                  stroke="#ec4899"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                  markerStart="url(#arrowUp)"
                  markerEnd="url(#arrowDown)"
                />
                <rect
                  x={cx + rx + 8}
                  y={cy - ry * 0.9}
                  width={measurement ? 30 : 18}
                  height={12}
                  rx={6}
                  fill="rgba(0,0,0,0.6)"
                />
                <text
                  x={cx + rx + 8 + (measurement ? 15 : 9)}
                  y={cy - ry * 0.9 + 9}
                  textAnchor="middle"
                  fill="white"
                  fontSize={7}
                  fontWeight={500}
                >
                  {measurement || '...'}
                </text>
              </>
            )}

            {/* Incisal measurement ruler (tooth lengthening — below tooth) */}
            {isIncisal && !isGingivo && (
              <>
                <line
                  x1={cx + rx + 4}
                  y1={cy + ry * 0.6}
                  x2={cx + rx + 4}
                  y2={cy + ry}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeOpacity={0.6}
                  markerStart="url(#arrowUp)"
                  markerEnd="url(#arrowDown)"
                />
                <rect
                  x={cx + rx + 8}
                  y={cy + ry * 0.7}
                  width={measurement ? 30 : 18}
                  height={12}
                  rx={6}
                  fill="rgba(0,0,0,0.6)"
                />
                <text
                  x={cx + rx + 8 + (measurement ? 15 : 9)}
                  y={cy + ry * 0.7 + 9}
                  textAnchor="middle"
                  fill="white"
                  fontSize={7}
                  fontWeight={500}
                >
                  {measurement || '...'}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Legend — bottom-left corner */}
      <g transform={`translate(8, ${containerHeight - (hasGingivo && hasIncisal ? 52 : hasGingivo || hasIncisal ? 38 : 24)})`}>
        <rect
          x={0} y={0}
          width={120}
          height={hasGingivo && hasIncisal ? 48 : hasGingivo || hasIncisal ? 34 : 20}
          rx={6}
          fill="rgba(0,0,0,0.65)"
        />
        {/* Tooth marker legend */}
        <circle cx={10} cy={10} r={3} fill="#3b82f6" fillOpacity={0.6} />
        <text x={18} y={13} fill="white" fontSize={7} fontWeight={400}>
          Dente analisado
        </text>
        {/* Gingival legend */}
        {hasGingivo && (
          <>
            <line x1={6} y1={24} x2={14} y2={24} stroke="#ec4899" strokeWidth={1} strokeDasharray="3 1" />
            <text x={18} y={27} fill="white" fontSize={7} fontWeight={400}>
              Margem gengival
            </text>
          </>
        )}
        {/* Incisal legend */}
        {hasIncisal && (
          <>
            <line
              x1={6} y1={hasGingivo ? 38 : 24}
              x2={14} y2={hasGingivo ? 38 : 24}
              stroke="#3b82f6" strokeWidth={1}
              markerEnd="url(#arrowDown)"
            />
            <text x={18} y={hasGingivo ? 41 : 27} fill="white" fontSize={7} fontWeight={400}>
              Acréscimo incisal
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
