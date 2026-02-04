'use client';

/**
 * PageBreakdownCard - Declarative breakdown card with progress bars
 *
 * Displays a card with items showing values and progress bars relative to a total.
 * Used in DashboardPage for status breakdowns (e.g., course status, user status).
 *
 * @module page-breakdown-card
 *
 * @example
 * ```tsx
 * <PageBreakdownCard
 *   title="Status dos Cursos"
 *   items={[
 *     { label: 'Aprovados', value: 150, color: 'success' },
 *     { label: 'Em Análise', value: 25, color: 'warning' },
 *     { label: 'Rejeitados', value: 10, color: 'destructive' },
 *   ]}
 *   total={185}
 * />
 * ```
 */

import { cn } from '@pageshell/core';
import { Card } from '../card';
import { resolveIcon, type IconProp } from '../icons';

// =============================================================================
// Types
// =============================================================================

/** Color variants for breakdown progress bars */
export type BreakdownColor = 'success' | 'warning' | 'destructive' | 'accent' | 'primary' | 'info';

export interface PageBreakdownCardItem {
  /** Display label */
  label: string;
  /** Numeric value */
  value: number;
  /** Progress bar color */
  color: BreakdownColor;
}

export interface PageBreakdownCardProps {
  /** Card title */
  title: string;
  /** Items to display with progress bars */
  items: PageBreakdownCardItem[];
  /** Total value for percentage calculation */
  total: number;
  /** Optional icon for the card header */
  icon?: IconProp;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Progress Bar Color Config
// =============================================================================

const progressColorConfig: Record<BreakdownColor, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  accent: 'bg-accent',
  primary: 'bg-primary',
  info: 'bg-blue-500',
};

// =============================================================================
// Progress Bar Component
// =============================================================================

function ProgressBar({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: BreakdownColor;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClass = progressColorConfig[color];

  return (
    <div className="w-48 bg-border rounded-full h-2">
      <div
        className={cn(colorClass, 'h-2 rounded-full transition-all duration-300')}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PageBreakdownCard({
  title,
  items,
  total,
  icon,
  className,
}: PageBreakdownCardProps) {
  const Icon = icon ? resolveIcon(icon) : null;

  return (
    <Card variant="glow" className={cn('p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && (
          <div className="portal-section-icon cyan">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <h2 className="portal-heading portal-heading-md">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-2">
              <ProgressBar value={item.value} total={total} color={item.color} />
              <span className="portal-mono text-sm text-foreground w-12 text-right">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

PageBreakdownCard.displayName = 'PageBreakdownCard';
