import { useSubscription } from '@/hooks/useSubscription';
import { PricingCard } from './PricingCard';
import { Skeleton } from '@/components/ui/skeleton';

export function PricingSection() {
  const {
    plans,
    subscription,
    isLoading,
    checkout,
    isCheckingOut,
  } = useSubscription();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[450px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Escolha seu plano</h2>
        <p className="text-muted-foreground mt-2">
          Comece gratuitamente e faça upgrade quando precisar
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.plan_id === plan.id}
            isPopular={plan.id === 'price_pro_monthly_v2'}
            onSelect={checkout}
            isLoading={isCheckingOut}
          />
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Todos os planos incluem 7 dias de garantia. Cancele a qualquer momento.
      </p>
    </div>
  );
}
