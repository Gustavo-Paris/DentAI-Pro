import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@parisgroup-ai/pageshell/primitives';
import { AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * Banner displayed when subscription payment is past_due or unpaid.
 * past_due = warning (yellow), unpaid = error (red/destructive).
 * Includes CTA to open Stripe billing portal.
 */
export function PaymentWarningBanner() {
  const { t } = useTranslation();
  const { subscription, openPortal, isOpeningPortal } = useSubscription();

  const status = subscription?.status;

  if (status !== 'past_due' && status !== 'unpaid') return null;

  const isPastDue = status === 'past_due';

  return (
    <Alert
      className={
        isPastDue
          ? 'border-warning/50 bg-warning/10'
          : 'border-destructive/50 bg-destructive/10'
      }
    >
      {isPastDue ? (
        <AlertTriangle className="h-5 w-5 text-warning" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
      <AlertTitle className={isPastDue ? 'text-warning' : 'text-destructive'}>
        {t(isPastDue ? 'billing.pastDue.title' : 'billing.unpaid.title')}
      </AlertTitle>
      <AlertDescription
        className={`${isPastDue ? 'text-warning/90' : 'text-destructive/90'} mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <span className="text-sm">
          {t(isPastDue ? 'billing.pastDue.message' : 'billing.unpaid.message')}
        </span>
        <Button
          variant={isPastDue ? 'outline' : 'destructive'}
          size="sm"
          className="shrink-0"
          onClick={() => openPortal()}
          disabled={isOpeningPortal}
        >
          {isOpeningPortal ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {t(isPastDue ? 'billing.pastDue.action' : 'billing.unpaid.action')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
