import { useTranslation } from 'react-i18next';
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
  labelKey: string;
  getValue: (plan: SubscriptionPlan) => string | boolean | number;
  unlimitedKey?: boolean;
}

const featureRows: FeatureRow[] = [
  { labelKey: 'creditsMonth', getValue: (p) => p.credits_per_month },
  { labelKey: 'caseAnalyses', getValue: (p) => p.cases_per_month === -1 ? '__unlimited__' : String(p.cases_per_month), unlimitedKey: true },
  { labelKey: 'dsdSimulations', getValue: (p) => p.dsd_simulations_per_month === -1 ? '__unlimited__' : String(p.dsd_simulations_per_month), unlimitedKey: true },
  { labelKey: 'creditRollover', getValue: (p) => p.allows_rollover },
  { labelKey: 'maxRollover', getValue: (p) => p.rollover_max ? String(p.rollover_max) : p.allows_rollover ? '__unlimited__' : false, unlimitedKey: true },
  { labelKey: 'users', getValue: (p) => p.max_users },
  { labelKey: 'prioritySupport', getValue: (p) => p.priority_support },
  { labelKey: 'resinRecommendations', getValue: () => true },
  { labelKey: 'cementationProtocols', getValue: (p) => p.sort_order >= 1 },
  { labelKey: 'pdfExport', getValue: (p) => p.sort_order >= 1 },
  { labelKey: 'dedicatedSupport', getValue: (p) => p.sort_order >= 3 },
  { labelKey: 'personalOnboarding', getValue: (p) => p.sort_order >= 3 },
];

function CellValue({ value }: { value: string | boolean | number }) {
  if (typeof value === 'boolean') {
    return value ? (
      <>
        <Check className="h-4 w-4 text-success mx-auto" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PlanComparisonTable() {
  const { t } = useTranslation();
  const { plans, subscription } = useSubscription();

  if (plans.length === 0) return null;

  const popularPlanId = 'price_pro_monthly_v2';

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold font-display text-center">{t('components.pricing.comparison.title')}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-[200px]">{t('components.pricing.comparison.feature')}</TableHead>
            {plans.map((plan) => (
              <TableHead key={plan.id} scope="col" className="text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-semibold">{plan.name}</span>
                    {plan.id === popularPlanId && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">{t('components.pricing.comparison.popular')}</Badge>
                    )}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {plan.price_monthly === 0 ? t('components.pricing.card.free') : `${formatPrice(plan.price_monthly)}${t('components.pricing.card.perMonth')}`}
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {featureRows.map((feature) => (
            <TableRow key={feature.labelKey}>
              <TableCell className="font-medium text-sm">{t(`components.pricing.comparison.${feature.labelKey}`)}</TableCell>
              {plans.map((plan) => {
                const rawValue = feature.getValue(plan);
                const value = rawValue === '__unlimited__' ? t('components.pricing.comparison.unlimited') : rawValue;
                return (
                  <TableCell
                    key={plan.id}
                    className={cn(
                      'text-center',
                      subscription?.plan_id === plan.id && 'bg-primary/5',
                      plan.id === popularPlanId && !subscription?.plan_id && 'bg-primary/5'
                    )}
                  >
                    <CellValue value={value} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
