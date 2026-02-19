'use client';

/**
 * PageProcedureCard - Individual procedure card
 *
 * Displays a compact card for a single dental procedure with name, code,
 * tooth number, surfaces, status badge, cost, and performed by/date.
 *
 * @example
 * ```tsx
 * <PageProcedureCard
 *   procedure={{
 *     id: '1',
 *     name: 'Root Canal',
 *     code: 'D3310',
 *     tooth: 14,
 *     surfaces: ['mesial', 'distal'],
 *     status: 'completed',
 *     cost: { value: 1200, currency: 'BRL' },
 *     performedBy: 'Dr. Santos',
 *     performedDate: '2026-02-10',
 *     createdAt: '2026-01-15',
 *     updatedAt: '2026-02-10',
 *   }}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { PageIcon, StatusBadge } from '@parisgroup-ai/pageshell/primitives';

import type { ProcedureInfo } from './types';
import type { TreatmentStatus } from '../shared';

// =============================================================================
// Types
// =============================================================================

export interface PageProcedureCardProps {
  /** Procedure data to display */
  procedure: ProcedureInfo;
  /** Callback when the card is selected */
  onSelect?: (id: string) => void;
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
  planned: tPageShell('domain.odonto.treatments.procedure.statusPlanned', 'Planned'),
  'in-progress': tPageShell('domain.odonto.treatments.procedure.statusInProgress', 'In Progress'),
  completed: tPageShell('domain.odonto.treatments.procedure.statusCompleted', 'Completed'),
  cancelled: tPageShell('domain.odonto.treatments.procedure.statusCancelled', 'Cancelled'),
};

function formatMoney(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: amount.currency,
  }).format(amount.value);
}

const SURFACE_ABBREV: Record<string, string> = {
  mesial: 'M',
  distal: 'D',
  buccal: 'B',
  lingual: 'L',
  occlusal: 'O',
  incisal: 'I',
};

// =============================================================================
// Component
// =============================================================================

export function PageProcedureCard({
  procedure,
  onSelect,
  className,
}: PageProcedureCardProps) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors',
        onSelect && 'cursor-pointer hover:bg-accent/5',
        className,
      )}
      onClick={() => onSelect?.(procedure.id)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(procedure.id);
        }
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{procedure.name}</h3>
          <span className="text-xs text-muted-foreground">{procedure.code}</span>
        </div>
        <StatusBadge
          label={STATUS_LABEL[procedure.status]}
          variant={STATUS_VARIANT[procedure.status]}
          size="sm"
        />
      </div>

      {/* Details */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {procedure.tooth && (
          <span className="flex items-center gap-1">
            <PageIcon name="hash" className="w-3 h-3" />
            {tPageShell('domain.odonto.treatments.procedure.tooth', 'Tooth')} {procedure.tooth}
          </span>
        )}
        {procedure.surfaces && procedure.surfaces.length > 0 && (
          <span>
            {procedure.surfaces.map((s) => SURFACE_ABBREV[s] || s).join('')}
          </span>
        )}
        <span className="flex items-center gap-1">
          <PageIcon name="dollar-sign" className="w-3 h-3" />
          {formatMoney(procedure.cost)}
        </span>
      </div>

      {/* Performed info */}
      {(procedure.performedBy || procedure.performedDate) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground border-t border-border pt-2">
          {procedure.performedBy && (
            <span className="flex items-center gap-1">
              <PageIcon name="user" className="w-3 h-3" />
              {procedure.performedBy}
            </span>
          )}
          {procedure.performedDate && (
            <span className="flex items-center gap-1">
              <PageIcon name="calendar" className="w-3 h-3" />
              {procedure.performedDate}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {procedure.notes && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{procedure.notes}</p>
      )}
    </div>
  );
}
