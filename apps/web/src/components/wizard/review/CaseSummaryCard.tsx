import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateAge } from '@/lib/dateUtils';
import { calculateComplexity } from '@/lib/complexity-score';
import type { DetectedTooth, TreatmentType, ReviewFormData } from '../ReviewAnalysisStep';

interface CaseSummaryCardProps {
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  detectedTeeth: DetectedTooth[];
  formData: ReviewFormData;
  patientBirthDate?: string | null;
}

export const CaseSummaryCard = memo(function CaseSummaryCard({
  selectedTeeth,
  toothTreatments,
  detectedTeeth,
  formData,
  patientBirthDate,
}: CaseSummaryCardProps) {
  const { t } = useTranslation();

  const realSelectedTeeth = selectedTeeth.filter(st => st !== 'GENGIVO');
  const hasGengivoplasty = selectedTeeth.includes('GENGIVO');

  const treatmentBreakdown = (() => {
    const counts: Record<TreatmentType, number> = {
      resina: 0, porcelana: 0, coroa: 0, implante: 0, endodontia: 0, encaminhamento: 0, gengivoplastia: 0, recobrimento_radicular: 0,
    };
    for (const tooth of realSelectedTeeth) {
      const treatment = toothTreatments[tooth] || detectedTeeth.find(dt => dt.tooth === tooth)?.treatment_indication || 'resina';
      counts[treatment]++;
    }
    if (hasGengivoplasty) counts.gengivoplastia = 1;
    return Object.entries(counts).filter(([, count]) => count > 0) as [TreatmentType, number][];
  })();

  const complexity = calculateComplexity(detectedTeeth.filter(dt => selectedTeeth.includes(dt.tooth)));

  if (selectedTeeth.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 space-y-3 ai-glow">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary ai-dot" />
        {t('components.wizard.review.caseSummary')}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">{t('components.wizard.review.teethLabel')}</p>
          <p className="font-semibold text-primary">{realSelectedTeeth.length}{hasGengivoplasty ? t('components.wizard.review.plusGengivo') : ''}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('components.wizard.review.typesLabel')}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {treatmentBreakdown.map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[10px] font-normal">
                {count} {type === 'resina' ? t('components.wizard.review.typeResina') : type === 'porcelana' ? t('components.wizard.review.typeFaceta') : type === 'coroa' ? t('components.wizard.review.typeCoroa') : type}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('components.wizard.review.patientLabel')}</p>
          <p className="font-medium text-sm truncate">
            {formData.patientName || t('components.wizard.review.notInformed')}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('components.wizard.review.ageLabel')}</p>
          <p className="font-medium text-sm">
            {patientBirthDate ? t('components.wizard.review.yearsOld', { age: calculateAge(patientBirthDate) }) : '—'}
          </p>
        </div>
        {detectedTeeth.length > 0 && (
          <div>
            <p className="text-muted-foreground text-xs">{t('components.wizard.review.complexityLabel')}</p>
            <Badge
              variant="outline"
              className={cn(
                'mt-0.5 gap-1',
                complexity.level === 'simples' && 'border-success text-success',
                complexity.level === 'moderado' && 'border-warning text-warning',
                complexity.level === 'complexo' && 'border-destructive text-destructive',
              )}
            >
              {complexity.level === 'simples' && <ShieldCheck className="w-3 h-3" />}
              {complexity.level === 'moderado' && <Shield className="w-3 h-3" />}
              {complexity.level === 'complexo' && <ShieldAlert className="w-3 h-3" />}
              {complexity.level === 'simples' ? t('components.wizard.review.simple') : complexity.level === 'moderado' ? t('components.wizard.review.moderate') : t('components.wizard.review.complex')}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
});
