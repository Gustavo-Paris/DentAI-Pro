import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { Coins, AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import type { CreditConfirmData } from '@/hooks/domain/wizard/types';

interface CreditConfirmDialogProps {
  data: CreditConfirmData | null;
  onConfirm: (confirmed: boolean) => void;
}

export function CreditConfirmDialog({ data, onConfirm }: CreditConfirmDialogProps) {
  const { t } = useTranslation();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (data && trackedRef.current !== data.operation) {
      trackEvent('credit_dialog_shown', { operation_type: data.operation });
      trackedRef.current = data.operation;
    }
    if (!data) trackedRef.current = null;
  }, [data]);

  if (!data) return null;

  const afterRemaining = data.remaining - data.cost;

  return (
    <PageConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          trackEvent('credit_cancelled');
          onConfirm(false);
        }
      }}
      title={t('components.creditConfirm.title')}
      icon={<Coins className="w-5 h-5 text-primary" />}
      confirmText={t('common.confirm')}
      cancelText={t('common.cancel')}
      onConfirm={() => {
        trackEvent('credit_confirmed', {
          operation_type: data.operation,
          credits_cost: data.cost,
        });
        onConfirm(true);
      }}
      onCancel={() => {
        trackEvent('credit_cancelled');
        onConfirm(false);
      }}
      hideIcon
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <strong>{data.operationLabel}</strong> {t('components.creditConfirm.willCost')}{' '}
          <strong>{t('components.creditConfirm.credit', { count: data.cost })}</strong>.
        </p>
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{t('components.creditConfirm.currentBalance')}</span>
          <span className="font-semibold">{data.remaining} {t('components.creditConfirm.credits')}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{t('components.creditConfirm.afterOperation')}</span>
          <span className={`font-semibold ${afterRemaining <= 1 ? 'text-destructive' : ''}`}>
            {afterRemaining} {t('components.creditConfirm.credits')}
          </span>
        </div>
        {afterRemaining <= 1 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm" role="alert">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-destructive font-medium">
              {t('components.creditConfirm.lowBalanceWarning')}
            </span>
          </div>
        )}
      </div>
    </PageConfirmDialog>
  );
}
