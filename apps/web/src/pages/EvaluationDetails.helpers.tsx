import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { getTreatmentConfig } from '@/lib/treatment-config';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';
import type { EvaluationItem } from '@/hooks/domain/useEvaluationDetail';

// Re-export for convenience so the page doesn't need a separate import
export { getProtocolFingerprint };

// =============================================================================
// Types
// =============================================================================

export interface EvalGroup {
  treatmentType: string;
  label: string;
  resinName?: string;
  evaluations: EvaluationItem[];
}

// =============================================================================
// Presentation helpers
// =============================================================================

export function getTreatmentBadge(evaluation: EvaluationItem) {
  const config = getTreatmentConfig(evaluation.treatment_type);
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <IconComponent className="w-3 h-3" />
      <span className="hidden md:inline">{config.shortLabel}</span>
    </Badge>
  );
}

export function getStatusBadge(
  evaluation: EvaluationItem,
  getChecklistProgress: (e: EvaluationItem) => { current: number; total: number },
  t: (key: string) => string,
) {
  if (evaluation.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        <CheckCircle className="w-3 h-3" />
        <span className="hidden sm:inline">{t('toasts.evaluationDetail.statusCompleted')}</span>
      </span>
    );
  }

  const { current, total } = getChecklistProgress(evaluation);
  const hasChecklist = total > 0;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
      <span className="hidden sm:inline">{t('toasts.evaluationDetail.statusPlanned')}</span>
      {hasChecklist && (
        <span className="text-muted-foreground">({current}/{total})</span>
      )}
    </span>
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
    return {
      treatmentType,
      label: getTreatmentConfig(treatmentType).shortLabel,
      resinName,
      evaluations: items,
    };
  });
}
