import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@pageshell/composites/list';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { Card } from '@/components/ui/card';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// Card component (presentation only)
// =============================================================================

function PatientCard({ patient, index }: { patient: PatientWithStats; index: number }) {
  const { t } = useTranslation();
  return (
    <Link to={`/patient/${patient.id}`} aria-label={`Ver paciente ${patient.name}`}>
      <Card
        className="p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer border-l-[3px] border-l-primary animate-[fade-in-up_0.6s_ease-out_both]"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 text-sm sm:text-base">
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">{patient.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('patients.case', { count: patient.caseCount })} •{' '}
              {t('patients.evaluation', { count: patient.sessionCount })}
              {patient.caseCount > 0 && (
                <span className="ml-1">
                  •{' '}
                  {t('patients.percentCompleted', {
                    percent: Math.round(
                      (patient.completedCount / patient.caseCount) * 100,
                    ),
                  })}
                </span>
              )}
            </p>
            {patient.lastVisit && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('patients.lastVisit')}{' '}
                {format(new Date(patient.lastVisit), "d 'de' MMM, yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { t } = useTranslation();
  const { patients, total, isLoading, isError } = usePatientList();

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="font-medium">{t('patients.loadError')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('errors.tryReloadPage')}
          </p>
        </Card>
      </div>
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
          keyExtractor={(p) => p.id}
          renderCard={(patient, index) => <PatientCard patient={patient} index={index ?? 0} />}
          gridClassName="grid grid-cols-1 gap-3"
          searchConfig={{
            fields: ['name', 'phone', 'email'],
            placeholder: t('patients.searchPlaceholder'),
          }}
          sort={{
            options: [
              {
                value: 'recent',
                label: t('patients.sortRecent'),
                compare: (a: PatientWithStats, b: PatientWithStats) => {
                  if (!a.lastVisit && !b.lastVisit) return 0;
                  if (!a.lastVisit) return 1;
                  if (!b.lastVisit) return -1;
                  return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
                },
              },
              {
                value: 'name-asc',
                label: t('patients.sortNameAsc'),
                direction: 'asc',
                compare: (a: PatientWithStats, b: PatientWithStats) =>
                  a.name.localeCompare(b.name, 'pt-BR'),
              },
              {
                value: 'name-desc',
                label: t('patients.sortNameDesc'),
                direction: 'desc',
                compare: (a: PatientWithStats, b: PatientWithStats) =>
                  b.name.localeCompare(a.name, 'pt-BR'),
              },
              {
                value: 'cases',
                label: t('patients.sortCases'),
                compare: (a: PatientWithStats, b: PatientWithStats) =>
                  b.caseCount - a.caseCount,
              },
            ],
            default: 'recent',
          }}
          pagination={{ defaultPageSize: 20 }}
          createAction={{
            label: t('evaluation.newEvaluation'),
            href: '/new-case',
          }}
          emptyState={{
            title: t('patients.emptyTitle'),
            description: t('patients.emptyDescription'),
            action: { label: t('evaluation.newEvaluation'), href: '/new-case' },
          }}
          labels={{
            search: { placeholder: t('patients.searchPlaceholder') },
            pagination: { showing: t('common.showingOf'), of: t('common.of'), items: t('patients.paginationItems') },
          }}
        />
    </div>
  );
}
