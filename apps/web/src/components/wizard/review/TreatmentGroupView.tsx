import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@parisgroup-ai/pageshell/primitives';
import { cn } from '@/lib/utils';
import type { TreatmentType, DetectedTooth } from '@/types/wizard';
import { TREATMENT_LABEL_KEYS, TREATMENT_BORDER_COLORS } from './review-constants';

interface TreatmentGroupViewProps {
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  detectedTeeth: DetectedTooth[];
}

export function TreatmentGroupView({
  selectedTeeth,
  toothTreatments,
  detectedTeeth,
}: TreatmentGroupViewProps) {
  const { t } = useTranslation();

  const realSelectedTeeth = selectedTeeth.filter(st => st !== 'GENGIVO');

  const groups = useMemo(() => {
    const map = new Map<TreatmentType, { tooth: string; reason?: string }[]>();
    for (const tooth of realSelectedTeeth) {
      const detected = detectedTeeth.find(dt => dt.tooth === tooth);
      const treatment = toothTreatments[tooth]
        || detected?.treatment_indication
        || 'resina';
      const list = map.get(treatment) || [];
      list.push({ tooth, reason: detected?.indication_reason });
      map.set(treatment, list);
    }
    return Array.from(map.entries());
  }, [realSelectedTeeth, toothTreatments, detectedTeeth]);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t('components.wizard.review.noTeethSelected')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([treatment, teeth]) => {
        const borderColor = TREATMENT_BORDER_COLORS[treatment] || 'border-l-primary';
        return (
          <div
            key={treatment}
            className={cn(
              'border rounded-lg border-l-4 p-4',
              borderColor,
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">
                {t(TREATMENT_LABEL_KEYS[treatment] || `treatments.${treatment}.label`)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {t('components.wizard.review.treatmentGroup', { count: teeth.length })}
              </Badge>
            </div>
            <div className="space-y-2">
              {teeth.map(({ tooth, reason }) => (
                <div key={tooth} className="flex items-baseline gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {t('components.wizard.review.tooth', { number: tooth })}
                  </Badge>
                  {reason && (
                    <span className="text-xs text-muted-foreground truncate">{reason}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
