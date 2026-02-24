import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreditBadgeProps {
  /** 'compact' = icon + number only; 'full' = with label and bar */
  variant?: 'compact' | 'full';
  className?: string;
  /** Show tooltip on hover (default true for compact) */
  showTooltip?: boolean;
}

export const CreditBadge = memo(function CreditBadge({ variant = 'compact', className, showTooltip = true }: CreditBadgeProps) {
  const { t } = useTranslation();
  const { creditsRemaining, creditsTotal, creditsPercentUsed, isLoading, getCreditCost } = useSubscription();

  if (isLoading) return null;

  const isLow = creditsRemaining <= 5;
  const isCritical = creditsRemaining <= 2;

  const colorClass = isCritical
    ? 'text-destructive'
    : isLow
      ? 'text-warning'
      : 'text-muted-foreground';

  const bgClass = isCritical
    ? 'bg-destructive/10 dark:bg-destructive/10'
    : isLow
      ? 'bg-warning/10'
      : 'bg-secondary/50';

  const barColor = isCritical
    ? 'bg-destructive'
    : isLow
      ? 'bg-warning'
      : 'bg-primary';

  if (variant === 'compact') {
    const badge = (
      <Link
        to="/profile?tab=assinatura"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:bg-secondary',
          bgClass,
          colorClass,
          className
        )}
        aria-label={t('components.creditBadge.remaining', { remaining: creditsRemaining, total: creditsTotal })}
      >
        <Zap className="w-3 h-3" aria-hidden="true" />
        <span>{creditsRemaining} cr</span>
      </Link>
    );

    if (showTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p className="font-medium">{t('components.creditBadge.remaining', { remaining: creditsRemaining, total: creditsTotal })}</p>
            <p className="text-muted-foreground mt-0.5">
              {t('components.creditBadge.costInfo', { analysis: getCreditCost('case_analysis'), dsd: getCreditCost('dsd_simulation') })}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return badge;
  }

  // Full variant
  return (
    <div className={cn('rounded-lg border p-3', bgClass, className)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn('flex items-center gap-1.5 text-sm font-medium', colorClass)}>
          <Zap className="w-3.5 h-3.5" />
          <span>{t('components.creditBadge.creditsLabel')}</span>
        </div>
        <span className={cn('text-sm font-semibold', colorClass)}>
          {creditsRemaining}/{creditsTotal}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(100, creditsPercentUsed)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {t('components.creditBadge.costInfo', { analysis: getCreditCost('case_analysis'), dsd: getCreditCost('dsd_simulation') })}
      </p>
    </div>
  );
});

/**
 * Inline credit cost indicator for buttons.
 * Usage: <CreditCostTag operation="case_analysis" />
 */
export function CreditCostTag({ operation, className }: { operation: string; className?: string }) {
  const { getCreditCost } = useSubscription();
  const cost = getCreditCost(operation);

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs opacity-70', className)}>
      <Zap className="w-3 h-3" />
      {cost}
    </span>
  );
}
