import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TreatmentType } from '@/lib/treatment-config';
import { TREATMENT_LABEL_KEYS } from './review-constants';

interface ToothPriorityInfo {
  priority?: 'alta' | 'média' | 'baixa';
}

interface DentalArchDiagramProps {
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  onToggleTooth?: (tooth: string) => void;
  /** Optional priority info per tooth (from analysis result) */
  toothPriorities?: Record<string, ToothPriorityInfo>;
}

/**
 * Treatment type to Tailwind fill class mapping.
 * Uses semantic and standard palette classes that work in both light and dark mode.
 */
const TREATMENT_DOT_CLASSES: Record<TreatmentType, string> = {
  resina: 'fill-primary',
  porcelana: 'fill-amber-500',
  coroa: 'fill-purple-500',
  implante: 'fill-orange-500',
  endodontia: 'fill-rose-500',
  encaminhamento: 'fill-muted-foreground',
  gengivoplastia: 'fill-pink-500',
  recobrimento_radicular: 'fill-teal-500',
};

/** Inline SVG fill colors for the legend swatches (CSS custom properties + known colors). */
const TREATMENT_LEGEND_BG: Record<TreatmentType, string> = {
  resina: 'bg-primary',
  porcelana: 'bg-amber-500',
  coroa: 'bg-purple-500',
  implante: 'bg-orange-500',
  endodontia: 'bg-rose-500',
  encaminhamento: 'bg-muted-foreground',
  gengivoplastia: 'bg-pink-500',
  recobrimento_radicular: 'bg-teal-500',
};

/**
 * Hardcoded tooth positions forming a proper U-shaped dental arch.
 * FDI notation: patient-right = diagram-left, patient-left = diagram-right.
 * Upper arch: U opening downward (molars at top sides, incisors at bottom center).
 * Lower arch: U opening upward (incisors at top center, molars at bottom sides).
 */
const TOOTH_POSITIONS: Record<string, { cx: number; cy: number }> = {
  // Upper right quadrant (patient-right = left side of diagram)
  '18': { cx: 45, cy: 55 },
  '17': { cx: 64, cy: 82 },
  '16': { cx: 80, cy: 107 },
  '15': { cx: 96, cy: 130 },
  '14': { cx: 114, cy: 150 },
  '13': { cx: 136, cy: 165 },
  '12': { cx: 162, cy: 175 },
  '11': { cx: 188, cy: 179 },
  // Upper left quadrant (patient-left = right side of diagram)
  '21': { cx: 212, cy: 179 },
  '22': { cx: 238, cy: 175 },
  '23': { cx: 264, cy: 165 },
  '24': { cx: 286, cy: 150 },
  '25': { cx: 304, cy: 130 },
  '26': { cx: 320, cy: 107 },
  '27': { cx: 336, cy: 82 },
  '28': { cx: 355, cy: 55 },
  // Lower right quadrant (patient-right = left side of diagram)
  '48': { cx: 45, cy: 325 },
  '47': { cx: 64, cy: 298 },
  '46': { cx: 80, cy: 273 },
  '45': { cx: 96, cy: 250 },
  '44': { cx: 114, cy: 230 },
  '43': { cx: 136, cy: 215 },
  '42': { cx: 162, cy: 205 },
  '41': { cx: 188, cy: 201 },
  // Lower left quadrant (patient-left = right side of diagram)
  '31': { cx: 212, cy: 201 },
  '32': { cx: 238, cy: 205 },
  '33': { cx: 264, cy: 215 },
  '34': { cx: 286, cy: 230 },
  '35': { cx: 304, cy: 250 },
  '36': { cx: 320, cy: 273 },
  '37': { cx: 336, cy: 298 },
  '38': { cx: 355, cy: 325 },
};

const ALL_TEETH = Object.keys(TOOTH_POSITIONS);

