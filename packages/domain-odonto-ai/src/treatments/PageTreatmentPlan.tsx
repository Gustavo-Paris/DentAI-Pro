'use client';

/**
 * PageTreatmentPlan - Treatment plan overview
 *
 * Displays a treatment plan with title, patient name, status badge,
 * list of procedures with completion progress bar, total cost, and date range.
 *
 * @example
 * ```tsx
 * <PageTreatmentPlan
 *   plan={{
 *     id: '1',
 *     patientId: 'p1',
 *     patientName: 'Maria Silva',
 *     title: 'Full Restoration',
 *     status: 'in-progress',
 *     procedures: [],
 *     totalCost: { value: 5000, currency: 'BRL' },
 *     startDate: '2026-02-01',
 *     estimatedEndDate: '2026-06-01',
 *     createdAt: '2026-01-15',
 *     updatedAt: '2026-02-10',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { TreatmentPlanInfo } from './types';
import type { TreatmentStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageTreatmentPlanProps {
  /** Treatment plan data */
  plan: TreatmentPlanInfo;
  /** Callback when a procedure is selected */
  onProcedureSelect?: (id: string) => void;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_VARIANT: Record<TreatmentStatus, 'muted' | 'warning' | 'accent' | 'destructive'> = {
  planned: 'muted',
  'in-progress': 'warning',
  completed: 'accent',
  cancelled: 'destructive',
};

const STATUS_LABEL: Record<TreatmentStatus, string> = {
  planned: tPageShell('domain.odonto.treatments.plan.statusPlanned', 'Planned'),
  'in-progress': tPageShell('domain.odonto.treatments.plan.statusInProgress', 'In Progress'),
  completed: tPageShell('domain.odonto.treatments.plan.statusCompleted', 'Completed'),
  cancelled: tPageShell('domain.odonto.treatments.plan.statusCancelled', 'Cancelled'),
};

function formatMoney(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: amount.currency,
  }).format(amount.value);
}

// =============================================================================
// Component
// =============================================================================

export function PageTreatmentPlan({
  plan,
  onProcedureSelect,
  className,
}: PageTreatmentPlanProps) {
  const completedCount = plan.procedures.filter((p) => p.status === 'completed').length;
  const totalCount = plan.procedures.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-base truncate">{plan.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tPageShell('domain.odonto.treatments.plan.patient', 'Patient')}: {plan.patientName}
          </p>
        </div>
        <StatusBadge
          label={STATUS_LABEL[plan.status]}
          variant={STATUS_VARIANT[plan.status]}
        />
      </div>

      {/* Date range */}
      {(plan.startDate || plan.estimatedEndDate) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          {plan.startDate && (
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="w-3 h-3" />
              {tPageShell('domain.odonto.treatments.plan.start', 'Start')}: {plan.startDate}
            </span>
          )}
          {plan.estimatedEndDate && (
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="w-3 h-3" />
              {tPageShell('domain.odonto.treatments.plan.end', 'Est. end')}: {plan.estimatedEndDate}
            </span>
          )}
        </div>
      )}

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              {tPageShell('domain.odonto.treatments.plan.progress', 'Progress')}
            </span>
            <span>{completedCount}/{totalCount} ({progressPercent}%)</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Procedures list */}
      {totalCount > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {tPageShell('domain.odonto.treatments.plan.procedures', 'Procedures')}
          </h3>
          <ul className="space-y-1">
            {plan.procedures.map((proc) => (
              <li
                key={proc.id}
                role={onProcedureSelect ? 'button' : undefined}
                tabIndex={onProcedureSelect ? 0 : undefined}
                className={cn(
                  'flex items-center justify-between text-sm py-1.5 px-2 rounded',
                  onProcedureSelect && 'cursor-pointer hover:bg-accent/5',
                )}
                onClick={() => onProcedureSelect?.(proc.id)}
                onKeyDown={(e) => {
                  if (onProcedureSelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onProcedureSelect(proc.id);
                  }
                }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <PageIcon
                    name={proc.status === 'completed' ? 'check-circle' : 'circle'}
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      proc.status === 'completed' ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span className="truncate">{proc.name}</span>
                  {proc.tooth && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      #{proc.tooth}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatMoney(proc.cost)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cost summary */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm font-medium">
          {tPageShell('domain.odonto.treatments.plan.totalCost', 'Total')}
        </span>
        <div className="text-right">
          <span className="text-sm font-semibold">{formatMoney(plan.totalCost)}</span>
          {plan.insuranceCoverage && (
            <p className="text-xs text-muted-foreground">
              {tPageShell('domain.odonto.treatments.plan.insurance', 'Insurance')}: {formatMoney(plan.insuranceCoverage)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
