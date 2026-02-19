import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowRight } from 'lucide-react';
import { useSubscription, formatPrice } from '@/hooks/useSubscription';

// =============================================================================
// Props
// =============================================================================

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  invoice_pdf: string | null;
}

export interface PaymentHistorySectionProps {
  paymentRecords: PaymentRecord[] | undefined;
  isLoading: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function PaymentHistorySection({
  paymentRecords,
  isLoading,
}: PaymentHistorySectionProps) {
  const { t } = useTranslation();
  const { isFree } = useSubscription();

  const statusLabel: Record<string, string> = {
    succeeded: t('profile.statusPaid'),
    failed: t('profile.statusFailed'),
    pending: t('profile.statusPending'),
    refunded: t('profile.statusRefunded'),
  };

  const statusColor: Record<string, string> = {
    succeeded: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
    failed: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
    pending: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
    refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!paymentRecords || paymentRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold font-display mb-2">{t('profile.noInvoices')}</h3>
          <p className="text-sm text-muted-foreground">
            {isFree
              ? t('profile.noInvoicesFree')
              : t('profile.noInvoicesPaid')}
          </p>
          {isFree && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/pricing">
                {t('common.viewPlans')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">{t('profile.paymentHistory')}</CardTitle>
        <CardDescription>{t('profile.paymentCount', { count: paymentRecords.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paymentRecords.map((payment, index) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border shadow-sm animate-[fade-in-up_0.6s_ease-out_both]"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {formatPrice(payment.amount, payment.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    statusColor[payment.status] || 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {statusLabel[payment.status] || payment.status}
                </span>
                {payment.invoice_pdf && (
                  <a
                    href={payment.invoice_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
