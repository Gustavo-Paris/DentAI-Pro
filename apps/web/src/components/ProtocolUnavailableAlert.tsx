import { useTranslation } from 'react-i18next';
import { Card, CardContent, Button } from '@parisgroup-ai/pageshell/primitives';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ProtocolUnavailableAlertProps {
  onReprocess: () => void;
  className?: string;
}

export function ProtocolUnavailableAlert({ onReprocess, className }: ProtocolUnavailableAlertProps) {
  const { t } = useTranslation();

  return (
    <section className={className ?? 'mb-8'}>
      <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {t('result.protocolUnavailable')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('result.protocolUnavailableDesc')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onReprocess}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                {t('result.reprocess')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
