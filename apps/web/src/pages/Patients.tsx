import { useNavigate } from 'react-router-dom';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import {
  Button,
  Input,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { PagePatientCard } from '@parisgroup-ai/domain-odonto-ai/patients';
import type { PatientInfo } from '@parisgroup-ai/domain-odonto-ai/patients';
import { useAuth } from '@/contexts/AuthContext';
import { patients } from '@/data';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SEARCH_FIELDS: ('name' | 'phone' | 'email')[] = ['name', 'phone', 'email'];
const PAGINATION_CONFIG = { defaultPageSize: 20 } as const;

// =============================================================================
// Card adapter (maps PatientWithStats → PagePatientCard)
// =============================================================================

const PatientCardAdapter = memo(function PatientCardAdapter({ patient, index }: { patient: PatientWithStats; index: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const patientInfo: PatientInfo = useMemo(() => ({
    id: patient.id,
    name: patient.name,
    status: 'active' as const,
    birthDate: '',
    phone: patient.phone,
    email: patient.email,
    lastVisit: patient.lastVisit
      ? format(new Date(patient.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR })
      : undefined,
    createdAt: '',
    updatedAt: '',
  }), [patient.id, patient.name, patient.phone, patient.email, patient.lastVisit]);

  const onSelect = useCallback((id: string) => navigate(`/patient/${id}`), [navigate]);

  return (
    <div className="relative">
      <PagePatientCard
        patient={patientInfo}
        onSelect={onSelect}
        animationDelay={index}
        lastVisitLabel={t('patients.lastVisit')}
      />
      {patient.caseCount > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full font-medium">
            {t('patients.casesSummary', {
              defaultValue: '{{count}} avaliações',
              count: patient.caseCount,
            })}
          </span>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { patients: patientsList, total, isLoading, isError } = usePatientList();

  // ---- Create patient dialog ----
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isFormDirty = !!(createForm.name || createForm.phone || createForm.email || createForm.notes);

  const handleCloseDialog = useCallback(() => {
    if (isFormDirty && !window.confirm(t('patients.unsavedChanges', { defaultValue: 'Descartar alterações não salvas?' }))) {
      return;
    }
    setShowCreateDialog(false);
    setCreateForm({ name: '', phone: '', email: '', notes: '' });
    setValidationErrors({});
  }, [isFormDirty, t]);

  const validateField = useCallback((field: string, value: string) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (field === 'email') {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          next.email = t('validation.invalidEmail', { defaultValue: 'Email inválido' });
        } else {
          delete next.email;
        }
      }
      if (field === 'phone') {
        if (value && !/^[\d\s\(\)\-\+]{8,}$/.test(value)) {
          next.phone = t('validation.invalidPhone', { defaultValue: 'Telefone inválido' });
        } else {
          delete next.phone;
        }
      }
      return next;
    });
  }, [t]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string; notes?: string }) => {
      if (!user) throw new Error('User not authenticated');
      return patients.create(user.id, data);
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(t('toasts.patient.created', { defaultValue: 'Paciente criado com sucesso' }));
      setShowCreateDialog(false);
      setCreateForm({ name: '', phone: '', email: '', notes: '' });
      setValidationErrors({});
      navigate(`/patient/${newPatient.id}`);
    },
    onError: () => {
      toast.error(t('toasts.patient.createError', { defaultValue: 'Erro ao criar paciente' }));
    },
  });

  const handleCreatePatient = useCallback(() => {
    if (!createForm.name.trim()) return;
    createMutation.mutate({
      name: createForm.name.trim(),
      phone: createForm.phone.trim() || undefined,
      email: createForm.email.trim() || undefined,
      notes: createForm.notes.trim() || undefined,
    });
  }, [createForm, createMutation]);

  const searchConfig = useMemo(
    () => ({ fields: SEARCH_FIELDS, placeholder: t('patients.searchPlaceholder') }),
    [t],
  );

  const sortConfig = useMemo(
    () => ({
      options: [
        {
          value: 'recent' as const,
          label: t('patients.sortRecent'),
          compare: (a: PatientWithStats, b: PatientWithStats) => {
            if (!a.lastVisit && !b.lastVisit) return 0;
            if (!a.lastVisit) return 1;
            if (!b.lastVisit) return -1;
            return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
          },
        },
        {
          value: 'name-asc' as const,
          label: t('patients.sortNameAsc'),
          direction: 'asc' as const,
          compare: (a: PatientWithStats, b: PatientWithStats) =>
            a.name.localeCompare(b.name, 'pt-BR'),
        },
        {
          value: 'name-desc' as const,
          label: t('patients.sortNameDesc'),
          direction: 'desc' as const,
          compare: (a: PatientWithStats, b: PatientWithStats) =>
            b.name.localeCompare(a.name, 'pt-BR'),
        },
        {
          value: 'cases' as const,
          label: t('patients.sortCases'),
          compare: (a: PatientWithStats, b: PatientWithStats) =>
            b.caseCount - a.caseCount,
        },
      ],
      default: 'recent',
    }),
    [t],
  );

  const createAction = useMemo(
    () => ({ label: t('patients.createPatient', { defaultValue: 'Novo Paciente' }), onClick: () => setShowCreateDialog(true) }),
    [t],
  );

  const emptyState = useMemo(
    () => ({
      title: t('patients.emptyTitle'),
      description: t('patients.emptyDescription'),
      action: { label: t('evaluation.newEvaluation'), href: '/new-case' },
    }),
    [t],
  );

  const labels = useMemo(
    () => ({
      search: { placeholder: t('patients.searchPlaceholder') },
      pagination: { showing: t('common.showingOf'), of: t('common.of'), items: t('patients.paginationItems') },
    }),
    [t],
  );

  const renderCard = useCallback(
    (patient: PatientWithStats, index?: number) => (
      <PatientCardAdapter patient={patient} index={index ?? 0} />
    ),
    [],
  );

  if (isError) {
    return (
      <GenericErrorState
        title={t('patients.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <>
      <ListPage<PatientWithStats>
        className="max-w-5xl mx-auto"
        title={t('patients.title')}
        description={t('patients.count', { count: total })}
        viewMode="cards"
        items={patientsList}
        isLoading={isLoading}
        itemKey="id"
        renderCard={renderCard}
        gridClassName="grid grid-cols-1 gap-3"
        searchConfig={searchConfig}
        sort={sortConfig}
        pagination={PAGINATION_CONFIG}
        createAction={createAction}
        emptyState={emptyState}
        labels={labels}
      />

      {/* Create Patient Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patients.createPatient', { defaultValue: 'Novo Paciente' })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="create-name">{t('patients.name')}</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('patients.namePlaceholder')}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="create-phone">{t('patients.phone')}</Label>
              <Input
                id="create-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                onBlur={(e) => validateField('phone', e.target.value)}
                placeholder={t('patients.phonePlaceholder')}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-email">{t('auth.email')}</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={(e) => validateField('email', e.target.value)}
                placeholder={t('patients.emailPlaceholder')}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-notes">{t('patients.clinicalNotes')}</Label>
              <Textarea
                id="create-notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('patients.clinicalNotesPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreatePatient}
                disabled={createMutation.isPending || !createForm.name.trim() || Object.keys(validationErrors).length > 0}
              >
                {createMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
