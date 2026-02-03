import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, BarChart3, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativo', variant: 'default' },
  trialing: { label: 'Período de Teste', variant: 'secondary' },
  past_due: { label: 'Pagamento Pendente', variant: 'destructive' },
  canceled: { label: 'Cancelado', variant: 'outline' },
  inactive: { label: 'Inativo', variant: 'outline' },
  unpaid: { label: 'Não Pago', variant: 'destructive' },
};

export function SubscriptionStatus() {
  const {
    subscription,
    currentPlan,
    isLoading,
    isActive,
    casesLimit,
    casesUsed,
    casesRemaining,
    dsdLimit,
    dsdUsed,
    openPortal,
    isOpeningPortal,
  } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = subscription?.status || 'inactive';
  const statusConfig = statusLabels[status] || statusLabels.inactive;

  const casesPercentage = casesLimit === -1 ? 0 : (casesUsed / casesLimit) * 100;
  const dsdPercentage = dsdLimit === -1 ? 0 : (dsdUsed / dsdLimit) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinatura
          </CardTitle>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <CardDescription>
          Gerencie sua assinatura e uso
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">{currentPlan?.name || 'Gratuito'}</p>
            <p className="text-sm text-muted-foreground">
              {currentPlan?.price_monthly
                ? `${formatPrice(currentPlan.price_monthly)}/mês`
                : 'Sem custo'}
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
                  Gerenciar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Billing Period */}
        {subscription?.current_period_end && isActive && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Próxima cobrança:{' '}
              <span className="font-medium">
                {format(new Date(subscription.current_period_end), "d 'de' MMMM", { locale: ptBR })}
              </span>
            </span>
          </div>
        )}

        {/* Cancel Warning */}
        {subscription?.cancel_at_period_end && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Sua assinatura será cancelada em{' '}
              {subscription.current_period_end &&
                format(new Date(subscription.current_period_end), "d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Usage */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Uso Mensal</span>
          </div>

          {/* Cases Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Casos</span>
              <span className={cn(casesRemaining <= 2 && casesLimit !== -1 && 'text-orange-500 font-medium')}>
                {casesLimit === -1 ? (
                  `${casesUsed} (ilimitado)`
                ) : (
                  `${casesUsed} / ${casesLimit}`
                )}
              </span>
            </div>
            {casesLimit !== -1 && (
              <Progress
                value={casesPercentage}
                className={cn(casesPercentage > 80 && '[&>div]:bg-orange-500')}
              />
            )}
          </div>

          {/* DSD Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Simulações DSD</span>
              <span className={cn(dsdRemaining <= 1 && dsdLimit !== -1 && 'text-orange-500 font-medium')}>
                {dsdLimit === -1 ? (
                  `${dsdUsed} (ilimitado)`
                ) : (
                  `${dsdUsed} / ${dsdLimit}`
                )}
              </span>
            </div>
            {dsdLimit !== -1 && (
              <Progress
                value={dsdPercentage}
                className={cn(dsdPercentage > 80 && '[&>div]:bg-orange-500')}
              />
            )}
          </div>

          {/* Low Usage Warning */}
          {(casesRemaining <= 2 || dsdRemaining <= 1) && casesLimit !== -1 && (
            <p className="text-xs text-orange-500">
              Você está chegando ao limite do seu plano. Considere fazer upgrade.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
