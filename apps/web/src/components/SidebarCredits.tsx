import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

/**
 * Sidebar credits widget — shows remaining credits with progress bar and hint.
 * Replaces the compact CreditBadge in the sidebar footer.
 */
export const SidebarCredits = memo(function SidebarCredits() {
  const { t } = useTranslation();
  const { creditsRemaining, creditsTotal, isLoading, getCreditCost, isActive, isFree } = useSubscription();

  if (isLoading) return null;

  const isInactive = !isActive && !isFree;
  const isLow = creditsRemaining <= 5;
  const isCritical = creditsRemaining <= 2 || isInactive;
  const percentRemaining = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;

  const barColor = isCritical
    ? 'bg-destructive'
    : isLow
      ? 'bg-warning'
      : 'bg-primary';

  const countColor = isCritical
    ? 'text-destructive'
    : isLow
      ? 'text-warning'
      : 'text-sidebar-foreground';

  const analysisCredits = getCreditCost('case_analysis');
  const dsdCredits = getCreditCost('dsd_simulation');
  const estimatedAnalyses = Math.floor(creditsRemaining / analysisCredits);
  const estimatedDsd = Math.floor(creditsRemaining / dsdCredits);

  return (
    <Link
      to="/profile?tab=assinatura"
      className="block px-3 py-2.5 mx-2 rounded-lg transition-colors hover:bg-sidebar-accent group"
    >
      {/* Label + counter */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-sidebar-foreground/70">
          {t('components.creditBadge.creditsLabel')}
        </span>
        <span className={cn('text-xs font-semibold tabular-nums', countColor)}>
          {creditsRemaining}/{creditsTotal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-sidebar-accent overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${Math.min(100, percentRemaining)}%` }}
        />
      </div>

      {/* Hint text */}
      <p className={cn(
        'text-xs mt-1.5 transition-colors',
        isInactive ? 'text-destructive font-medium' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70',
      )}>
        {isInactive
          ? t('components.sidebar.subscriptionInactive')
          : t('components.sidebar.creditsHint', {
              analyses: estimatedAnalyses,
              dsd: estimatedDsd,
            })}
      </p>
    </Link>
  );
});
