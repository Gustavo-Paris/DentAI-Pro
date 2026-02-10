import { Check, Loader2, Zap, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SubscriptionPlan, formatPrice } from '@/hooks/useSubscription';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: (priceId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  currentPlanSortOrder?: number;
  billingPeriod?: 'monthly' | 'yearly';
}

export function PricingCard({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
  disabled = false,
  currentPlanSortOrder,
  billingPeriod = 'monthly',
}: PricingCardProps) {
  const isFree = plan.price_monthly === 0;
  const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as unknown as string);
  const isDowngrade = currentPlanSortOrder !== undefined && plan.sort_order < currentPlanSortOrder;
  const isUpgrade = currentPlanSortOrder !== undefined && plan.sort_order > currentPlanSortOrder;
  const displayPrice = billingPeriod === 'yearly' && plan.price_yearly ? plan.price_yearly : plan.price_monthly;
  const isYearly = billingPeriod === 'yearly' && !!plan.price_yearly;

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full',
        isPopular && 'border-primary shadow-lg scale-105',
        isCurrentPlan && 'border-success'
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Mais Popular
        </Badge>
      )}

      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success">
          Plano Atual
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-semibold">
              {isFree ? 'Grátis' : formatPrice(isYearly ? Math.round(displayPrice / 12) : displayPrice)}
            </span>
            {!isFree && <span className="text-muted-foreground">/mês</span>}
          </div>
          {!isFree && isYearly && (
            <p className="text-sm text-muted-foreground mt-1">
              Cobrado {formatPrice(displayPrice)}/ano
            </p>
          )}
          {!isFree && !isYearly && plan.price_yearly && (
            <p className="text-sm text-muted-foreground mt-1">
              ou {formatPrice(plan.price_yearly)}/ano (economia de 16%)
            </p>
          )}
        </div>

        {/* Credits Highlight */}
        <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Zap className="h-4 w-4" />
            <span>{plan.credits_per_month} créditos/mês</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            1 crédito = 1 análise | 2 créditos = 1 simulação DSD
          </p>
        </div>

        {/* Plan Highlights */}
        <div className="flex justify-center gap-4 mb-4 text-sm">
          {plan.max_users > 1 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{plan.max_users} usuários</span>
            </div>
          )}
          {plan.allows_rollover && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span>Rollover</span>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
          onClick={() => onSelect(plan.id)}
          disabled={disabled || isLoading || isCurrentPlan || isFree}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : isCurrentPlan ? (
            'Plano Atual'
          ) : isFree ? (
            'Plano Gratuito'
          ) : isDowngrade ? (
            'Alterar Plano'
          ) : isUpgrade ? (
            'Fazer Upgrade'
          ) : (
            'Assinar Agora'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
