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
};

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

        // Gengivoplasty line (show at top of tooth bound)
        const isGingivo = suggestion.proposed_change.toLowerCase().includes('gengivoplastia');

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
            {/* Gengivoplasty line at gingival margin */}
            {isGingivo && (
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
            )}
          </g>
        );
      })}
    </svg>
  );
}
