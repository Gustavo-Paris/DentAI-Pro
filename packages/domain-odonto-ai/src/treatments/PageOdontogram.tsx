'use client';

/**
 * PageOdontogram - Visual dental chart (odontogram)
 *
 * Renders an interactive dental chart with upper and lower arches.
 * Each tooth (FDI 11-48) is represented as a numbered element with
 * condition-based coloring. Grid layout with 4 quadrants.
 *
 * @example
 * ```tsx
 * <PageOdontogram
 *   teeth={[
 *     { number: 11, condition: 'healthy' },
 *     { number: 21, condition: 'caries' },
 *     { number: 36, condition: 'filled' },
 *   ]}
 *   onToothClick={(num) => console.log('Tooth', num)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';

import type { OdontogramTooth } from './types';
import type { ToothNumber, ToothCondition } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageOdontogramProps {
  /** Tooth data array */
  teeth: OdontogramTooth[];
  /** Callback when a tooth is clicked */
  onToothClick?: (tooth: ToothNumber) => void;
  /** Override title text */
  title?: string;
  /** Override condition labels */
  conditionLabels?: Partial<Record<ToothCondition, string>>;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const CONDITION_COLORS: Record<ToothCondition, string> = {
  healthy: 'bg-green-500/15 text-green-500 border-green-500/30',
  caries: 'bg-red-500/25 text-red-400 border-red-500/40',
  filled: 'bg-blue-500/25 text-blue-400 border-blue-500/40',
  crown: 'bg-yellow-500/25 text-yellow-400 border-yellow-500/40',
  missing: 'bg-muted text-muted-foreground border-border',
  implant: 'bg-purple-500/25 text-purple-400 border-purple-500/40',
  'root-canal': 'bg-orange-500/25 text-orange-400 border-orange-500/40',
  bridge: 'bg-teal-500/25 text-teal-400 border-teal-500/40',
  veneer: 'bg-cyan-500/25 text-cyan-400 border-cyan-500/40',
  fracture: 'bg-rose-500/25 text-rose-400 border-rose-500/40',
  'extraction-indicated': 'bg-red-500/30 text-red-400 border-red-500/50',
};

const CONDITION_LABEL: Record<ToothCondition, string> = {
  healthy: tPageShell('domain.odonto.treatments.odontogram.healthy', 'Healthy'),
  caries: tPageShell('domain.odonto.treatments.odontogram.caries', 'Caries'),
  filled: tPageShell('domain.odonto.treatments.odontogram.filled', 'Filled'),
  crown: tPageShell('domain.odonto.treatments.odontogram.crown', 'Crown'),
  missing: tPageShell('domain.odonto.treatments.odontogram.missing', 'Missing'),
  implant: tPageShell('domain.odonto.treatments.odontogram.implant', 'Implant'),
  'root-canal': tPageShell('domain.odonto.treatments.odontogram.rootCanal', 'Root Canal'),
  bridge: tPageShell('domain.odonto.treatments.odontogram.bridge', 'Bridge'),
  veneer: tPageShell('domain.odonto.treatments.odontogram.veneer', 'Veneer'),
  fracture: tPageShell('domain.odonto.treatments.odontogram.fracture', 'Fracture'),
  'extraction-indicated': tPageShell('domain.odonto.treatments.odontogram.extractionIndicated', 'Extraction'),
};

// FDI quadrants
const UPPER_RIGHT: ToothNumber[] = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT: ToothNumber[] = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT: ToothNumber[] = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT: ToothNumber[] = [48, 47, 46, 45, 44, 43, 42, 41];

// =============================================================================
// Sub-components
// =============================================================================

function ToothCell({
  number,
  tooth,
  labels,
  onClick,
}: {
  number: ToothNumber;
  tooth?: OdontogramTooth;
  labels: Record<ToothCondition, string>;
  onClick?: (n: ToothNumber) => void;
}) {
  const condition: ToothCondition = tooth?.condition ?? 'healthy';
  const colorClass = CONDITION_COLORS[condition];

  return (
    <button
      type="button"
      title={`${number} - ${labels[condition]}`}
      aria-label={`${tPageShell('domain.odonto.treatments.odontogram.tooth', 'Tooth')} ${number}: ${labels[condition]}`}
      className={cn(
        'w-9 h-9 rounded border text-xs font-medium flex items-center justify-center transition-transform hover:scale-110',
        colorClass,
        onClick && 'cursor-pointer',
      )}
      onClick={() => onClick?.(number)}
    >
      {number}
    </button>
  );
}

function QuadrantRow({
  numbers,
  teethMap,
  labels,
  onToothClick,
}: {
  numbers: ToothNumber[];
  teethMap: Map<ToothNumber, OdontogramTooth>;
  labels: Record<ToothCondition, string>;
  onToothClick?: (n: ToothNumber) => void;
}) {
  return (
    <div className="flex gap-1">
      {numbers.map((num) => (
        <ToothCell
          key={num}
          number={num}
          tooth={teethMap.get(num)}
          labels={labels}
          onClick={onToothClick}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageOdontogram({
  teeth,
  onToothClick,
  title,
  conditionLabels: conditionLabelsOverride,
  className,
}: PageOdontogramProps) {
  const teethMap = new Map(teeth.map((t) => [t.number, t]));
  const resolvedLabels = { ...CONDITION_LABEL, ...conditionLabelsOverride };

  // Collect unique conditions for legend
  const usedConditions = new Set(teeth.map((t) => t.condition));

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <h3 className="text-sm font-medium mb-3">
        {title ?? tPageShell('domain.odonto.treatments.odontogram.title', 'Odontogram')}
      </h3>

      {/* Upper arch */}
      <div className="flex justify-center gap-2 mb-1">
        <QuadrantRow numbers={UPPER_RIGHT} teethMap={teethMap} labels={resolvedLabels} onToothClick={onToothClick} />
        <div className="w-px bg-border" />
        <QuadrantRow numbers={UPPER_LEFT} teethMap={teethMap} labels={resolvedLabels} onToothClick={onToothClick} />
      </div>

      {/* Arch separator */}
      <div className="border-t border-border my-2" />

      {/* Lower arch */}
      <div className="flex justify-center gap-2 mt-1">
        <QuadrantRow numbers={LOWER_RIGHT} teethMap={teethMap} labels={resolvedLabels} onToothClick={onToothClick} />
        <div className="w-px bg-border" />
        <QuadrantRow numbers={LOWER_LEFT} teethMap={teethMap} labels={resolvedLabels} onToothClick={onToothClick} />
      </div>

      {/* Legend */}
      {usedConditions.size > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
          {(Object.keys(CONDITION_COLORS) as ToothCondition[])
            .filter((c) => usedConditions.has(c))
            .map((condition) => (
              <div key={condition} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('w-3 h-3 rounded border', CONDITION_COLORS[condition])} />
                <span>{resolvedLabels[condition]}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
