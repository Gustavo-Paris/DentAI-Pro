import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

type PaymentMethod = 'card' | 'pix';

export function CreditPackSection() {
  const {
    creditPacks,
    purchasePack,
    isPurchasingPack,
    isActive,
  } = useSubscription();
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  if (!isActive || creditPacks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">{t('components.pricing.creditPack.title')}</CardTitle>
        <CardDescription>
          {t('components.pricing.creditPack.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment method selector */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                paymentMethod === 'card'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CreditCard className="w-4 h-4" />
              {t('components.pricing.pix.card')}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                paymentMethod === 'pix'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-success text-success-foreground text-[10px] font-bold leading-none">P</span>
              {t('components.pricing.pix.label')}
            </button>
          </div>
          {paymentMethod === 'pix' && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {t('components.pricing.pix.badge')}
            </span>
          )}
        </div>

        {paymentMethod === 'pix' && (
          <p className="text-xs text-muted-foreground">
            {t('components.pricing.pix.note')}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center"
            >
              <span className="text-2xl font-bold font-display">{pack.credits}</span>
              <span className="text-sm text-muted-foreground">{t('components.pricing.creditPack.credits')}</span>
              <span className="text-lg font-semibold">{formatPrice(pack.price)}</span>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1"
                disabled={isPurchasingPack}
                onClick={() => purchasePack(pack.id, paymentMethod)}
              >
                {isPurchasingPack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('components.pricing.creditPack.buy')}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
