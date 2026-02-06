import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, Zap, Settings, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
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
              Plano
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
              Créditos
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
  const statusConfig = statusLabels[status] || statusLabels.inactive;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1 — Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plano
            </CardTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <CardDescription>Detalhes da sua assinatura</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{currentPlan?.name || 'Starter'}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan?.price_monthly
                  ? `${formatPrice(currentPlan.price_monthly)}/mês`
                  : 'Gratuito'}
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

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Sua assinatura será cancelada em{' '}
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
            Créditos
          </CardTitle>
          <CardDescription>Uso mensal de créditos</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Credit Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso mensal</span>
              <span className={cn(
                creditsRemaining <= 5 && creditsTotal > 0 && 'text-orange-500 dark:text-orange-400 font-medium'
              )}>
                {creditsUsed} / {creditsTotal} créditos
              </span>
            </div>
            <Progress
              value={creditsPercentUsed}
              className={cn(creditsPercentUsed > 80 && '[&>div]:bg-orange-500 dark:[&>div]:bg-orange-400')}
            />
          </div>

          {/* Credit Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground text-xs">Créditos do plano</div>
              <div className="font-semibold">{creditsPerMonth}</div>
            </div>
            {creditsRollover > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <RefreshCw className="h-3 w-3" />
                  <span>Rollover</span>
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">+{creditsRollover}</div>
              </div>
            )}
          </div>

          {/* Estimated Days Remaining */}
          {estimatedDaysRemaining !== null && (
            <div className="text-sm text-muted-foreground">
              Estimativa: <span className="font-medium">~{estimatedDaysRemaining} dias</span> de uso restante
            </div>
          )}

          {/* Credit Costs Reference */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <strong>Custos:</strong> Análise de caso = 1 crédito | Simulação DSD = 2 créditos
          </div>

          {/* Low Credits Warning */}
          {creditsRemaining <= 5 && creditsTotal > 0 && (
            <p className="text-xs text-orange-500 dark:text-orange-400">
              Você está chegando ao limite de créditos. Considere fazer upgrade.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
