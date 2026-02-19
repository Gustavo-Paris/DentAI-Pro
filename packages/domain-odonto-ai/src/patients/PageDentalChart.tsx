'use client';

/**
 * PageDentalChart - Dental chart grid (FDI numbering)
 *
 * Displays a 32-tooth dental chart using FDI numbering system.
 * Each tooth shows its condition with color coding and supports
 * interactive highlights on hover.
 *
 * @example
 * ```tsx
 * <PageDentalChart
 *   teeth={[
 *     { number: 11, condition: 'healthy' },
 *     { number: 21, condition: 'caries', notes: 'Mesial cavity' },
 *     { number: 36, condition: 'filled', lastTreated: '2026-01-10' },
 *   ]}
 *   onToothSelect={(number) => console.log('Selected tooth:', number)}
 * />
 * ```
 */

import { useState } from 'react';

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { DentalChartTooth } from './types';
import type { ToothCondition, ToothNumber } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageDentalChartProps {
  /** Tooth data array */
  teeth: DentalChartTooth[];
  /** Callback when a tooth is selected */
  onToothSelect?: (toothNumber: ToothNumber) => void;
  /** Additional CSS class names */
  className?: string;
  /** Override title label */
  titleLabel?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** FDI numbering: upper-right, upper-left, lower-left, lower-right */
const UPPER_RIGHT: ToothNumber[] = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT: ToothNumber[] = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT: ToothNumber[] = [38, 37, 36, 35, 34, 33, 32, 31];
const LOWER_RIGHT: ToothNumber[] = [41, 42, 43, 44, 45, 46, 47, 48];

const CONDITION_COLOR: Record<ToothCondition, string> = {
  healthy: 'bg-green-100 text-green-800 border-green-300',
  caries: 'bg-red-100 text-red-800 border-red-300',
  filled: 'bg-blue-100 text-blue-800 border-blue-300',
  crown: 'bg-purple-100 text-purple-800 border-purple-300',
  missing: 'bg-gray-100 text-gray-400 border-gray-300',
  implant: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'root-canal': 'bg-orange-100 text-orange-800 border-orange-300',
  bridge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  veneer: 'bg-pink-100 text-pink-800 border-pink-300',
  fracture: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'extraction-indicated': 'bg-red-200 text-red-900 border-red-400',
};

const CONDITION_LABEL: Record<ToothCondition, string> = {
  healthy: tPageShell('domain.odonto.patients.dentalChart.healthy', 'Healthy'),
  caries: tPageShell('domain.odonto.patients.dentalChart.caries', 'Caries'),
  filled: tPageShell('domain.odonto.patients.dentalChart.filled', 'Filled'),
  crown: tPageShell('domain.odonto.patients.dentalChart.crown', 'Crown'),
  missing: tPageShell('domain.odonto.patients.dentalChart.missing', 'Missing'),
  implant: tPageShell('domain.odonto.patients.dentalChart.implant', 'Implant'),
  'root-canal': tPageShell('domain.odonto.patients.dentalChart.rootCanal', 'Root Canal'),
  bridge: tPageShell('domain.odonto.patients.dentalChart.bridge', 'Bridge'),
  veneer: tPageShell('domain.odonto.patients.dentalChart.veneer', 'Veneer'),
  fracture: tPageShell('domain.odonto.patients.dentalChart.fracture', 'Fracture'),
  'extraction-indicated': tPageShell('domain.odonto.patients.dentalChart.extractionIndicated', 'Extraction Indicated'),
};

// =============================================================================
// Sub-components
// =============================================================================

function ToothCell({
  number,
  tooth,
  isHovered,
  onHover,
  onSelect,
}: {
  number: ToothNumber;
  tooth?: DentalChartTooth;
  isHovered: boolean;
  onHover: (n: ToothNumber | null) => void;
  onSelect?: (n: ToothNumber) => void;
}) {
  const condition = tooth?.condition ?? 'healthy';
  const colorClass = CONDITION_COLOR[condition];

  return (
    <button
      type="button"
      className={cn(
        'w-10 h-12 rounded border text-xs font-mono flex flex-col items-center justify-center transition-all',
        colorClass,
        isHovered && 'ring-2 ring-primary scale-110 z-10',
        condition === 'missing' && 'line-through',
      )}
      onMouseEnter={() => onHover(number)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect?.(number)}
      title={`${number} - ${CONDITION_LABEL[condition]}${tooth?.notes ? `: ${tooth.notes}` : ''}`}
    >
      <span className="font-bold leading-none">{number}</span>
      <span className="text-[9px] leading-none mt-0.5 truncate max-w-full px-0.5">
        {CONDITION_LABEL[condition]}
      </span>
    </button>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PageDentalChart({
  teeth,
  onToothSelect,
  className,
  titleLabel = tPageShell('domain.odonto.patients.dentalChart.title', 'Dental Chart'),
}: PageDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<ToothNumber | null>(null);

  const toothMap = new Map(teeth.map((t) => [t.number, t]));

  function renderRow(numbers: ToothNumber[]) {
    return (
      <div className="flex gap-1 justify-center">
        {numbers.map((n) => (
          <ToothCell
            key={n}
            number={n}
            tooth={toothMap.get(n)}
            isHovered={hoveredTooth === n}
            onHover={setHoveredTooth}
            onSelect={onToothSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <PageIcon name="grid" className="w-4 h-4 text-muted-foreground" />
        {titleLabel}
      </h3>

      {/* Chart */}
      <div className="space-y-2">
        {/* Upper jaw */}
        <div className="flex gap-2 justify-center">
          {renderRow(UPPER_RIGHT)}
          <div className="w-px bg-border" />
          {renderRow(UPPER_LEFT)}
        </div>

        {/* Midline */}
        <div className="h-px bg-border mx-4" />

        {/* Lower jaw */}
        <div className="flex gap-2 justify-center">
          {renderRow(LOWER_LEFT)}
          <div className="w-px bg-border" />
          {renderRow(LOWER_RIGHT)}
        </div>
      </div>

      {/* Hover detail */}
      {hoveredTooth !== null && toothMap.has(hoveredTooth) && (
        <div className="text-xs text-muted-foreground text-center">
          {tPageShell('domain.odonto.patients.dentalChart.tooth', 'Tooth')} {hoveredTooth}
          {' — '}
          {CONDITION_LABEL[toothMap.get(hoveredTooth)!.condition]}
          {toothMap.get(hoveredTooth)!.notes && ` — ${toothMap.get(hoveredTooth)!.notes}`}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['healthy', 'caries', 'filled', 'crown', 'missing', 'implant'] as ToothCondition[]).map(
          (condition) => (
            <span
              key={condition}
              className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border', CONDITION_COLOR[condition])}
            >
              {CONDITION_LABEL[condition]}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
