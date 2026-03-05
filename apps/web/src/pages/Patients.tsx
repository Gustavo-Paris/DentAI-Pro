import { Link, useNavigate } from 'react-router-dom';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { useListLogic } from '@parisgroup-ai/pageshell/core';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  Button,
  Card,
  SearchInput,
  Input,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';
import i18n from '@/lib/i18n';
import { Phone, Mail, ChevronRight, ChevronLeft, Plus, Users } from 'lucide-react';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SEARCH_FIELDS: ('name' | 'phone' | 'email')[] = ['name', 'phone', 'email'];
const PAGE_SIZE = 20;

type SortKey = 'recent' | 'name-asc' | 'name-desc' | 'cases';

const SORT_COMPARATORS: Record<SortKey, (a: PatientWithStats, b: PatientWithStats) => number> = {
  recent: (a, b) => {
    if (!a.lastVisit && !b.lastVisit) return 0;
    if (!a.lastVisit) return 1;
    if (!b.lastVisit) return -1;
    return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
  },
  'name-asc': (a, b) => a.name.localeCompare(b.name, i18n.language || 'pt-BR'),
  'name-desc': (a, b) => b.name.localeCompare(a.name, i18n.language || 'pt-BR'),
  cases: (a, b) => b.caseCount - a.caseCount,
};

// =============================================================================
// Patient card (glass-panel with initials avatar)
// =============================================================================

