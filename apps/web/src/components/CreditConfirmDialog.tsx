import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    <AlertDialog open onOpenChange={(open) => { if (!open) { trackEvent('credit_cancelled'); onConfirm(false); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {t('components.creditConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong>{data.operationLabel}</strong> {t('components.creditConfirm.willCost')}{' '}
                <strong>{t('components.creditConfirm.credit', { count: data.cost })}</strong>.
              </p>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{t('components.creditConfirm.currentBalance')}</span>
                <span className="font-semibold">{data.remaining} {t('components.creditConfirm.credits')}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{t('components.creditConfirm.afterOperation')}</span>
                <span className={`font-semibold flex items-center gap-1 ${afterRemaining <= 1 ? 'text-destructive' : ''}`}>
                  {afterRemaining <= 1 && <AlertTriangle className="w-3.5 h-3.5 inline-block" />}
                  {afterRemaining} {t('components.creditConfirm.credits')}
                  {afterRemaining <= 1 && <span className="text-xs font-normal">({t('components.creditConfirm.lowBalance', { defaultValue: 'saldo baixo' })})</span>}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { trackEvent('credit_cancelled'); onConfirm(false); }}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => { trackEvent('credit_confirmed', { operation_type: data.operation, credits_cost: data.cost }); onConfirm(true); }}>
            {t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
