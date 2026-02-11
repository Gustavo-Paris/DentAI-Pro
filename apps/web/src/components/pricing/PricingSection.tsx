import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { PricingCard } from './PricingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export function PricingSection() {
  const {
    plans,
    subscription,
    currentPlan,
    isLoading,
    checkout,
    isCheckingOut,
  } = useSubscription();
  const { t } = useTranslation();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlanSortOrder = currentPlan?.sort_order;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[450px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-semibold font-display tracking-tight">{t('components.pricing.section.title')}</h2>
        <p className="text-muted-foreground mt-2">
          {t('components.pricing.section.subtitle')}
        </p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="billing-toggle" className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
          {t('components.pricing.section.monthly')}
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingPeriod === 'yearly'}
          onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
        />
        <Label htmlFor="billing-toggle" className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
          {t('components.pricing.section.yearly')}
        </Label>
        {billingPeriod === 'yearly' && (
          <Badge variant="secondary" className="text-success bg-success/10">
            -16%
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.plan_id === plan.id}
            isPopular={plan.id === 'price_pro_monthly_v2'}
            onSelect={checkout}
            isLoading={isCheckingOut}
            currentPlanSortOrder={currentPlanSortOrder}
            billingPeriod={billingPeriod}
          />
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t('components.pricing.section.guarantee')}
      </p>
    </div>
  );
}