export const DentalArchDiagram = memo(function DentalArchDiagram({
  selectedTeeth,
  toothTreatments,
  onToggleTooth,
  toothPriorities,
}: DentalArchDiagramProps) {
  const { t } = useTranslation();
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);

  const handleMouseEnter = useCallback((toothId: string) => {
    setHoveredTooth(toothId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTooth(null);
  }, []);

  const handleTouchStart = useCallback((toothId: string) => {
    setHoveredTooth((prev) => (prev === toothId ? null : toothId));
  }, []);

  // Collect treatment types in use (for legend)
  const usedTreatments = useMemo(() => {
    const set = new Set<TreatmentType>();
    for (const tt of Object.values(toothTreatments)) {
      set.add(tt);
    }
    return Array.from(set);
  }, [toothTreatments]);

  const renderTooth = (toothId: string) => {
    const pos = TOOTH_POSITIONS[toothId];
    if (!pos) return null;
    const { cx, cy } = pos;
    const isSelected = selectedTeeth.includes(toothId);
    const treatment = toothTreatments[toothId];
    const dotClass = treatment ? TREATMENT_DOT_CLASSES[treatment] : null;

    return (
      <g
        key={toothId}
        onClick={() => onToggleTooth?.(toothId)}
        role="checkbox"
        aria-checked={isSelected}
        aria-label={t('components.wizard.review.archTooth', {
          toothId,
          defaultValue: `Dente ${toothId}`,
        })}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleTooth?.(toothId);
          }
        }}
        onMouseEnter={() => handleMouseEnter(toothId)}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(toothId);
        }}
        className="cursor-pointer focus:outline-none group/tooth"
      >
        {/* Tooth circle */}
        <circle
          cx={cx}
          cy={cy}
          r={11}
          className={
            isSelected
              ? 'fill-primary/15 stroke-primary transition-all'
              : 'fill-card/80 stroke-border/60 transition-all group-hover/tooth:stroke-primary/40'
          }
          strokeWidth={isSelected ? 2 : 1.5}
        />

        {/* Focus ring (hidden by default, shown on :focus-visible) */}
        <circle
          cx={cx}
          cy={cy}
          r={14}
          fill="none"
          className="stroke-ring opacity-0 group-focus-visible/tooth:opacity-100 transition-opacity"
          strokeWidth={2}
        />

        {/* Tooth number */}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fontFamily="ui-monospace, monospace"
          fontWeight={isSelected ? 700 : 500}
          className={isSelected ? 'fill-primary' : 'fill-foreground'}
        >
          {toothId}
        </text>

        {/* Treatment type indicator dot */}
        {dotClass && (
          <circle cx={cx + 8} cy={cy - 8} r={3} className={dotClass} />
        )}
      </g>
    );
  };

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 400 380"
        className="w-full max-w-md mx-auto"
        role="group"
        aria-label={t('components.wizard.review.archDiagramLabel', {
          defaultValue: 'Diagrama de arcada dental',
        })}
      >
        {/* Shadow filter for tooltip */}
        <defs>
          <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Upper arch label */}
        <text
          x="200"
          y="28"
          textAnchor="middle"
          fontSize="10"
          className="fill-muted-foreground"
          fontWeight="500"
        >
          {t('components.wizard.review.upper')}
        </text>

        {/* All teeth */}
        {ALL_TEETH.map((id) => renderTooth(id))}

        {/* Midline */}
        <line
          x1="200"
          y1="168"
          x2="200"
          y2="212"
          className="stroke-border/30"
          strokeWidth="1"
          strokeDasharray="3,3"
        />

        {/* Lower arch label */}
        <text
          x="200"
          y="355"
          textAnchor="middle"
          fontSize="10"
          className="fill-muted-foreground"
          fontWeight="500"
        >
          {t('components.wizard.review.lower')}
        </text>

        {/* Hover tooltip */}
        {hoveredTooth && TOOTH_POSITIONS[hoveredTooth] && (() => {
          const pos = TOOTH_POSITIONS[hoveredTooth];
          const treatment = toothTreatments[hoveredTooth];
          const priorityInfo = toothPriorities?.[hoveredTooth];
          const treatmentLabel = treatment
            ? t(TREATMENT_LABEL_KEYS[treatment])
            : undefined;
          const priorityLabel = priorityInfo?.priority
            ? t(`common.priority${priorityInfo.priority.charAt(0).toUpperCase()}${priorityInfo.priority.slice(1)}`, {
                defaultValue: priorityInfo.priority,
              })
            : undefined;

          // Build tooltip lines
          const line1 = t('components.wizard.review.archTooth', {
            toothId: hoveredTooth,
            defaultValue: `Dente ${hoveredTooth}`,
          });
          const line2 = treatmentLabel || undefined;
          const line3 = priorityLabel
            ? t('components.wizard.review.tooltipPriority', {
                priority: priorityLabel,
                defaultValue: `Prioridade: ${priorityLabel}`,
              })
            : undefined;

          const lines = [line1, line2, line3].filter(Boolean) as string[];
          const lineHeight = 13;
          const paddingX = 8;
          const paddingY = 6;
          const tooltipHeight = lines.length * lineHeight + paddingY * 2;
          const tooltipWidth = Math.max(...lines.map((l) => l.length * 5.2)) + paddingX * 2;
          const arrowSize = 5;

          // Show below if near top edge, above otherwise
          const showBelow = pos.cy < 70;
          const tooltipY = showBelow
            ? pos.cy + 18
            : pos.cy - 18 - tooltipHeight;
          const arrowY = showBelow
            ? tooltipY - arrowSize + 1
            : tooltipY + tooltipHeight - 1;

          // Clamp horizontal position to stay within SVG bounds
          let tooltipX = pos.cx - tooltipWidth / 2;
          if (tooltipX < 4) tooltipX = 4;
          if (tooltipX + tooltipWidth > 396) tooltipX = 396 - tooltipWidth;

          const arrowPoints = showBelow
            ? `${pos.cx - arrowSize},${arrowY + arrowSize} ${pos.cx},${arrowY} ${pos.cx + arrowSize},${arrowY + arrowSize}`
            : `${pos.cx - arrowSize},${arrowY} ${pos.cx},${arrowY + arrowSize} ${pos.cx + arrowSize},${arrowY}`;

          return (
            <g
              className="pointer-events-none"
              style={{ opacity: 1, transition: 'opacity 150ms ease-in-out' }}
            >
              {/* Tooltip background */}
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx={6}
                className="fill-card stroke-border"
                strokeWidth={0.5}
                filter="url(#tooltip-shadow)"
              />
              {/* Arrow */}
              <polygon
                points={arrowPoints}
                className="fill-card"
              />
              {/* Text lines */}
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={tooltipX + paddingX}
                  y={tooltipY + paddingY + (i + 1) * lineHeight - 3}
                  fontSize={i === 0 ? 9 : 8}
                  fontWeight={i === 0 ? 600 : 400}
                  className={i === 0 ? 'fill-foreground' : 'fill-muted-foreground'}
                  fontFamily="system-ui, sans-serif"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      {usedTreatments.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 px-2">
          {usedTreatments.map((tt) => (
            <div key={tt} className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${TREATMENT_LEGEND_BG[tt] || 'bg-muted-foreground'}`}
              />
              <span className="text-xs text-muted-foreground">
                {t(TREATMENT_LABEL_KEYS[tt])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default DentalArchDiagram;
