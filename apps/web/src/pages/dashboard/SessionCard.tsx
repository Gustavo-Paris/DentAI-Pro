import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { Card, Badge } from '@parisgroup-ai/pageshell/primitives';
import { ChevronRight, Smile } from 'lucide-react';
import { getTreatmentConfig } from '@/lib/treatment-config';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';

// ---------------------------------------------------------------------------
// Status-based style tokens (semantic colors for completed / in-progress)
// ---------------------------------------------------------------------------

const STATUS_STYLES = {
  completed: {
    accent: 'bg-gradient-to-b from-success to-success/70',
    bar: 'bg-success',
    badge: 'border-success/30 text-success bg-success/5 dark:bg-success/10',
  },
  inProgress: {
    accent: 'bg-gradient-to-b from-primary to-primary/70',
    bar: 'bg-primary',
    badge: 'border-primary/30 text-primary bg-primary/5 dark:bg-primary/10',
  },
} as const;

const DSD_BADGE_CLASS = 'border-accent/30 text-accent';

export function SessionCard({ session }: { session: DashboardSession }) {
  const { t } = useTranslation();
  const isCompleted = session.completedCount === session.evaluationCount;
  const progressPercent = session.evaluationCount > 0
    ? (session.completedCount / session.evaluationCount) * 100
    : 0;

  return (
    <Link to={`/evaluation/${session.session_id}`} aria-label={`${session.patient_name || t('dashboard.session.unnamedCase', { date: format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() }), count: session.teeth.length })} — ${t('evaluation.case', { count: session.evaluationCount })}`}>
      <Card className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer dark:bg-gradient-to-br dark:from-card dark:to-card/80 card-interactive glow-card">
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${
            isCompleted
              ? STATUS_STYLES.completed.accent
              : STATUS_STYLES.inProgress.accent
          }`}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm sm:text-base truncate">
                {session.patient_name || t('dashboard.session.unnamedCase', {
                  date: format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() }),
                  count: session.teeth.length,
                })}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                  isCompleted
                    ? STATUS_STYLES.completed.badge
                    : STATUS_STYLES.inProgress.badge
                }`}
              >
                {isCompleted ? t('evaluation.completed') : t('evaluation.inProgress')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <p className="text-xs text-muted-foreground">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              {session.hasDSD && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 gap-1 ${DSD_BADGE_CLASS}`}>
                    <Smile className="w-2.5 h-2.5" aria-hidden="true" />
                    DSD
                  </Badge>
                </>
              )}
              {session.treatmentTypes.length > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex gap-1.5 flex-wrap">
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
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="hidden sm:inline">
              {format(new Date(session.created_at), getDateFormat('short'), { locale: getDateLocale() })}
              {session.patientAge && <span> · {t('dashboard.session.yearsOld', { age: session.patientAge })}</span>}
            </span>
            <span className="sm:hidden">
              {format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100} aria-label={t('evaluation.progress')}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? STATUS_STYLES.completed.bar : STATUS_STYLES.inProgress.bar}`}
            style={{ width: `${progressPercent}%`, boxShadow: `0 0 8px rgb(var(${isCompleted ? '--color-success-rgb' : '--color-primary-rgb'}) / 0.4)` }}
          />
        </div>
      </Card>
    </Link>
  );
}
