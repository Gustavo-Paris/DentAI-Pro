import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Card,
  Button,
  Input,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  Phone,
  Mail,
  FileText,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';
import { DetailPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { PageTreatmentTimeline } from '@parisgroup-ai/domain-odonto-ai/treatments';
import type { ProcedureInfo } from '@parisgroup-ai/domain-odonto-ai/treatments';

import { usePatientProfile } from '@/hooks/domain/usePatientProfile';
import { useAuth } from '@/contexts/AuthContext';
import { patients } from '@/data';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { PatientSessionList } from '@/components/patient/PatientSessionList';

// =============================================================================
// Page Adapter
// =============================================================================

export default function PatientProfile() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.patientProfile'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = usePatientProfile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { patient, sessions, metrics, editForm, patientId } = profile;

  const handleDeletePatient = async () => {
    if (!patientId || !user) return;
    setIsDeleting(true);
    try {
      await patients.deletePatient(patientId, user.id);
      trackEvent('patient_deleted', { patient_id: patientId });
      toast.success(t('toasts.patient.deleted'));
      navigate('/patients');
    } catch (error) {
      logger.error('Failed to delete patient:', error);
      toast.error(t('toasts.patient.deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  const sessionsList = sessions?.sessions || [];
  const hasMoreSessions = sessions?.hasMore || false;

  const sections = useMemo(() => [
          {
            id: 'contact',
            title: t('patients.contactInfo'),
            children: () => (
              <Card className="p-4 rounded-xl">
                <div className="flex flex-wrap gap-4 text-sm">
                  {patient?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient?.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient?.notes && (
                    <div className="flex items-start gap-2 text-muted-foreground w-full mt-2 pt-2 border-t border-border">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-pre-wrap">{patient.notes}</span>
                    </div>
                  )}
                  {!patient?.phone && !patient?.email && !patient?.notes && (
                    <p className="text-muted-foreground">
                      {t('patients.noAdditionalInfo')}{' '}
                      <button className="text-primary hover:underline transition-colors duration-200" onClick={profile.openEditDialog}>
                        {t('patients.addData')}
                      </button>
                    </p>
                  )}
                </div>
              </Card>
            ),
          },
          {
            id: 'metrics',
            title: t('patients.metrics'),
            children: () => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: metrics.totalSessions, label: t('patients.evaluationsLabel') },
                  { value: metrics.totalCases, label: t('patients.casesLabel') },
                  { value: metrics.completedCases, label: t('patients.completedLabel'), highlight: true },
                  { value: metrics.firstVisitFormatted, label: t('patients.firstVisit') },
                ].map((stat, i) => (
                  <Card
                    key={stat.label}
                    className="p-3 sm:p-4 text-center rounded-xl animate-[fade-in-up_0.6s_ease-out_both] glass-card glow-card"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <p className={`text-2xl font-semibold${stat.highlight ? ' text-primary' : ''}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            id: 'timeline',
            title: t('patients.treatmentTimeline'),
            children: () => {
              const entries: ProcedureInfo[] = sessionsList.map((session) => ({
                id: session.session_id,
                name: t('evaluation.dental'),
                code: '',
                tooth: session.teeth.length > 0 ? parseInt(session.teeth[0], 10) : undefined,
                status: session.completedCount === session.evaluationCount ? 'completed' as const : 'in-progress' as const,
                cost: { value: 0, currency: 'BRL' },
                performedDate: format(new Date(session.created_at), getDateFormat('medium'), { locale: getDateLocale() }),
                createdAt: session.created_at,
                updatedAt: session.created_at,
              }));

              if (entries.length === 0) return null;

              return (
                <PageTreatmentTimeline
                  entries={entries}
                  toothLabel={t('odontogram.tooth')}
                  emptyText={t('patients.noTreatmentHistory')}
                  statusLabels={{
                    planned: t('evaluation.planned'),
                    'in-progress': t('evaluation.inProgress'),
                    completed: t('evaluation.completed'),
                    cancelled: t('evaluation.cancelled'),
                  }}
                />
              );
            },
          },
          {
            id: 'sessions',
            title: t('patients.sessionHistory'),
            children: () => (
              <PatientSessionList
                sessions={sessionsList}
                patientId={patientId}
                hasMore={hasMoreSessions}
                loadMore={profile.loadMoreSessions}
                isLoadingMore={profile.isFetchingSessions}
              />
            ),
          },
  ], [t, patient, metrics, sessionsList, patientId, hasMoreSessions, profile.openEditDialog, profile.loadMoreSessions, profile.isFetchingSessions]);

  if (!profile.patient && !profile.isLoading) {
    return (
      <GenericErrorState
        title={t('errors.patientNotFound')}
        action={{ label: t('common.back'), href: '/patients' }}
      />
    );
  }

  return (
    <>
      <div className="relative section-glow-bg overflow-hidden">
        {/* Ambient AI grid overlay */}
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
      <DetailPage
        className="relative z-10 max-w-5xl mx-auto"
        title={(data) => data?.name ?? '...'}
        description={t('patients.profileTitle')}
        backHref="/patients"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('dashboard.patients'), href: '/patients' },
          { label: patient?.name || '...' },
        ]}
        query={{ data: patient, isLoading: profile.isLoading }}
        headerActions={[
          { label: t('patients.newEvaluation'), icon: Sparkles, onClick: () => navigate(`/new-case?patientId=${patientId}`), variant: 'default' },
          { label: t('common.edit'), icon: Pencil, onClick: profile.openEditDialog, variant: 'outline' },
          { label: t('common.delete'), icon: Trash2, onClick: () => setShowDeleteDialog(true), variant: 'ghost' },
        ]}
        slots={{
          beforeContent: patient && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {getInitials(patient.name)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('patients.profileTitle')}</p>
              </div>
            </div>
          ),
        }}
        sections={sections}
      />
      </div>{/* /section-glow-bg */}

      {/* Edit Dialog — rendered outside DetailPage */}
      <Dialog open={profile.editDialogOpen} onOpenChange={profile.setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patients.editPatient')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">{t('patients.name')}</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => profile.updateEditField('name', e.target.value)}
                placeholder={t('patients.namePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('patients.phone')}</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => profile.updateEditField('phone', e.target.value)}
                placeholder={t('patients.phonePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => profile.updateEditField('email', e.target.value)}
                placeholder={t('patients.emailPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('patients.clinicalNotes')}</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => profile.updateEditField('notes', e.target.value)}
                placeholder={t('patients.clinicalNotesPlaceholder')}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={profile.closeEditDialog}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={profile.handleSave}
                disabled={profile.isSaving || !editForm.name.trim()}
              >
                {profile.isSaving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm patient deletion */}
      <PageConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('patients.deletePatientTitle')}
        description={t('patients.deletePatientDescription', {
          })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDeletePatient}
        variant="destructive"
      />
    </>
  );
}
