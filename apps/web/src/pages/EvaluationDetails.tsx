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
  Loader2 as ShareLoader,
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
  useDocumentTitle(t('pageTitle.evaluationDetails', { defaultValue: 'Detalhes da Avaliação' }));
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

  const firstEval = detail.evaluations[0];
  const hasDSD = !!(firstEval?.dsd_simulation_url || firstEval?.dsd_simulation_layers?.length);

  // Budget regeneration — show button to switch to opposite tier
  const currentBudget = firstEval?.budget || 'padrão';
  const targetBudget = currentBudget === 'premium' ? 'padrão' : 'premium';
  const targetLabel = targetBudget === 'premium'
    ? t('evaluation.regenerateAsPremium', { defaultValue: 'Regenerar como Premium' })
    : t('evaluation.regenerateAsPadrao', { defaultValue: 'Regenerar como Padrão' });

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

  // Empty state guard — hook already redirects to /dashboard, but show fallback while that happens
  if (!detail.isLoading && detail.evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-muted-foreground">{t('evaluation.noEvaluationsFound', { defaultValue: 'Nenhuma avaliação encontrada' })}</p>
        <Button variant="outline" onClick={() => navigate('/evaluations')}>
          {t('common.back', { defaultValue: 'Voltar' })}
        </Button>
      </div>
    );
  }

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
            label: detail.isRegenerating
              ? t('evaluation.regenerating', { defaultValue: 'Regenerando...' })
              : targetLabel,
            icon: RefreshCw,
            onClick: () => setShowRegenerateDialog(true),
            disabled: detail.isRegenerating,
            variant: 'outline' as const,
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
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={detail.handleShareCase}
                disabled={detail.isSharing}
              >
                {detail.isSharing ? <ShareLoader className="w-4 h-4 mr-1.5 animate-spin" /> : <Share2 className="w-4 h-4 mr-1.5" />}
                {t('evaluation.share')}
              </Button>
              {detail.pendingTeeth.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
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
                  onClick={() => setShowMarkAllConfirm(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {t('evaluation.markAllCompleted')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t('evaluation.deleteSession')}
              </Button>
            </div>

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
                title={t('evaluation.tipAddMoreTitle', { defaultValue: 'Avalie mais dentes neste caso' })}
                description={t('evaluation.tipAddMoreDescription', {
                  count: detail.pendingTeeth.length,
                  defaultValue: `Ainda há ${detail.pendingTeeth.length} dentes pendentes que podem ser adicionados a esta sessão para uma avaliação mais completa.`,
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
                title={t('evaluation.tipNewCaseTitle', { defaultValue: 'Precisa avaliar mais dentes?' })}
                description={t('evaluation.tipNewCaseDescription', { defaultValue: 'Inicie uma nova avaliação para analisar outros dentes deste paciente com recomendações de IA.' })}
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
        title={t('evaluation.markAllCompletedTitle', { defaultValue: 'Marcar todas como concluídas?' })}
        description={t('evaluation.markAllCompletedDescription', { defaultValue: 'Esta ação marcará todas as avaliações pendentes como concluídas.' })}
        confirmText={t('common.confirm', { defaultValue: 'Confirmar' })}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          setShowMarkAllConfirm(false);
          detail.handleMarkAllAsCompleted();
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
        onConfirm={() => {
          setShowDeleteDialog(false);
          detail.handleDeleteSession();
        }}
        variant="destructive"
      />

      {/* Confirm protocol regeneration */}
      <PageConfirmDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
        title={t('evaluation.regenerateTitle', { defaultValue: 'Regenerar protocolos?' })}
        description={t('evaluation.regenerateDescription', {
          defaultValue: `Os protocolos de resina e porcelana serão regenerados como "${targetBudget}". Isso substituirá os protocolos atuais.`,
        })}
        confirmText={t('evaluation.regenerateConfirm', { defaultValue: 'Regenerar' })}
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
