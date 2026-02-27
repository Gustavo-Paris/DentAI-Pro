import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  CheckCircle,
  Plus,
  Share2,
  Loader2,
  X,
  Sparkles,
  Trash2,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { TipBanner } from '@/components/TipBanner';

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
  useDocumentTitle(t('pageTitle.evaluationDetails'));
  const detail = useEvaluationDetail();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    evaluationId: string;
    current: number;
    total: number;
  }>({ open: false, evaluationId: '', current: 0, total: 0 });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);
  const [showDSD, setShowDSD] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const firstEval = detail.evaluations[0];
  const hasDSD = !!(firstEval?.dsd_simulation_url || firstEval?.dsd_simulation_layers?.length);

  // Budget regeneration — show button to switch to opposite tier
  const currentBudget = firstEval?.budget || 'padrão';
  const targetBudget = currentBudget === 'premium' ? 'padrão' : 'premium';
  const targetLabel = targetBudget === 'premium'
    ? t('evaluation.regenerateAsPremium')
    : t('evaluation.regenerateAsPadrao');

  // Track evaluation_viewed when session loads
  useEffect(() => {
    if (detail.sessionId && detail.evaluations.length > 0) {
      trackEvent('evaluation_viewed', { evaluation_id: detail.sessionId });
    }
  }, [detail.sessionId, detail.evaluations.length]);

  // Escape key dismisses floating selection bar
  useEffect(() => {
    if (detail.selectedIds.size === 0) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        detail.clearSelection();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detail.selectedIds.size, detail.clearSelection]);

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

  // Empty state guard — hook already redirects to /dashboard, but show fallback while that happens
  if (!detail.isLoading && detail.evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">{t('evaluation.noEvaluationsFound')}</p>
        <Button variant="outline" onClick={() => navigate('/evaluations')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative section-glow-bg overflow-hidden">
        {/* Ambient AI grid overlay */}
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
      <DetailPage
        className="relative z-10 max-w-5xl mx-auto"
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
            className: 'btn-glow',
          },
          {
            label: detail.isRegenerating
              ? t('evaluation.regenerating')
              : targetLabel,
            icon: detail.isRegenerating ? Loader2 : RefreshCw,
            onClick: () => setShowRegenerateDialog(true),
            disabled: detail.isRegenerating,
            variant: 'outline' as const,
            className: 'btn-glow',
          },
        ]}
      >
        {() => (
          <>
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
            <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={detail.handleShareCase}
                disabled={detail.isSharing}
              >
                {detail.isSharing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Share2 className="w-4 h-4 mr-1.5" />}
                {t('evaluation.share')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={detail.handleShareWhatsApp}
                disabled={detail.isSharing}
              >
                {detail.isSharing ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                )}
                WhatsApp
              </Button>
              {detail.pendingTeeth.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => detail.setShowAddTeethModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t('evaluation.addMoreTeeth', { count: detail.pendingTeeth.length })}
                </Button>
              )}
              {detail.completedCount < detail.evaluations.length && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => setShowMarkAllConfirm(true)}
                  disabled={isMarkingAll}
                >
                  {isMarkingAll ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                  {t('evaluation.markAllCompleted')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                {t('evaluation.deleteSession')}
              </Button>
            </div>

            {/* floating selection bar — below modal z-50 */}
            {detail.selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-background border shadow-lg rounded-full px-4 py-2 pb-[env(safe-area-inset-bottom)] flex items-center gap-3 animate-in slide-in-from-bottom-4">
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
                  aria-label={t('common.clearSelection')}
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
              handleRetryEvaluation={detail.handleRetryEvaluation}
              retryingEvaluationId={detail.retryingEvaluationId}
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
              handleRetryEvaluation={detail.handleRetryEvaluation}
              retryingEvaluationId={detail.retryingEvaluationId}
              getChecklistProgress={detail.getChecklistProgress}
            />

            {/* Tip: add more teeth when evaluation is sparse */}
            {detail.evaluations.length <= 3 && detail.pendingTeeth.length > 0 && (
              <TipBanner
                className="mt-4"
                icon={Lightbulb}
                title={t('evaluation.tipAddMoreTitle')}
                description={t('evaluation.tipAddMoreDescription', {
                  count: detail.pendingTeeth.length,
                  })}
                action={{
                  label: t('evaluation.addMoreTeeth', { count: detail.pendingTeeth.length }),
                  icon: Plus,
                  onClick: () => detail.setShowAddTeethModal(true),
                }}
              />
            )}

            {/* Tip: start new case when evaluation is sparse and no pending teeth */}
            {detail.evaluations.length <= 2 && detail.pendingTeeth.length === 0 && (
              <TipBanner
                className="mt-4"
                variant="muted"
                icon={Sparkles}
                title={t('evaluation.tipNewCaseTitle')}
                description={t('evaluation.tipNewCaseDescription')}
                action={{
                  label: t('evaluation.newEvaluation'),
                  icon: Sparkles,
                  onClick: () => navigate('/new-case'),
                }}
              />
            )}
          </>
        )}
      </DetailPage>
      </div>{/* /section-glow-bg */}

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

      {/* Confirm mark all as completed */}
      <PageConfirmDialog
        open={showMarkAllConfirm}
        onOpenChange={setShowMarkAllConfirm}
        title={t('evaluation.markAllCompletedTitle')}
        description={t('evaluation.markAllCompletedDescription')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onConfirm={async () => {
          setShowMarkAllConfirm(false);
          setIsMarkingAll(true);
          try { await detail.handleMarkAllAsCompleted(); } finally { setIsMarkingAll(false); }
        }}
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
        onConfirm={async () => {
          setShowDeleteDialog(false);
          setIsDeleting(true);
          try { await detail.handleDeleteSession(); } finally { setIsDeleting(false); }
        }}
        variant="destructive"
      />

      {/* Confirm protocol regeneration */}
      <PageConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title={t('evaluation.regenerateTitle')}
        description={t('evaluation.regenerateDescription', {
          })}
        confirmText={t('evaluation.regenerateConfirm')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          setShowRegenerateDialog(false);
          detail.handleRegenerateWithBudget(targetBudget as 'padrão' | 'premium');
        }}
        variant="warning"
      />
    </>
  );
}
