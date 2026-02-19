'use client';

/**
 * PageTreatmentCostEstimate - Cost estimate breakdown table
 *
 * Displays a table of cost estimate items showing procedure name, cost,
 * insurance coverage, and patient responsibility. Includes a totals row.
 *
 * @example
 * ```tsx
 * <PageTreatmentCostEstimate
 *   items={[
 *     {
 *       procedure: 'Root Canal',
 *       cost: { value: 1200, currency: 'BRL' },
 *       insuranceCoverage: { value: 800, currency: 'BRL' },
 *       patientResponsibility: { value: 400, currency: 'BRL' },
 *     },
 *     {
 *       procedure: 'Crown',
 *       cost: { value: 2000, currency: 'BRL' },
 *       patientResponsibility: { value: 2000, currency: 'BRL' },
 *     },
 *   ]}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';

import type { CostEstimateItem } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageTreatmentCostEstimateProps {
  /** Cost estimate items */
  items: CostEstimateItem[];
  /** Title for the table */
  title?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatMoney(amount: { value: number; currency: string }): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: amount.currency,
  }).format(amount.value);
}

function sumAmounts(amounts: { value: number; currency: string }[]): { value: number; currency: string } {
  const currency = amounts[0]?.currency ?? 'BRL';
  return {
    value: amounts.reduce((sum, a) => sum + a.value, 0),
    currency,
  };
}

// =============================================================================
// Component
// =============================================================================

export function PageTreatmentCostEstimate({
  items,
  title = tPageShell('domain.odonto.treatments.costEstimate.title', 'Cost Estimate'),
  className,
}: PageTreatmentCostEstimateProps) {
  const totalCost = sumAmounts(items.map((i) => i.cost));
  const totalInsurance = sumAmounts(
    items.filter((i) => i.insuranceCoverage).map((i) => i.insuranceCoverage!),
  );
  const totalResponsibility = sumAmounts(items.map((i) => i.patientResponsibility));

  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {tPageShell('domain.odonto.treatments.costEstimate.procedure', 'Procedure')}
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                {tPageShell('domain.odonto.treatments.costEstimate.cost', 'Cost')}
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                {tPageShell('domain.odonto.treatments.costEstimate.insurance', 'Insurance')}
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                {tPageShell('domain.odonto.treatments.costEstimate.responsibility', 'Patient')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2">{item.procedure}</td>
                <td className="text-right px-4 py-2 text-muted-foreground">
                  {formatMoney(item.cost)}
                </td>
                <td className="text-right px-4 py-2 text-muted-foreground">
                  {item.insuranceCoverage ? formatMoney(item.insuranceCoverage) : '-'}
                </td>
                <td className="text-right px-4 py-2">
                  {formatMoney(item.patientResponsibility)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-medium">
              <td className="px-4 py-2">
                {tPageShell('domain.odonto.treatments.costEstimate.total', 'Total')}
              </td>
              <td className="text-right px-4 py-2">{formatMoney(totalCost)}</td>
              <td className="text-right px-4 py-2">
                {totalInsurance.value > 0 ? formatMoney(totalInsurance) : '-'}
              </td>
              <td className="text-right px-4 py-2">{formatMoney(totalResponsibility)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
