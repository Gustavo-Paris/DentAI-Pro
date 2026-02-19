import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  CheckCircle,
  Plus,
  Share2,
  Loader2 as ShareLoader,
  X,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { DetailPage } from '@parisgroup-ai/pageshell/composites';
import { trackEvent } from '@/lib/analytics';
import { useEvaluationDetail } from '@/hooks/domain/useEvaluationDetail';
const AddTeethModal = lazy(() => import('@/components/AddTeethModal'));
const DSDPreviewModal = lazy(() => import('@/components/DSDPreviewModal'));
import { EvaluationTable } from '@/components/evaluation/EvaluationTable';
import { EvaluationCards } from '@/components/evaluation/EvaluationCards';
import { SessionHeaderCard } from '@/components/evaluation/SessionHeaderCard';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      <DetailPage
        className="max-w-5xl mx-auto"
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
          {
            label: t('evaluation.deleteSession'),
            icon: Trash2,
            onClick: () => setShowDeleteDialog(true),
            variant: 'ghost',
          },
        ]}
        slots={{
          beforeContent: (
            <SessionHeaderCard
              photoPath={firstEval?.photo_frontal}
              patientName={detail.patientName}
              evaluationDate={detail.evaluationDate}
              evaluationDateShort={detail.evaluationDateShort}
              teeth={detail.evaluations}
              completedCount={detail.completedCount}
              evaluationCount={detail.evaluations.length}
              hasDSD={hasDSD}
              onPhotoClick={() => setShowDSD(true)}
            />
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

      {/* Confirm session deletion */}
      <PageConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('evaluation.deleteSessionTitle')}
        description={t('evaluation.deleteSessionDescription', { count: detail.evaluations.length })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          setShowDeleteDialog(false);
          detail.handleDeleteSession();
        }}
        variant="destructive"
      />
    </>
  );
}
