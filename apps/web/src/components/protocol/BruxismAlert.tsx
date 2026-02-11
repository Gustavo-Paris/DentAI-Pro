import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Moon } from 'lucide-react';

interface BruxismAlertProps {
  show: boolean;
  treatmentType?: string;
}

export function BruxismAlert({ show, treatmentType = 'resina' }: BruxismAlertProps) {
  const { t } = useTranslation();
  if (!show) return null;

  const isPorcelain = treatmentType === 'porcelana';

  return (
    <Alert className="border-warning/50 bg-warning/10">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning flex items-center gap-2">
        {t('components.protocol.bruxismAlert.title')}
        <Badge variant="outline" className="text-xs border-warning/50 text-warning">
          {t('components.protocol.bruxismAlert.attention')}
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-warning/90 mt-3 space-y-3">
        {/* Key Recommendations */}
        <div className="grid gap-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>{t('components.protocol.bruxismAlert.prioritizeResins')}</strong>
              {isPorcelain
                ? t('components.protocol.bruxismAlert.ceramicNote')
                : t('components.protocol.bruxismAlert.resinNote')
              }
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>{t('components.protocol.bruxismAlert.reduceEnamel')}</strong>{t('components.protocol.bruxismAlert.reduceEnamelNote')}
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Moon className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>{t('components.protocol.bruxismAlert.nightGuard')}</strong>{t('components.protocol.bruxismAlert.nightGuardNote')}
            </span>
          </div>
        </div>

        {/* Warning Box */}
        <div className="p-2.5 bg-warning/20 rounded-md">
          <p className="text-xs font-medium text-warning">
            {t('components.protocol.bruxismAlert.warningBox')}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default BruxismAlert;
