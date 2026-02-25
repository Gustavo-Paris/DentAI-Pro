/* eslint-disable react-refresh/only-export-components */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const typeColors: Record<string, { bg: string; text: string; i18nKey: string }> = {
  Esmalte: { bg: 'bg-[rgb(var(--layer-esmalte-rgb)/0.15)] dark:bg-[rgb(var(--layer-esmalte-rgb)/0.1)]', text: 'text-[rgb(var(--layer-esmalte-rgb))]', i18nKey: 'components.resinLegend.types.Esmalte' },
  Dentina: { bg: 'bg-[rgb(var(--layer-dentina-rgb)/0.15)] dark:bg-[rgb(var(--layer-dentina-rgb)/0.1)]', text: 'text-[rgb(var(--layer-dentina-rgb))]', i18nKey: 'components.resinLegend.types.Dentina' },
  Body: { bg: 'bg-muted', text: 'text-muted-foreground', i18nKey: 'components.resinLegend.types.Body' },
  Opaco: { bg: 'bg-[rgb(var(--layer-opaco-rgb)/0.15)] dark:bg-[rgb(var(--layer-opaco-rgb)/0.1)]', text: 'text-[rgb(var(--layer-opaco-rgb))]', i18nKey: 'components.resinLegend.types.Opaco' },
  Translúcido: { bg: 'bg-[rgb(var(--layer-translucido-rgb)/0.15)] dark:bg-[rgb(var(--layer-translucido-rgb)/0.1)]', text: 'text-[rgb(var(--layer-translucido-rgb))]', i18nKey: 'components.resinLegend.types.Translúcido' },
  Universal: { bg: 'bg-[rgb(var(--layer-default-rgb)/0.15)] dark:bg-[rgb(var(--layer-default-rgb)/0.1)]', text: 'text-[rgb(var(--layer-default-rgb))]', i18nKey: 'components.resinLegend.types.Universal' },
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
