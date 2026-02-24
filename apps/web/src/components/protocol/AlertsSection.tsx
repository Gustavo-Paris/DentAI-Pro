import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from "lucide-react";

interface AlertsSectionProps {
  alerts: string[];
}

function AlertsSection({ alerts }: AlertsSectionProps) {
  const { t } = useTranslation();
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h4 className="font-medium text-warning">{t('components.protocol.alerts.title')}</h4>
      </div>
      <ul className="space-y-2">
        {alerts.map((alert, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-warning mt-1">•</span>
            <span className="text-warning/80">{alert}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(AlertsSection);
