import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, Zap, Settings, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const statusKeys: Record<string, { key: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { key: 'statusActive', variant: 'default' },
  trialing: { key: 'statusTrialing', variant: 'secondary' },
  past_due: { key: 'statusPastDue', variant: 'destructive' },
  canceled: { key: 'statusCanceled', variant: 'outline' },
  inactive: { key: 'statusInactive', variant: 'outline' },
  unpaid: { key: 'statusUnpaid', variant: 'destructive' },
};

export function SubscriptionStatus() {
  const { t } = useTranslation();
  const {
    subscription,
    currentPlan,
    isLoading,
    isActive,
    creditsPerMonth,
    creditsUsed,
    creditsRollover,
    creditsTotal,
    creditsRemaining,
    creditsPercentUsed,
    estimatedDaysRemaining,
    openPortal,
    isOpeningPortal,
  } = useSubscription();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('components.pricing.subscription.plan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('components.pricing.subscription.credits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = subscription?.status || 'inactive';
  const statusConfig = statusKeys[status] || statusKeys.inactive;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1 — Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('components.pricing.subscription.plan')}
            </CardTitle>
            <Badge variant={statusConfig.variant}>{t(`components.pricing.subscription.${statusConfig.key}`)}</Badge>
          </div>
          <CardDescription>{t('components.pricing.subscription.subscriptionDetails')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{currentPlan?.name || 'Starter'}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan?.price_monthly
                  ? `${formatPrice(currentPlan.price_monthly)}${t('components.pricing.card.perMonth')}`
                  : t('components.pricing.subscription.freeLabel')}
              </p>
            </div>
            {subscription?.stripe_customer_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPortal()}
                disabled={isOpeningPortal}
              >
                {isOpeningPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('components.pricing.subscription.manage')}
                  </>
                )}
              </Button>
            )}
          </div>

          {subscription?.current_period_end && isActive && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {t('components.pricing.subscription.nextCharge')}{' '}
                <span className="font-medium">
                  {format(new Date(subscription.current_period_end), "d 'de' MMMM", { locale: ptBR })}
                </span>
              </span>
            </div>
          )}

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 dark:bg-warning/10 text-warning rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {t('components.pricing.subscription.cancelNotice')}{' '}
                {subscription.current_period_end &&
                  format(new Date(subscription.current_period_end), "d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t('components.pricing.subscription.credits')}
          </CardTitle>
          <CardDescription>{t('components.pricing.subscription.monthlyUsage')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Credit Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('components.pricing.subscription.monthlyLabel')}</span>
              <span className={cn(
                creditsRemaining <= 5 && creditsTotal > 0 && 'text-warning font-medium'
              )}>
                {t('components.pricing.subscription.creditsCount', { used: creditsUsed, total: creditsTotal })}
              </span>
            </div>
            <Progress
              value={creditsPercentUsed}
              className={cn(creditsPercentUsed > 80 && '[&>div]:bg-warning')}
              aria-label={t('components.pricing.subscription.creditUsageLabel')}
            />
          </div>

          {/* Credit Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground text-xs">{t('components.pricing.subscription.planCredits')}</div>
              <div className="font-semibold">{creditsPerMonth}</div>
            </div>
            {creditsRollover > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <RefreshCw className="h-3 w-3" />
                  <span>{t('pricing.creditRollover')}</span>
                </div>
                <div className="font-semibold text-success">+{creditsRollover}</div>
              </div>
            )}
          </div>

          {/* Estimated Days Remaining */}
          {estimatedDaysRemaining !== null && (
            <div className="text-sm text-muted-foreground">
              {t('components.pricing.subscription.estimatedDays', { days: estimatedDaysRemaining })}
            </div>
          )}

          {/* Credit Costs Reference */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            {t('components.pricing.subscription.costsReference')}
          </div>

          {/* Low Credits Warning */}
          {creditsRemaining <= 5 && creditsTotal > 0 && (
            <p className="text-xs text-warning">
              {t('components.pricing.subscription.lowCreditsWarning')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
