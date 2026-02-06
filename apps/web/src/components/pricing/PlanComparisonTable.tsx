import { Check, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSubscription, formatPrice, type SubscriptionPlan } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface FeatureRow {
  label: string;
  getValue: (plan: SubscriptionPlan) => string | boolean | number;
}

const features: FeatureRow[] = [
  { label: 'Créditos/mês', getValue: (p) => p.credits_per_month },
  { label: 'Análises de caso', getValue: (p) => p.cases_per_month === -1 ? 'Ilimitado' : String(p.cases_per_month) },
  { label: 'Simulações DSD', getValue: (p) => p.dsd_simulations_per_month === -1 ? 'Ilimitado' : String(p.dsd_simulations_per_month) },
  { label: 'Rollover de créditos', getValue: (p) => p.allows_rollover },
  { label: 'Máx. rollover', getValue: (p) => p.rollover_max ? String(p.rollover_max) : p.allows_rollover ? 'Ilimitado' : false },
  { label: 'Usuários', getValue: (p) => p.max_users },
  { label: 'Suporte prioritário', getValue: (p) => p.priority_support },
  { label: 'Recomendações de resina', getValue: () => true },
  { label: 'Protocolos de cimentação', getValue: (p) => p.sort_order >= 1 },
  { label: 'Exportação PDF', getValue: (p) => p.sort_order >= 1 },
  { label: 'Suporte dedicado', getValue: (p) => p.sort_order >= 3 },
  { label: 'Onboarding personalizado', getValue: (p) => p.sort_order >= 3 },
];

function CellValue({ value }: { value: string | boolean | number }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-green-500 mx-auto" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PlanComparisonTable() {
  const { plans, subscription } = useSubscription();

  if (plans.length === 0) return null;

  const popularPlanId = 'price_pro_monthly_v2';

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold font-display text-center">Comparar Planos</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Recurso</TableHead>
            {plans.map((plan) => (
              <TableHead key={plan.id} className="text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-semibold">{plan.name}</span>
                    {plan.id === popularPlanId && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">Popular</Badge>
                    )}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {plan.price_monthly === 0 ? 'Grátis' : `${formatPrice(plan.price_monthly)}/mês`}
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.label}>
              <TableCell className="font-medium text-sm">{feature.label}</TableCell>
              {plans.map((plan) => (
                <TableCell
                  key={plan.id}
                  className={cn(
                    'text-center',
                    subscription?.plan_id === plan.id && 'bg-primary/5',
                    plan.id === popularPlanId && !subscription?.plan_id && 'bg-primary/5'
                  )}
                >
                  <CellValue value={feature.getValue(plan)} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
