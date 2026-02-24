import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileDown, CheckCircle, MoreHorizontal, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import type { EvaluationItem, ChecklistProgress } from '@/hooks/domain/useEvaluationDetail';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import type { EvalGroup } from '@/pages/EvaluationDetails.helpers';
import {
  getProtocolFingerprint,
  getTreatmentBadge,
  getStatusBadge,
  groupByTreatment,
} from '@/pages/EvaluationDetails.helpers';

// =============================================================================
// Props
// =============================================================================

export interface EvaluationTableProps {
  evaluations: EvaluationItem[];
  sessionId: string;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  handleExportPDF: (id: string) => void;
  handleCompleteClick: (id: string) => void;
  handleRetryEvaluation?: (id: string) => Promise<void>;
  retryingEvaluationId?: string | null;
  isChecklistComplete: (evaluation: EvaluationItem) => boolean;
  getChecklistProgress: (evaluation: EvaluationItem) => ChecklistProgress;
}

// =============================================================================
// Component
// =============================================================================

export function EvaluationTable({
  evaluations,
  sessionId,
  selectedIds,
  toggleSelection,
  toggleSelectAll,
  handleExportPDF,
  handleCompleteClick,
  handleRetryEvaluation,
  retryingEvaluationId,
  isChecklistComplete,
  getChecklistProgress,
}: EvaluationTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="hidden sm:block shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg font-display">{t('evaluation.generatedTreatments')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.size === evaluations.length && evaluations.length > 0}
                  onCheckedChange={() => toggleSelectAll()}
                />
              </TableHead>
              <TableHead>{t('evaluation.tooth')}</TableHead>
              <TableHead>{t('evaluation.treatment')}</TableHead>
              <TableHead>{t('evaluation.status')}</TableHead>
              <TableHead className="text-right">{t('evaluation.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupByTreatment(evaluations).map((group, gi) => {
              const showGroupHeader = group.evaluations.length > 1;
              const groupTeeth = group.evaluations.map(e => e.tooth === 'GENGIVO' ? t('components.evaluationDetail.gingiva') : e.tooth).join(', ');
              const groupIds = group.evaluations.map(e => e.id);
              const allSelected = groupIds.every(id => selectedIds.has(id));
              return [
                showGroupHeader && (
                  <TableRow key={`group-${gi}`} className="bg-muted/40 border-t">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => {
                          for (const id of groupIds) {
                            if (allSelected || !selectedIds.has(id)) {
                              toggleSelection(id);
                            }
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell colSpan={3} className="py-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t(group.labelKey)} — {t('components.evaluationDetail.teethCount', { count: group.evaluations.length, teeth: groupTeeth })}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({group.resinName
                          ? `${t('evaluation.unifiedProtocol')} • ${group.resinName}`
                          : t('evaluation.sameProtocol')})
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => navigate(`/result/group/${sessionId}/${encodeURIComponent(getProtocolFingerprint(group.evaluations[0]))}`)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t('evaluation.viewProtocol')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
                ...(!showGroupHeader ? group.evaluations.map((evaluation) => (
                  <TableRow
                    key={evaluation.id}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/result/${evaluation.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/result/${evaluation.id}`);
                      }
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(evaluation.id)}
                        onCheckedChange={() => toggleSelection(evaluation.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{evaluation.tooth === 'GENGIVO' ? t('components.evaluationDetail.gingiva') : evaluation.tooth}</TableCell>
                    <TableCell>{getTreatmentBadge(evaluation, t)}</TableCell>
                    <TableCell>
                      {getStatusBadge(evaluation, getChecklistProgress, t)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t('components.evaluationDetail.moreOptions')}>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() => handleCompleteClick(evaluation.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {t('common.markAsCompleted')}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              {!isChecklistComplete(evaluation) && (
                                <TooltipContent>
                                  {t('evaluation.checklistItems', { current: getChecklistProgress(evaluation).current, total: getChecklistProgress(evaluation).total })}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : []),
              ];
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