const PatientCard = memo(function PatientCard({
  patient,
  index,
}: {
  patient: PatientWithStats;
  index: number;
}) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/patient/${patient.id}`}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      aria-label={patient.name}
    >
      <Card
        className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer dark:bg-gradient-to-br dark:from-card dark:to-card/80 glass-panel glow-card animate-[fade-in-up_0.6s_ease-out_both]"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Initials avatar */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
            {getInitials(patient.name)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm sm:text-base truncate">
                {patient.name}
              </p>
              {patient.caseCount > 0 && (
                <span className="text-xs text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full font-medium tabular-nums shrink-0">
                  {t('patients.evaluation', { count: patient.caseCount })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" aria-hidden="true" />
                  {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" aria-hidden="true" />
                  <span className="truncate max-w-[180px]">{patient.email}</span>
                </span>
              )}
              {patient.lastVisit && (
                <>
                  <span className="text-muted-foreground/40 hidden sm:inline">·</span>
                  <span className="hidden sm:inline">
                    {t('patients.lastVisit')}: {format(new Date(patient.lastVisit), getDateFormat('short'), { locale: getDateLocale() })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
});

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.patients'));
  const navigate = useNavigate();
  const { patients: patientsList, total, isLoading, isError, createPatient, isCreating } = usePatientList();

  // ---- Sort state (managed outside useListLogic — needs custom comparators) ----
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sortedPatients = useMemo(() => {
    if (!patientsList.length) return patientsList;
    return [...patientsList].sort(SORT_COMPARATORS[sortKey]);
  }, [patientsList, sortKey]);

  // ---- useListLogic for search + pagination ----
  const listLogic = useListLogic<PatientWithStats>({
    items: sortedPatients,
    searchFields: SEARCH_FIELDS,
    pageSize: PAGE_SIZE,
  });

  // ---- Create patient dialog ----
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isFormDirty = !!(createForm.name || createForm.phone || createForm.email || createForm.notes);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    setShowCreateDialog(false);
    setCreateForm({ name: '', phone: '', email: '', notes: '' });
    setValidationErrors({});
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowCreateDialog(false);
    setCreateForm({ name: '', phone: '', email: '', notes: '' });
    setValidationErrors({});
  }, [isFormDirty]);

  const validateField = useCallback((field: string, value: string) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (field === 'email') {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          next.email = t('validation.invalidEmail');
        } else {
          delete next.email;
        }
      }
      if (field === 'phone') {
        if (value && !/^[\d\s()\-+]{8,}$/.test(value)) {
          next.phone = t('validation.invalidPhone');
        } else {
          delete next.phone;
        }
      }
      return next;
    });
  }, [t]);

  const handleCreatePatient = useCallback(async () => {
    if (!createForm.name.trim()) return;
    try {
      const newPatient = await createPatient({
        name: createForm.name.trim(),
        phone: createForm.phone.trim() || undefined,
        email: createForm.email.trim() || undefined,
        notes: createForm.notes.trim() || undefined,
      });
      toast.success(t('toasts.patient.created'));
      setShowCreateDialog(false);
      setCreateForm({ name: '', phone: '', email: '', notes: '' });
      setValidationErrors({});
      navigate(`/patient/${newPatient.id}`);
    } catch {
      toast.error(t('toasts.patient.createError'));
    }
  }, [createForm, createPatient, t, navigate]);

  const sortOptions: { key: SortKey; labelKey: string }[] = [
    { key: 'recent', labelKey: 'patients.sortRecent' },
    { key: 'name-asc', labelKey: 'patients.sortNameAsc' },
    { key: 'name-desc', labelKey: 'patients.sortNameDesc' },
    { key: 'cases', labelKey: 'patients.sortCases' },
  ];

  if (isError) {
    return (
      <GenericErrorState
        title={t('patients.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  const showingStart = Math.min((listLogic.page - 1) * PAGE_SIZE + 1, listLogic.filteredCount);
  const showingEnd = Math.min(listLogic.page * PAGE_SIZE, listLogic.filteredCount);

  return (
    <>
      <div className="relative section-glow-bg overflow-hidden max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Ambient AI grid overlay */}
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('patients.title')}</h1>
            {total > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('patients.count', { count: total })}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t('patients.createPatient')}
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-5">
          <SearchInput
            value={listLogic.search}
            onChange={(e) => listLogic.setSearch(e.target.value)}
            placeholder={t('patients.searchPlaceholder')}
          />
        </div>

        {/* Sort pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none mb-4 sm:mb-6">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                sortKey === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-panel text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && listLogic.filteredCount === 0 && (
          <Card className="p-8 sm:p-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              {listLogic.hasActiveFilters ? (
                <div>
                  <p className="font-medium font-display text-sm mb-1 text-primary">
                    {t('patients.emptyTitle')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('patients.emptySearchDescription', { defaultValue: 'Nenhum paciente encontrado para a busca.' })}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => listLogic.clearFilters()}>
                    {t('evaluation.clearFilters', { defaultValue: 'Limpar filtros' })}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="font-medium font-display text-sm mb-1 text-primary">
                    {t('patients.emptyTitle')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('patients.emptyDescription')}
                  </p>
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    {t('patients.createPatient')}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Patient cards */}
        {!isLoading && listLogic.paginatedItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 stagger-enter">
            {listLogic.paginatedItems.map((patient, index) => (
              <PatientCard key={patient.id} patient={patient} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && listLogic.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t('common.showingOf', { defaultValue: 'Mostrando' })}{' '}
              <span className="font-medium">{showingStart}</span>
              {' '}{t('common.to', { defaultValue: 'a' })}{' '}
              <span className="font-medium">{showingEnd}</span>
              {' '}{t('common.of', { defaultValue: 'de' })}{' '}
              <span className="font-medium">{listLogic.filteredCount}</span>
              {' '}{t('patients.paginationItems', { defaultValue: 'pacientes' })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={listLogic.page <= 1}
                onClick={() => listLogic.prevPage()}
                aria-label={t('common.previousPage', { defaultValue: 'Página anterior' })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: listLogic.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === listLogic.page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => listLogic.setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={listLogic.page >= listLogic.totalPages}
                onClick={() => listLogic.nextPage()}
                aria-label={t('common.nextPage', { defaultValue: 'Próxima página' })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Patient Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patients.createPatient')}</DialogTitle>
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
                disabled={isCreating || !createForm.name.trim() || Object.keys(validationErrors).length > 0}
              >
                {isCreating ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard unsaved changes confirm */}
      <PageConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={t('patients.unsavedChanges')}
        description={t('patients.unsavedChangesDescription')}
        confirmText={t('common.discard')}
        cancelText={t('common.cancel')}
        onConfirm={confirmDiscard}
        variant="warning"
      />
    </>
  );
}
