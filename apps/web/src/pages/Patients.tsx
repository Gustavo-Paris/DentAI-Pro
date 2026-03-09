import { Link, useNavigate } from 'react-router-dom';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ListPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import {
  Button,
  Card,
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
import { Phone, Mail, ChevronRight, Plus, Users } from 'lucide-react';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SEARCH_FIELDS: ('name' | 'phone' | 'email')[] = ['name', 'phone', 'email'];
const PAGE_SIZE = 10;

const SORT_COMPARATORS: Record<string, (a: PatientWithStats, b: PatientWithStats) => number> = {
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
        className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all duration-300 cursor-pointer dark:bg-gradient-to-br dark:from-card dark:to-card/80 glass-panel glow-card animate-[fade-in-up_0.6s_ease-out_both]"
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
// Page Adapter — maps domain hook to ListPage composite
// =============================================================================

export default function Patients() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.patients'));
  const navigate = useNavigate();
  const { patients: patientsList, total, isLoading, isError, createPatient, isCreating } = usePatientList();

  // ---- External search, sort & pagination ----
  // PageShell ListPage card view has a bug: pagination UI renders but items
  // aren't sliced. We manage search/sort/pagination externally and pass
  // only the current page's items.
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('recent');
  const [page, setPage] = useState(1);

  const processedPatients = useMemo(() => {
    let result = patientsList;
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        SEARCH_FIELDS.some(f => p[f]?.toLowerCase().includes(q)),
      );
    }
    // Sort
    const comparator = SORT_COMPARATORS[sortValue];
    if (comparator) {
      result = [...result].sort(comparator);
    }
    return result;
  }, [patientsList, searchQuery, sortValue]);

  const filteredCount = processedPatients.length;
  useEffect(() => { setPage(1); }, [filteredCount]);

  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedPatients.slice(start, start + PAGE_SIZE);
  }, [processedPatients, page]);

  // ---- ListPage: search config ----
  const searchConfig = useMemo(
    () => ({ fields: SEARCH_FIELDS, placeholder: t('patients.searchPlaceholder') }),
    [t],
  );

  // ---- ListPage: sort config ----
  const sortConfig = useMemo(
    () => ({
      options: [
        { value: 'recent', label: t('patients.sortRecent'), compare: SORT_COMPARATORS.recent },
        { value: 'name-asc', label: t('patients.sortNameAsc'), compare: SORT_COMPARATORS['name-asc'] },
        { value: 'name-desc', label: t('patients.sortNameDesc'), compare: SORT_COMPARATORS['name-desc'] },
        { value: 'cases', label: t('patients.sortCases'), compare: SORT_COMPARATORS.cases },
      ],
      default: 'recent',
    }),
    [t],
  );

  // ---- ListPage: create action ----
  const createAction = useMemo(
    () => ({ label: t('patients.createPatient'), onClick: () => setShowCreateDialog(true) }),
    [t],
  );

  // ---- ListPage: empty state ----
  const emptyState = useMemo(
    () => ({
      title: t('patients.emptyTitle'),
      description: t('patients.emptyDescription'),
      icon: Users,
      action: { label: t('patients.createPatient'), onClick: () => setShowCreateDialog(true) },
    }),
    [t],
  );

  // ---- ListPage: empty search state ----
  const emptySearchState = useMemo(
    () => ({
      title: t('patients.emptyTitle'),
      description: t('patients.emptySearchDescription'),
      showClearButton: true,
    }),
    [t],
  );

  // ---- ListPage: description ----
  const description = filteredCount > 0 ? t('patients.count', { count: filteredCount }) : undefined;

  // ---- ListPage: labels ----
  const labels = useMemo(
    () => ({
      search: { placeholder: t('patients.searchPlaceholder') },
      pagination: {
        showing: t('common.showingOf'),
        to: t('common.to'),
        of: t('common.of'),
        items: t('patients.paginationItems'),
      },
    }),
    [t],
  );

  // ---- ListPage: renderCard ----
  const renderCard = useCallback(
    (patient: PatientWithStats, index: number) => (
      <PatientCard patient={patient} index={index} />
    ),
    [],
  );

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
      <div className="relative z-10 max-w-5xl mx-auto py-6 sm:py-8">
        <ListPage<PatientWithStats>
          containerVariant="shell"
          title={t('patients.title')}
          description={description}
          viewMode="cards"
          items={paginatedPatients}
          isLoading={isLoading}
          itemKey="id"
          renderCard={renderCard}
          gridClassName="grid grid-cols-1 gap-4 stagger-enter"
          searchConfig={searchConfig}
          sort={sortConfig}
          pagination={false}
          offsetPagination={{
            type: 'offset',
            page,
            pageSize: PAGE_SIZE,
            total: filteredCount,
            onPageChange: setPage,
          }}
          createAction={createAction}
          emptyState={emptyState}
          emptySearchState={emptySearchState}
          labels={labels}
          onSearchChange={setSearchQuery}
          onSortChange={(key) => { if (key) setSortValue(key); }}
        />
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
                aria-describedby={validationErrors.phone ? "create-phone-error" : undefined}
              />
              {validationErrors.phone && (
                <p id="create-phone-error" role="alert" className="text-sm text-destructive">{validationErrors.phone}</p>
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
                aria-describedby={validationErrors.email ? "create-email-error" : undefined}
              />
              {validationErrors.email && (
                <p id="create-email-error" role="alert" className="text-sm text-destructive">{validationErrors.email}</p>
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
