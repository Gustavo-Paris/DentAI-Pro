import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@parisgroup-ai/pageshell/composites';
import { PagePatientCard } from '@parisgroup-ai/domain-odonto-ai/patients';
import type { PatientInfo } from '@parisgroup-ai/domain-odonto-ai/patients';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { ErrorState } from '@/components/ui/error-state';
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

function PatientCardAdapter({ patient, index }: { patient: PatientWithStats; index: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const patientInfo: PatientInfo = {
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
  };

  return (
    <PagePatientCard
      patient={patientInfo}
      onSelect={(id) => navigate(`/patient/${id}`)}
      animationDelay={index}
      lastVisitLabel={t('patients.lastVisit')}
    />
  );
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { t } = useTranslation();
  const { patients, total, isLoading, isError } = usePatientList();

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
    () => ({ label: t('evaluation.newEvaluation'), href: '/new-case' }),
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

  if (isError) {
    return (
      <ErrorState
        title={t('patients.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <ListPage<PatientWithStats>
          title={t('patients.title')}
          description={t('patients.count', { count: total })}
          viewMode="cards"
          items={patients}
          isLoading={isLoading}
          itemKey="id"
          renderCard={(patient, index) => <PatientCardAdapter patient={patient} index={index ?? 0} />}
          gridClassName="grid grid-cols-1 gap-3"
          searchConfig={searchConfig}
          sort={sortConfig}
          pagination={PAGINATION_CONFIG}
          createAction={createAction}
          emptyState={emptyState}
          labels={labels}
        />
    </div>
  );
}
