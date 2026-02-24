import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, CheckCircle, MoreHorizontal, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import type { EvaluationItem, ChecklistProgress } from '@/hooks/domain/useEvaluationDetail';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { getTreatmentConfig, formatToothLabel } from '@/lib/treatment-config';
import {
  getProtocolFingerprint,
  getTreatmentBadge,
  getStatusBadge,
  groupByTreatment,
} from '@/pages/EvaluationDetails.helpers';

// =============================================================================
// Props
// =============================================================================

export interface EvaluationCardsProps {
  evaluations: EvaluationItem[];
  sessionId: string;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  handleExportPDF: (id: string) => void;
  handleCompleteClick: (id: string) => void;
  handleRetryEvaluation?: (id: string) => Promise<void>;
  retryingEvaluationId?: string | null;
  getChecklistProgress: (evaluation: EvaluationItem) => ChecklistProgress;
}

// =============================================================================
// Component
// =============================================================================

export function EvaluationCards({
  evaluations,
  sessionId,
  selectedIds,
  toggleSelection,
  handleExportPDF,
  handleCompleteClick,
  handleRetryEvaluation,
  retryingEvaluationId,
  getChecklistProgress,
}: EvaluationCardsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="sm:hidden space-y-3">
      <h3 className="font-semibold font-display text-lg">{t('evaluation.generatedTreatments')}</h3>
      {groupByTreatment(evaluations).map((group, gi) => {
        const showGroupHeader = group.evaluations.length > 1;
        const groupTeeth = group.evaluations.map(e => e.tooth === 'GENGIVO' ? t('components.evaluationDetail.gingiva') : e.tooth).join(', ');
        return (
          <div key={`mgroup-${gi}`}>
            {showGroupHeader && (
              <div className="flex items-center justify-between px-2 py-2 mb-1 bg-muted/40 rounded-lg">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                    {t(group.labelKey)} — {t('components.evaluationDetail.teethCount', { count: group.evaluations.length, teeth: groupTeeth })}
                  </span>
                  {group.resinName && (
                    <span className="text-xs text-muted-foreground">
                      {t('evaluation.unifiedProtocol')} • {group.resinName}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate(`/result/group/${sessionId}/${encodeURIComponent(getProtocolFingerprint(group.evaluations[0]))}`)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {t('components.evaluationDetail.viewProtocol')}
                </Button>
              </div>
            )}
            {group.evaluations.map((evaluation) => {
              const treatmentConfig = getTreatmentConfig(evaluation.treatment_type);
              const borderColor = treatmentConfig.variant === 'default' ? 'border-l-primary' : 'border-l-amber-500';
              const isGrouped = showGroupHeader;
              return (
              <Card
                key={evaluation.id}
                className={`shadow-sm rounded-xl border-l-[3px] ${borderColor} cursor-pointer hover:shadow-md transition-shadow mb-2 ${isGrouped ? 'ml-3 border-l-2 p-3' : 'p-4'}`}
                onClick={() => navigate(`/result/${evaluation.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(evaluation.id)}
                        onCheckedChange={() => toggleSelection(evaluation.id)}
                      />
                    </div>
                    {!isGrouped && getTreatmentBadge(evaluation, t)}
                    <p className={isGrouped ? 'font-medium text-sm' : 'font-semibold'}>{formatToothLabel(evaluation.tooth)}</p>
                  </div>
                  {getStatusBadge(evaluation, getChecklistProgress, t)}
                </div>

                {!isGrouped && evaluation.treatment_type === 'resina' && evaluation.resins && (
                  <div className="mb-3 p-2 bg-muted/50 rounded">
                    <p className="text-sm font-medium">{evaluation.resins.name}</p>
                    <p className="text-xs text-muted-foreground">{evaluation.resins.manufacturer}</p>
                  </div>
                )}

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" aria-label={t('components.evaluationDetail.moreOptions')}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {evaluation.status === EVALUATION_STATUS.ERROR && handleRetryEvaluation && (
                        <DropdownMenuItem
                          onClick={() => handleRetryEvaluation(evaluation.id)}
                          disabled={retryingEvaluationId === evaluation.id}
                        >
                          {retryingEvaluationId === evaluation.id
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <RefreshCw className="w-4 h-4 mr-2" />}
                          {t('evaluation.retryProtocol', { defaultValue: 'Reprocessar protocolo' })}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleExportPDF(evaluation.id)}>
                        <FileDown className="w-4 h-4 mr-2" />
                        {t('common.exportPDF')}
                      </DropdownMenuItem>
                      {evaluation.status !== EVALUATION_STATUS.COMPLETED && (
                        <DropdownMenuItem onClick={() => handleCompleteClick(evaluation.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('common.markAsCompleted')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
