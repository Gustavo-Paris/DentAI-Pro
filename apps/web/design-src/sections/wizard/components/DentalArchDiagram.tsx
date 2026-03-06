import type { TreatmentType } from '../../../../design/sections/wizard/types'

interface DentalArchDiagramProps {
  selectedTeeth?: string[]
  toothTreatments?: Record<string, TreatmentType>
  onToggleTooth?: (tooth: string) => void
}

/** FDI tooth numbering: upper right 18-11, upper left 21-28, lower left 38-31, lower right 41-48 */
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11']
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28']
const LOWER_LEFT = ['38', '37', '36', '35', '34', '33', '32', '31']
const LOWER_RIGHT = ['41', '42', '43', '44', '45', '46', '47', '48']

const TREATMENT_DOT_COLORS: Record<string, string> = {
  resina: 'var(--color-primary)',
  porcelana: 'var(--color-warning)',
  coroa: '#a855f7',
  implante: 'var(--color-destructive)',
  endodontia: '#f43f5e',
  encaminhamento: 'var(--color-muted-foreground)',
  gengivoplastia: '#ec4899',
  recobrimento_radicular: 'var(--color-success)',
}

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina',
  porcelana: 'Porcelana',
  coroa: 'Coroa',
  implante: 'Implante',
  endodontia: 'Endodontia',
  encaminhamento: 'Encaminhamento',
  gengivoplastia: 'Gengivoplastia',
  recobrimento_radicular: 'Recobrimento',
}

/**
 * Calculate tooth position in an arch curve.
 * index: 0 = molar (outer), 7 = central incisor (center)
 * isUpper: true for upper arch
 * isRight: true for right side (mirrored)
 */
function getToothPosition(
  index: number,
  isUpper: boolean,
  isRight: boolean,
): { cx: number; cy: number } {
  // Arch center at (200, 160) for upper, (200, 220) for lower
  const centerX = 200
  const centerY = isUpper ? 145 : 235

  // Angle mapping: molars at edges, incisors at center
  // Upper arch: arc from ~160deg to ~20deg (opens downward)
  // Lower arch: arc from ~200deg to ~340deg (opens upward)
  const t = index / 7 // 0 to 1 (molar to incisor)

  let angle: number
  if (isUpper) {
    // Upper arch opens downward
    const startAngle = isRight ? 160 : 20
    const endAngle = isRight ? 100 : 80
    angle = startAngle + (endAngle - startAngle) * t
  } else {
    // Lower arch opens upward
    const startAngle = isRight ? 200 : 340
    const endAngle = isRight ? 260 : 280
    angle = startAngle + (endAngle - startAngle) * t
  }

  const rad = (angle * Math.PI) / 180
  const rx = 155 // horizontal radius
  const ry = isUpper ? 110 : 90 // vertical radius

  return {
    cx: centerX + rx * Math.cos(rad),
    cy: centerY + ry * Math.sin(rad),
  }
}

export default function DentalArchDiagram({
  selectedTeeth = [],
  toothTreatments = {},
  onToggleTooth,
}: DentalArchDiagramProps) {
  // Collect unique treatment types that appear
  const usedTreatments = new Set<string>()
  for (const t of Object.values(toothTreatments)) {
    usedTreatments.add(t)
  }

  const renderTooth = (
    toothId: string,
    index: number,
    isUpper: boolean,
    isRight: boolean,
  ) => {
    const { cx, cy } = getToothPosition(index, isUpper, isRight)
    const isSelected = selectedTeeth.includes(toothId)
    const treatment = toothTreatments[toothId]
    const dotColor = treatment
      ? TREATMENT_DOT_COLORS[treatment] || 'var(--color-muted-foreground)'
      : null

    return (
      <g
        key={toothId}
        onClick={() => onToggleTooth?.(toothId)}
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`Dente ${toothId}${treatment ? `, ${treatment}` : ''}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleTooth?.(toothId)
          }
        }}
        className="cursor-pointer focus:outline-none"
        style={{ outline: 'none' }}
      >
        {/* Tooth circle */}
        <circle
          cx={cx}
          cy={cy}
          r={13}
          fill={isSelected ? 'rgb(var(--color-primary-rgb) / 0.15)' : 'rgb(var(--color-card-rgb) / 0.8)'}
          stroke={isSelected ? 'var(--color-primary)' : 'rgb(var(--color-border-rgb) / 0.6)'}
          strokeWidth={isSelected ? 2 : 1.5}
          className="transition-all"
        />

        {/* Focus ring */}
        <circle
          cx={cx}
          cy={cy}
          r={16}
          fill="none"
          stroke="var(--color-ring)"
          strokeWidth={2}
          opacity={0}
          className="focus-ring"
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
          fill={isSelected ? 'var(--color-primary)' : 'var(--color-foreground)'}
        >
          {toothId}
        </text>

        {/* Treatment type dot */}
        {dotColor && (
          <circle cx={cx + 9} cy={cy - 9} r={3.5} fill={dotColor} />
        )}
      </g>
    )
  }

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 400 380"
        className="w-full max-w-md mx-auto"
        role="group"
        aria-label="Diagrama de arcada dental"
      >
        <style>{`
          g:focus .focus-ring { opacity: 1; }
          g:hover circle:first-child { filter: brightness(0.95); }
        `}</style>

        {/* Upper arch label */}
        <text
          x="200"
          y="28"
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-muted-foreground)"
          fontWeight="500"
        >
          Superior
        </text>

        {/* Upper right */}
        {UPPER_RIGHT.map((id, i) => renderTooth(id, i, true, true))}
        {/* Upper left */}
        {UPPER_LEFT.map((id, i) => renderTooth(id, i, true, false))}

        {/* Midline separator */}
        <line
          x1="200"
          y1="160"
          x2="200"
          y2="220"
          stroke="rgb(var(--color-border-rgb) / 0.3)"
          strokeWidth="1"
          strokeDasharray="3,3"
        />

        {/* Lower left */}
        {LOWER_LEFT.map((id, i) => renderTooth(id, i, false, false))}
        {/* Lower right */}
        {LOWER_RIGHT.map((id, i) => renderTooth(id, i, false, true))}

        {/* Lower arch label */}
        <text
          x="200"
          y="355"
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-muted-foreground)"
          fontWeight="500"
        >
          Inferior
        </text>
      </svg>

      {/* Legend */}
      {usedTreatments.size > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 px-2">
          {Array.from(usedTreatments).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    TREATMENT_DOT_COLORS[t] || 'var(--color-muted-foreground)',
                }}
              />
              <span className="text-xs text-muted-foreground">
                {TREATMENT_LABELS[t] || t}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
