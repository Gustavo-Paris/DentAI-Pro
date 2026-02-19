'use client';

/**
 * PageEvaluationToothCard - Tooth evaluation card
 *
 * Displays a single tooth evaluation with treatment type, icon, AI indication,
 * and completion status. Expects pre-resolved labels and icons from the adapter layer.
 *
 * @example
 * ```tsx
 * <PageEvaluationToothCard
 *   evaluation={{
 *     tooth: '11',
 *     treatmentType: 'resina',
 *     treatmentLabel: 'Resina Composta',
 *     treatmentIcon: PaletteIcon,
 *     status: 'completed',
 *     aiIndication: 'Restauração direta em resina composta',
 *   }}
 *   onSelect={(tooth) => console.log(tooth)}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { EvaluationToothInfo } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageEvaluationToothCardProps {
  /** Tooth evaluation data */
  evaluation: EvaluationToothInfo;
  /** Callback when the card is selected */
  onSelect?: (tooth: string) => void;
  /** Additional CSS class names */
  className?: string;
  /** Override label for "Completed" status */
  completedLabel?: string;
  /** Override label for "Planned" status */
  plannedLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageEvaluationToothCard({
  evaluation,
  onSelect,
  className,
  completedLabel = tPageShell('domain.odonto.evaluations.toothCard.completed', 'Completed'),
  plannedLabel = tPageShell('domain.odonto.evaluations.toothCard.planned', 'Planned'),
}: PageEvaluationToothCardProps) {
  const { tooth, treatmentLabel, treatmentIcon: TreatmentIcon, status, aiIndication } = evaluation;
  const isCompleted = status === 'completed';

  const card = (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm',
        onSelect && 'cursor-pointer transition-colors hover:bg-accent/5',
        className,
      )}
      onClick={onSelect ? () => onSelect(tooth) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(tooth);
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-md border border-border px-2 py-0.5 text-sm font-mono text-foreground">
            {tooth}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <TreatmentIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{treatmentLabel}</span>
            </div>
            {aiIndication && (
              <p className="text-xs text-muted-foreground mt-1">{aiIndication}</p>
            )}
          </div>
        </div>
        <StatusBadge
          variant={isCompleted ? 'accent' : 'outline'}
          label={isCompleted ? completedLabel : plannedLabel}
        />
      </div>
    </div>
  );

  return card;
}
