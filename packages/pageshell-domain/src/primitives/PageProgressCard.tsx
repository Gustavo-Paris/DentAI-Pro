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
import { usePageShellContextOptional } from '@pageshell/theme';

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
  /** Animation delay index (default: 0) */
  animationDelay?: number;
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
  animationDelay = 0,
  testId,
}: PageProgressCardProps) {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Try to get context (optional - works outside PageShell too)
  let delayClass = '';
  let animateClass = '';

  const context = usePageShellContextOptional();
  if (context && animationDelay > 0) {
    delayClass = context.config.animateDelay(animationDelay);
    animateClass = context.config.animate;
  }

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
        animateClass,
        delayClass
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
