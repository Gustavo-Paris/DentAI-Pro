import { Badge } from '@parisgroup-ai/pageshell/primitives';
import { CheckCircle } from 'lucide-react';
import { getTreatmentConfig } from '@/lib/treatment-config';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import type { EvaluationItem } from '@/hooks/domain/useEvaluationDetail';

// Re-export for convenience so the page doesn't need a separate import
export { getProtocolFingerprint };

// =============================================================================
// Types
// =============================================================================

export interface EvalGroup {
  treatmentType: string;
  label: string;
  labelKey: string;
  resinName?: string;
  evaluations: EvaluationItem[];
}

// =============================================================================
// Presentation helpers
// =============================================================================

export function getTreatmentBadge(evaluation: EvaluationItem, t: (key: string) => string) {
  const config = getTreatmentConfig(evaluation.treatment_type);
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <IconComponent className="w-3 h-3" />
      <span className="hidden md:inline">{t(config.shortLabelKey)}</span>
    </Badge>
  );
}

export function getStatusBadge(
  evaluation: EvaluationItem,
  getChecklistProgress: (e: EvaluationItem) => { current: number; total: number },
  t: (key: string) => string,
) {
  if (evaluation.status === EVALUATION_STATUS.COMPLETED) {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5">
        <CheckCircle className="w-3 h-3" />
        <span className="hidden sm:inline">{t('toasts.evaluationDetail.statusCompleted')}</span>
      </Badge>
    );
  }

  const { current, total } = getChecklistProgress(evaluation);
  const hasChecklist = total > 0;

  return (
    <Badge variant="secondary" className="gap-1">
      <span className="hidden sm:inline">{t('toasts.evaluationDetail.statusPlanned')}</span>
      {hasChecklist && (
        <span className="text-muted-foreground">({current}/{total})</span>
      )}
    </Badge>
  );
}

// =============================================================================
// Grouping helper — groups evaluations by treatment type + identical protocol
// =============================================================================

export function groupByTreatment(evaluations: EvaluationItem[]): EvalGroup[] {
  const map = new Map<string, EvaluationItem[]>();
  for (const ev of evaluations) {
    // Use fingerprint for ALL treatment types (prevents cross-type collisions)
    const key = getProtocolFingerprint(ev);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const treatmentType = key.split('::')[0];
    const resinName = treatmentType === 'resina' && items[0]?.resins?.name
      ? items[0].resins.name
      : undefined;
    const config = getTreatmentConfig(treatmentType);
    return {
      treatmentType,
      label: config.shortLabel,
      labelKey: config.shortLabelKey,
      resinName,
      evaluations: items,
    };
  });
}
