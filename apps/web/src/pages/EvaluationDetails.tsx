import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  CheckCircle,
  Calendar,
  User,
  Image as ImageIcon,
  Plus,
  Share2,
  Loader2 as ShareLoader,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

import { DetailPage } from '@parisgroup-ai/pageshell/composites';
import { trackEvent } from '@/lib/analytics';
import { useEvaluationDetail } from '@/hooks/domain/useEvaluationDetail';
import { Progress } from '@/components/ui/progress';
const AddTeethModal = lazy(() => import('@/components/AddTeethModal'));
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';
const DSDPreviewModal = lazy(() => import('@/components/DSDPreviewModal'));
import { formatToothLabel } from '@/lib/treatment-config';
import { EvaluationTable } from '@/components/evaluation/EvaluationTable';
import { EvaluationCards } from '@/components/evaluation/EvaluationCards';

// Helpers, grouping logic, and getProtocolFingerprint imported from EvaluationDetails.helpers.tsx

// =============================================================================
// Page Adapter
// =============================================================================

export default function EvaluationDetails() {
  const { t } = useTranslation();
  const detail = useEvaluationDetail();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    evaluationId: string;
    current: number;
    total: number;
  }>({ open: false, evaluationId: '', current: 0, total: 0 });
  const [showDSD, setShowDSD] = useState(false);

  const firstEval = detail.evaluations[0];
  const hasDSD = !!(firstEval?.dsd_simulation_url || firstEval?.dsd_simulation_layers?.length);

  // Track evaluation_viewed when session loads
  useEffect(() => {
    if (detail.sessionId && detail.evaluations.length > 0) {
      trackEvent('evaluation_viewed', { evaluation_id: detail.sessionId });
    }
  }, [detail.sessionId, detail.evaluations.length]);

  const handleCompleteClick = (id: string) => {
    const result = detail.handleMarkAsCompleted(id);
    if (result?.pending) {
      setConfirmDialog({ open: true, evaluationId: id, current: result.current, total: result.total });
    }
  };

  const handleConfirmComplete = () => {
    detail.handleMarkAsCompleted(confirmDialog.evaluationId, true);
    setConfirmDialog({ open: false, evaluationId: '', current: 0, total: 0 });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DetailPage
        title={detail.patientName}
        breadcrumbs={[
          { label: t('evaluation.title'), href: '/evaluations' },
          { label: detail.patientName },
        ]}
        query={{ data: detail.evaluations, isLoading: detail.isLoading }}
        headerActions={[
          {
            label: t('evaluation.newEvaluation'),
            icon: Sparkles,
            onClick: () => navigate('/new-case'),
            variant: 'default',
          },
          {
            label: t('evaluation.share'),
            icon: detail.isSharing ? ShareLoader : Share2,
            onClick: detail.handleShareCase,
            disabled: detail.isSharing,
            variant: 'outline',
          },
          ...(detail.pendingTeeth.length > 0
            ? [{
                label: t('evaluation.addMoreTeeth', { count: detail.pendingTeeth.length }),
                icon: Plus,
                onClick: () => detail.setShowAddTeethModal(true),
                variant: 'outline' as const,
              }]
            : []),
          {
            label: t('evaluation.markAllCompleted'),
            icon: CheckCircle,
            onClick: detail.handleMarkAllAsCompleted,
            disabled: detail.completedCount === detail.evaluations.length,
            variant: 'outline',
          },
        ]}
        slots={{
          beforeContent: (
            <Card className="mb-4 sm:mb-6 shadow-sm rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                    {firstEval?.photo_frontal ? (
                      <div
                        className={`relative w-full md:w-32 lg:w-48 h-32 sm:h-48 flex-shrink-0 group ${hasDSD ? 'cursor-pointer' : ''}`}
                        onClick={hasDSD ? () => setShowDSD(true) : undefined}
                      >
                        <ClinicalPhotoThumbnail
                          path={firstEval.photo_frontal}
                          alt={t('evaluation.clinicalPhoto')}
                          size="grid"
                          className="w-full h-full"
                        />
                        {hasDSD && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/90 px-2 py-1 rounded-full text-xs font-medium">
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              {t('components.evaluationDetail.viewDSD')}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full md:w-32 lg:w-48 h-32 sm:h-48 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-8 sm:w-12 h-8 sm:h-12 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{detail.evaluationDate}</span>
                          <span className="sm:hidden">{detail.evaluationDateShort}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          {detail.evaluations.length} {t('evaluation.teeth')}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {detail.evaluations.map((e) => (
                          <Badge key={e.id} variant="outline" className="text-xs">
                            {formatToothLabel(e.tooth)}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{t('evaluation.progress')}</span>
                        <Progress
                          value={detail.evaluations.length > 0 ? (detail.completedCount / detail.evaluations.length) * 100 : 0}
                          className="h-2 flex-1 max-w-[200px]"
                        />
                        <span className="font-medium text-xs tabular-nums">
                          {detail.completedCount}/{detail.evaluations.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ),
        }}
      >
        {() => (
          <>
            {/* Floating selection bar */}
            {detail.selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                <span className="text-sm font-medium">{t('common.selected', { count: detail.selectedIds.size })}</span>
                <Button
                  size="sm"
                  onClick={() => detail.handleBulkComplete(Array.from(detail.selectedIds))}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('common.finish')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={detail.clearSelection}
                  aria-label={t('common.clearSelection', { defaultValue: 'Limpar selecao' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Cases Table - Desktop */}
            <EvaluationTable
              evaluations={detail.evaluations}
              sessionId={detail.sessionId}
              selectedIds={detail.selectedIds}
              toggleSelection={detail.toggleSelection}
              toggleSelectAll={detail.toggleSelectAll}
              handleExportPDF={detail.handleExportPDF}
              handleCompleteClick={handleCompleteClick}
              isChecklistComplete={detail.isChecklistComplete}
              getChecklistProgress={detail.getChecklistProgress}
            />

            {/* Cases Cards - Mobile */}
            <EvaluationCards
              evaluations={detail.evaluations}
              sessionId={detail.sessionId}
              selectedIds={detail.selectedIds}
              toggleSelection={detail.toggleSelection}
              handleExportPDF={detail.handleExportPDF}
              handleCompleteClick={handleCompleteClick}
              getChecklistProgress={detail.getChecklistProgress}
            />
          </>
        )}
      </DetailPage>
      </div>

      {/* Add Teeth Modal */}
      {detail.evaluations.length > 0 && (
        <Suspense fallback={null}>
          <AddTeethModal
            open={detail.showAddTeethModal}
            onClose={() => detail.setShowAddTeethModal(false)}
            pendingTeeth={detail.pendingTeeth}
            onSubmitTeeth={detail.handleSubmitTeeth}
          />
        </Suspense>
      )}

      {/* DSD Preview Modal */}
      {hasDSD && (
        <Suspense fallback={null}>
          <DSDPreviewModal
            open={showDSD}
            onOpenChange={setShowDSD}
            photoPath={firstEval?.photo_frontal ?? null}
            simulationPath={firstEval?.dsd_simulation_url ?? null}
            layers={firstEval?.dsd_simulation_layers}
          />
        </Suspense>
      )}

      {/* Confirm completion with incomplete checklist */}
      <PageConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, evaluationId: '', current: 0, total: 0 });
        }}
        title={t('evaluation.incompleteChecklistTitle')}
        description={t('evaluation.incompleteChecklistDescription', { current: confirmDialog.current, total: confirmDialog.total })}
        confirmText={t('evaluation.finishAnyway')}
        cancelText={t('common.cancel')}
        onConfirm={handleConfirmComplete}
        variant="warning"
      />
    </>
  );
}
