/* eslint-disable react-refresh/only-export-components */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const typeColors: Record<string, { bg: string; text: string; i18nKey: string }> = {
  Esmalte: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', i18nKey: 'components.resinLegend.types.Esmalte' },
  Dentina: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', i18nKey: 'components.resinLegend.types.Dentina' },
  Body: { bg: 'bg-muted', text: 'text-muted-foreground', i18nKey: 'components.resinLegend.types.Body' },
  Opaco: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', i18nKey: 'components.resinLegend.types.Opaco' },
  Translúcido: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', i18nKey: 'components.resinLegend.types.Translúcido' },
  Universal: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', i18nKey: 'components.resinLegend.types.Universal' },
};

export function getTypeColorClasses(type: string): string {
  const colors = typeColors[type];
  if (colors) {
    return `${colors.bg} ${colors.text}`;
  }
  return 'bg-muted text-muted-foreground';
}

function ResinTypeLegendInner() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <span className="text-sm font-medium text-muted-foreground mr-1">{t('components.resinLegend.label')}</span>
      {Object.entries(typeColors).map(([type, colors]) => (
        <Badge
          key={type}
          variant="secondary"
          className={`${colors.bg} ${colors.text} border-0`}
        >
          {t(colors.i18nKey)}
        </Badge>
      ))}
    </div>
  );
}

export const ResinTypeLegend = memo(ResinTypeLegendInner);
