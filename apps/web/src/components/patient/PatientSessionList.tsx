import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Badge,
  Button,
  Progress,
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
import { ptBR } from 'date-fns/locale';
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
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold font-display mb-2">{t('patients.noEvaluationsYet')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('patients.createFirstEvaluation')}
          </p>
          <Link to={`/new-case?patient=${patientId}`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('evaluation.newEvaluation')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isCompleted = session.completedCount === session.evaluationCount;
            const progressPercent = (session.completedCount / session.evaluationCount) * 100;

            return (
              <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                <Card
                  className={`p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer border-l-[3px] animate-[fade-in-up_0.6s_ease-out_both] ${
                    isCompleted ? 'border-l-emerald-500' : 'border-l-primary'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(session.created_at), "d 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <Badge
                        variant={isCompleted ? 'default' : 'secondary'}
                        className={isCompleted ? 'bg-primary' : ''}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {isCompleted ? t('patients.completedStatus') : t('patients.inProgressStatus')}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                      <Progress value={progressPercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
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
