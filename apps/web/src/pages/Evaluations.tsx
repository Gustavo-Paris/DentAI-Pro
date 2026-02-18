import { useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@parisgroup-ai/pageshell/composites';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';
import type { EvaluationSession } from '@/hooks/domain/useEvaluationSessions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatToothLabel } from '@/lib/treatment-config';

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
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <div className="flex gap-1 flex-wrap">
                {session.teeth.slice(0, 3).map((tooth) => (
                  <Badge key={tooth} variant="outline" className="text-xs">
                    {formatToothLabel(tooth)}
                  </Badge>
                ))}
                {session.teeth.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{session.teeth.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{t('evaluation.completed')}</span>
              </span>
            ) : session.completedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                <span className="hidden sm:inline">{t('evaluation.inProgress')}</span>
                <span className="text-muted-foreground">
                  ({session.completedCount}/{session.evaluationCount})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{t('evaluation.resultsReady')}</span>
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

  // Clear navigation state after viewing
  useEffect(() => {
    if (newSessionId) {
      window.history.replaceState({}, document.title);
    }
  }, [newSessionId]);

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="font-medium">{t('evaluation.loadError')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('errors.tryReloadPage')}
          </p>
        </Card>
      </div>
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

      <ListPage<EvaluationSession>
          title={t('evaluation.title')}
          viewMode="cards"
          items={sessions}
          isLoading={isLoading}
          keyExtractor={(s) => s.session_id}
          renderCard={(session, index) => (
            <SessionCard
              session={session}
              isNew={newSessionId === session.session_id}
              index={index ?? 0}
            />
          )}
          gridClassName="grid grid-cols-1 gap-3"
          searchConfig={{
            fields: ['patient_name'],
            placeholder: t('evaluation.searchByPatient'),
          }}
          filters={{
            status: {
              label: t('evaluation.statusFilter'),
              options: [
                { value: 'all', label: t('evaluation.statusAll') },
                { value: 'pending', label: t('evaluation.statusPending') },
                { value: 'completed', label: t('evaluation.statusCompleted') },
              ],
              default: 'all',
            },
          }}
          pagination={{ defaultPageSize: 20 }}
          createAction={{
            label: t('evaluation.newEvaluation'),
            href: '/new-case',
          }}
          emptyState={{
            title: t('evaluation.emptyTitle'),
            description: t('evaluation.emptyDescription'),
            action: { label: t('evaluation.emptyAction'), href: '/new-case' },
          }}
          labels={{
            search: { placeholder: t('evaluation.searchByPatient') },
            pagination: { showing: t('common.showingOf'), of: t('common.of'), items: t('evaluation.paginationItems') },
          }}
        />
    </div>
  );
}
