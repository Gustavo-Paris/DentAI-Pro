'use client';

/**
 * PageProgressCard - Progress tracker card primitive
 *
 * Displays a progress bar with label and count in a card format.
 * Used for module progress, course progress, etc.
 *
 * @example Basic usage
 * ```tsx
 * <PageProgressCard
 *   label="Progresso no Módulo"
 *   current={3}
 *   total={10}
 *   unit="lições"
 * />
 * ```
 *
 * @example With percentage
 * ```tsx
 * <PageProgressCard
 *   label="Progresso do Curso"
 *   current={75}
 *   total={100}
 *   showPercentage
 * />
 * ```
 *
 * @example Custom variant
 * ```tsx
 * <PageProgressCard
 *   label="XP Ganho"
 *   current={450}
 *   total={1000}
 *   unit="XP"
 *   variant="accent"
 * />
 * ```
 */

import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Progress bar color variant
 */
export type PageProgressVariant = 'primary' | 'accent' | 'success' | 'warning';

/**
 * PageProgressCard component props
 */
export interface PageProgressCardProps {
  /** Label for the progress */
  label: string;
  /** Current value */
  current: number;
  /** Total/max value */
  total: number;
  /** Unit label (e.g., "lições", "módulos", "XP") */
  unit?: string;
  /** Show percentage instead of count */
  showPercentage?: boolean;
  /** Color variant (default: 'primary') */
  variant?: PageProgressVariant;
  /** Additional CSS class */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

// =============================================================================
// Styling Maps
// =============================================================================

const variantClasses: Record<PageProgressVariant, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
};

// =============================================================================
// Component
// =============================================================================

export function PageProgressCard({
  label,
  current,
  total,
  unit,
  showPercentage = false,
  variant = 'primary',
  className,
  testId,
}: PageProgressCardProps) {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Format display value
  const displayValue = showPercentage
    ? `${percentage}%`
    : unit
      ? `${current} / ${total} ${unit}`
      : `${current} / ${total}`;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        className
      )}
      data-testid={testId}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-mono text-primary">{displayValue}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
