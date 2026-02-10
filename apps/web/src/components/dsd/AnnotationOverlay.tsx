import type { DSDSuggestion, ToothBoundsPct } from '@/types/dsd';

interface AnnotationOverlayProps {
  suggestions: DSDSuggestion[];
  toothBounds: ToothBoundsPct[];
  visible: boolean;
  containerWidth: number;
  containerHeight: number;
}

const TREATMENT_COLORS: Record<string, string> = {
  resina: '#3b82f6',       // blue
  porcelana: '#f59e0b',    // amber
  coroa: '#a855f7',        // purple
  implante: '#ef4444',     // red
  endodontia: '#f43f5e',   // rose
  encaminhamento: '#6b7280', // gray
  gengivoplastia: '#ec4899', // pink
  recobrimento_radicular: '#14b8a6', // teal
};

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

  // Build map: tooth number -> bounds
  // Heuristic: match by index (both arrays ordered by tooth position)
  // This is imperfect but works for the common case where detected teeth align with suggestions
  const boundsMap = new Map<number, ToothBoundsPct>();
  toothBounds.forEach((b, i) => boundsMap.set(i, b));

  // Match suggestions to bounds by tooth number proximity
  const annotatedSuggestions = suggestions
    .filter(s => s.tooth && s.proposed_change)
    .slice(0, 20); // Limit to avoid clutter

  // Simple approach: distribute suggestions across available bounds
  // For each suggestion, try to find a tooth bound at a matching position
  const usedBounds = new Set<number>();

  return (
    <svg
      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <defs>
        <marker id="arrowUp" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,6 L3,0 L6,6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>
        <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>
      </defs>
      {annotatedSuggestions.map((suggestion, idx) => {
        // Try to find a bound to attach this annotation to
        let bound: ToothBoundsPct | undefined;
        for (const [i, b] of boundsMap.entries()) {
          if (!usedBounds.has(i)) {
            bound = b;
            usedBounds.add(i);
            break;
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

        return (
          <g key={idx}>
            {/* Tooth ellipse highlight */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.7}
              strokeDasharray={isGingivo ? '6 3' : undefined}
            />
            {/* Treatment label */}
            <rect
              x={cx - 24}
              y={cy + ry + 4}
              width={48}
              height={16}
              rx={4}
              fill={color}
              fillOpacity={0.85}
            />
            <text
              x={cx}
              y={cy + ry + 15}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontWeight={600}
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
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  strokeOpacity={0.8}
                />
                {/* Measurement arrow + label */}
                <line
                  x1={cx + rx + 4}
                  y1={cy - ry}
                  x2={cx + rx + 4}
                  y2={cy - ry * 0.6}
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  markerStart="url(#arrowUp)"
                  markerEnd="url(#arrowDown)"
                />
                <rect
                  x={cx + rx + 8}
                  y={cy - ry * 0.9}
                  width={measurement ? 32 : 20}
                  height={14}
                  rx={3}
                  fill="#ec4899"
                  fillOpacity={0.9}
                />
                <text
                  x={cx + rx + 8 + (measurement ? 16 : 10)}
                  y={cy - ry * 0.9 + 10.5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight={700}
                >
                  {measurement || '↕'}
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
                  strokeWidth={1.5}
                  markerStart="url(#arrowUp)"
                  markerEnd="url(#arrowDown)"
                />
                <rect
                  x={cx + rx + 8}
                  y={cy + ry * 0.7}
                  width={measurement ? 32 : 20}
                  height={14}
                  rx={3}
                  fill="#3b82f6"
                  fillOpacity={0.9}
                />
                <text
                  x={cx + rx + 8 + (measurement ? 16 : 10)}
                  y={cy + ry * 0.7 + 10.5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight={700}
                >
                  {measurement || '↕'}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
