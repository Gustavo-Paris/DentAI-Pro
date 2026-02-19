import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

export function CreditsBanner({
  creditsRemaining,
  onDismiss,
}: {
  creditsRemaining: number;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 dark:border-primary/15 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 dark:from-primary/8 dark:via-primary/4 dark:to-primary/8" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--color-primary-rgb)/0.06),_transparent_60%)]" />

      <div className="relative flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
          <AlertTriangle className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t('dashboard.credits.remaining', { count: creditsRemaining })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.credits.upgradeHint')}
          </p>
        </div>
        <Link to="/pricing">
          <Button size="sm" className="btn-glow-gold shrink-0">
            {t('common.viewPlans')}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          aria-label={t('dashboard.credits.dismissLabel')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
