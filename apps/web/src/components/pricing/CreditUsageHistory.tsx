import { Camera, Sparkles, History, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription, type CreditUsageRecord } from '@/hooks/useSubscription';

const operationConfig: Record<string, { label: string; icon: typeof Camera; color: string }> = {
  case_analysis: { label: 'Análise de Caso', icon: Camera, color: 'text-blue-500' },
  dsd_simulation: { label: 'Simulação DSD', icon: Sparkles, color: 'text-purple-500' },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function CreditUsageHistory() {
  const { creditUsageHistory, isCreditUsageLoading, estimatedDaysRemaining } = useSubscription();

  if (isCreditUsageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <History className="h-5 w-5" />
            Histórico de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <History className="h-5 w-5" />
            Histórico de Uso
          </CardTitle>
          {estimatedDaysRemaining !== null && (
            <span className="text-xs text-muted-foreground">
              ~{estimatedDaysRemaining} dias restantes
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {creditUsageHistory.length === 0 ? (
          <div className="py-8 text-center">
            <History className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum uso registrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              O histórico aparecerá aqui quando você usar seus créditos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {creditUsageHistory.map((entry: CreditUsageRecord) => {
              const config = operationConfig[entry.operation] || {
                label: entry.operation,
                icon: Zap,
                color: 'text-muted-foreground',
              };
              const Icon = config.icon;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    -{entry.credits_used} cr
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
