import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Smile } from 'lucide-react';
import { getTreatmentConfig, formatToothLabel } from '@/lib/treatment-config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SessionCard({ session }: { session: DashboardSession }) {
  const { t } = useTranslation();
  const isCompleted = session.completedCount === session.evaluationCount;
  const progressPercent = session.evaluationCount > 0
    ? (session.completedCount / session.evaluationCount) * 100
    : 0;

  return (
    <Link to={`/evaluation/${session.session_id}`}>
      <Card className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer">
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${
            isCompleted
              ? 'bg-gradient-to-b from-emerald-400 to-teal-500'
              : 'bg-gradient-to-b from-primary to-primary/70'
          }`}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm sm:text-base truncate">
                {session.patient_name || t('evaluation.patientNoName')}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                  isCompleted
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-primary/30 text-primary bg-primary/5 dark:bg-primary/10'
                }`}
              >
                {isCompleted ? t('evaluation.completed') : t('evaluation.inProgress')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <div className="flex gap-1 flex-wrap">
                {session.teeth.slice(0, 2).map((tooth) => (
                  <Badge key={tooth} variant="outline" className="text-[10px] font-mono px-1.5">
                    {formatToothLabel(tooth)}
                  </Badge>
                ))}
                {session.teeth.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    +{session.teeth.length - 2}
                  </Badge>
                )}
              </div>
              {session.hasDSD && (
                <Badge variant="outline" className="text-[10px] px-1.5 gap-1 border-violet-500/30 text-violet-600 dark:text-violet-400">
                  <Smile className="w-2.5 h-2.5" />
                  DSD
                </Badge>
              )}
              {session.treatmentTypes.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {session.treatmentTypes.map(type => {
                    const config = getTreatmentConfig(type);
                    return (
                      <Badge key={type} variant="outline" className="text-[10px] px-1.5 gap-1">
                        <config.icon className="w-2.5 h-2.5" />
                        {t(config.shortLabelKey)}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="hidden sm:inline">
              {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
              {session.patientAge && <span> · {t('dashboard.session.yearsOld', { age: session.patientAge })}</span>}
            </span>
            <span className="sm:hidden">
              {format(new Date(session.created_at), 'dd/MM', { locale: ptBR })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>
    </Link>
  );
}
