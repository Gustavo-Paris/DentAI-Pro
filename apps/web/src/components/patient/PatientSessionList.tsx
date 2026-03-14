import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Badge,
  Button,
} from '@parisgroup-ai/pageshell/primitives';
import {
  Plus,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';
import { formatToothLabel } from '@/lib/treatment-config';
import type { PatientSession } from '@/hooks/domain/usePatientProfile';

export interface PatientSessionListProps {
  sessions: PatientSession[];
  patientId: string;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

export function PatientSessionList({
  sessions,
  patientId,
  hasMore,
  loadMore,
  isLoadingMore,
}: PatientSessionListProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Link to={`/new-case?patient=${patientId}`}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('evaluation.newEvaluation')}
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 sm:p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Calendar className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium font-display text-sm mb-1 text-primary">
                {t('patients.noEvaluationsYet')}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {t('patients.createFirstEvaluation')}
              </p>
            </div>
            <Link to={`/new-case?patient=${patientId}`}>
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t('evaluation.newEvaluation')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isCompleted = session.completedCount === session.evaluationCount;
            const progressPercent = Math.round((session.completedCount / session.evaluationCount) * 100);

            return (
              <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                <Card
                  className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer dark:bg-gradient-to-br dark:from-card dark:to-card/80 glass-panel glow-card animate-[fade-in-up_0.6s_ease-out_both]"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${
                    isCompleted
                      ? 'from-success to-success/70'
                      : 'from-primary to-primary/70'
                  }`} />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(session.created_at), getDateFormat('long'), {
                          locale: getDateLocale(),
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          isCompleted
                            ? 'border-success/30 text-success bg-success/5 dark:bg-success/10'
                            : 'border-primary/30 text-primary bg-primary/5 dark:bg-primary/10'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {isCompleted ? t('patients.completedStatus') : t('patients.inProgressStatus')}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {session.teeth.slice(0, 4).map((tooth, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {formatToothLabel(tooth)}
                          </Badge>
                        ))}
                        {session.teeth.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{session.teeth.length - 4}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('patients.case', { count: session.evaluationCount })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                          style={{
                            width: `${progressPercent}%`,
                            boxShadow: `0 0 8px rgb(var(${isCompleted ? '--color-success-rgb' : '--color-primary-rgb'}) / 0.4)`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {session.completedCount}/{session.evaluationCount}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('patients.loadMoreEvaluations')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
