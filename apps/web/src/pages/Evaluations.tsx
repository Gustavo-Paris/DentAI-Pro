import { useCallback, useEffect, useState, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@parisgroup-ai/pageshell/composites';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';
import type { EvaluationSession } from '@/hooks/domain/useEvaluationSessions';
import { Badge, Card } from '@parisgroup-ai/pageshell/primitives';
import { CheckCircle, ChevronRight, Calendar } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatToothLabel } from '@/lib/treatment-config';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SEARCH_FIELDS: ('patient_name')[] = ['patient_name'];
const PAGINATION_CONFIG = { defaultPageSize: 20 } as const;

const TREATMENT_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'evaluation.treatmentAll' },
  { value: 'resina', labelKey: 'evaluation.treatmentResina' },
  { value: 'porcelana', labelKey: 'evaluation.treatmentPorcelana' },
  { value: 'endodontia', labelKey: 'evaluation.treatmentEndodontia' },
  { value: 'implante', labelKey: 'evaluation.treatmentImplante' },
  { value: 'coroa', labelKey: 'evaluation.treatmentCoroa' },
  { value: 'encaminhamento', labelKey: 'evaluation.treatmentEncaminhamento' },
] as const;

// =============================================================================
// Card component (presentation only)
// =============================================================================

const SessionCard = memo(function SessionCard({
  session,
  isNew,
  index,
}: {
  session: EvaluationSession;
  isNew: boolean;
  index: number;
}) {
  const { t } = useTranslation();
  const isCompleted = session.status === 'completed';

  const borderClass = isNew
    ? 'border-l-[3px] border-l-primary ring-1 ring-primary/20'
    : isCompleted
    ? 'border-l-[3px] border-l-emerald-500'
    : 'border-l-[3px] border-l-primary';

  return (
    <Link to={`/evaluation/${session.session_id}`} aria-label={t('evaluation.viewEvaluationOf', { name: session.patient_name || t('evaluation.patientNoName') })}>
      <Card
        className={`p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer animate-[fade-in-up_0.6s_ease-out_both] ${borderClass}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm sm:text-base">
                {session.patient_name || t('evaluation.patientNoName')}
              </p>
              {isNew && (
                <Badge variant="secondary" className="text-xs">
                  {t('evaluation.new')}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              <span className="text-muted-foreground hidden sm:inline flex-shrink-0">•</span>
              <div className="flex gap-1 flex-wrap items-center min-w-0">
                {session.teeth.slice(0, 3).map((tooth) => (
                  <Badge key={tooth} variant="outline" className="text-xs whitespace-nowrap">
                    {formatToothLabel(tooth)}
                  </Badge>
                ))}
                {session.teeth.length > 3 && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    +{session.teeth.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{t('evaluation.completed')}</span>
              </span>
            ) : session.completedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{t('evaluation.resultsReady')}</span>
                <span className="text-muted-foreground">
                  ({session.completedCount}/{session.evaluationCount})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span className="hidden sm:inline">{t('evaluation.statusPending')}</span>
              </span>
            )}
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
              </span>
              <span className="sm:hidden">
                {format(new Date(session.created_at), 'dd/MM', { locale: ptBR })}
              </span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

// =============================================================================
// Page Adapter
// =============================================================================

export default function Evaluations() {
  const { t } = useTranslation();
  const { sessions, isLoading, isError, newSessionId, newTeethCount } =
    useEvaluationSessions();
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all');

  const filteredSessions = useMemo(() => {
    if (treatmentFilter === 'all') return sessions;
    return sessions.filter((s) => s.treatmentTypes.includes(treatmentFilter));
  }, [sessions, treatmentFilter]);

  // Clear navigation state after viewing
  useEffect(() => {
    if (newSessionId) {
      window.history.replaceState({}, document.title);
    }
  }, [newSessionId]);

  const searchConfig = useMemo(
    () => ({ fields: SEARCH_FIELDS, placeholder: t('evaluation.searchByPatient') }),
    [t],
  );

  const filtersConfig = useMemo(
    () => ({
      status: {
        label: t('evaluation.statusFilter'),
        options: [
          { value: 'all', label: t('evaluation.statusAll') },
          { value: 'pending', label: t('evaluation.statusPending') },
          { value: 'completed', label: t('evaluation.statusCompleted') },
        ],
        default: 'all',
      },
    }),
    [t],
  );

  const createAction = useMemo(
    () => ({ label: t('evaluation.newEvaluation'), href: '/new-case' }),
    [t],
  );

  const emptyState = useMemo(
    () => ({
      title: t('evaluation.emptyTitle'),
      description: t('evaluation.emptyDescription'),
      action: { label: t('evaluation.emptyAction'), href: '/new-case' },
    }),
    [t],
  );

  const labels = useMemo(
    () => ({
      search: { placeholder: t('evaluation.searchByPatient') },
      pagination: { showing: t('common.showingOf'), of: t('common.of'), items: t('evaluation.paginationItems') },
    }),
    [t],
  );

  const renderCard = useCallback((session: EvaluationSession, index?: number) => (
    <SessionCard
      session={session}
      isNew={newSessionId === session.session_id}
      index={index ?? 0}
    />
  ), [newSessionId]);

  if (isError) {
    return (
      <ErrorState
        title={t('evaluation.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Success Banner for New Session */}
      {newSessionId && (
        <div role="status" aria-live="polite" className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-sm flex items-center gap-3 animate-[fade-in-up_0.6s_ease-out_both]">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium text-sm sm:text-base">
              {t('evaluation.createdWithCases', { count: newTeethCount })}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('evaluation.newHighlighted')}
            </p>
          </div>
        </div>
      )}

      {/* Treatment type filter pills */}
      {!isLoading && sessions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('evaluation.treatmentFilter')}>
          {TREATMENT_TYPE_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setTreatmentFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                treatmentFilter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      )}

      <ListPage<EvaluationSession>
          title={t('evaluation.title')}
          viewMode="cards"
          items={filteredSessions}
          isLoading={isLoading}
          itemKey="session_id"
          renderCard={renderCard}
          gridClassName="grid grid-cols-1 gap-3"
          searchConfig={searchConfig}
          filters={filtersConfig}
          pagination={PAGINATION_CONFIG}
          createAction={createAction}
          emptyState={emptyState}
          labels={labels}
        />
    </div>
  );
}
