import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ModuleConfig } from '@parisgroup-ai/pageshell/composites';
import { PageClinicActivityFeed } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import type { ActivityFeedItem } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { WizardDraft } from '@/hooks/useWizardDraft';
import { Button, Card, Badge, Skeleton } from '@parisgroup-ai/pageshell/primitives';
import {
  FileText, FileWarning, ChevronRight, ArrowRight, Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScrollReveal, useScrollRevealChildren } from '@/hooks/useScrollReveal';
import { SessionCard } from './SessionCard';

// ---------------------------------------------------------------------------
// DraftCard (pending action)
// ---------------------------------------------------------------------------

function DraftCard({
  draft,
  onDiscard,
}: {
  draft: WizardDraft;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const teethCount = draft.selectedTeeth?.length || 0;

  return (
    <Card className="relative overflow-hidden p-3 sm:p-4 animate-scale-in">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/70" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="w-4 h-4 text-primary" aria-hidden="true" />
            <p className="font-semibold text-sm sm:text-base">
              {draft.formData?.patientName || t('evaluation.patientNoName')}
            </p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 dark:bg-primary/10 font-semibold uppercase tracking-wider">
              {t('dashboard.draft.badge')}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {t('dashboard.draft.teethSelected', { count: teethCount })}
            </p>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.draft.savedAgo', { time: formatDistanceToNow(new Date(draft.lastSavedAt), {
                addSuffix: true,
                locale: ptBR,
              }) })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
            onClick={onDiscard}
            aria-label={t('dashboard.draft.discardLabel')}
          >
            {t('common.discard')}
          </Button>
          <Link to="/new-case">
            <Button size="sm" className="btn-glow-gold text-xs shadow-sm" aria-label={t('dashboard.draft.continueLabel')}>
              {t('dashboard.draft.continue')}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pending Actions Section
// ---------------------------------------------------------------------------

function PendingActions({
  pendingDraft,
  pendingSessions,
  onDiscardDraft,
}: {
  pendingDraft: WizardDraft | null;
  pendingSessions: number;
  onDiscardDraft: () => void;
}) {
  const { t } = useTranslation();

  if (!pendingDraft && pendingSessions === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground mb-3">
        {t('dashboard.pending.title')}
      </h2>
      <div className="space-y-2">
        {pendingDraft && (
          <DraftCard draft={pendingDraft} onDiscard={onDiscardDraft} />
        )}
        {pendingSessions > 0 && (
          <Link to="/evaluations">
            <Card className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-orange-500" />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <FileWarning className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    <p className="text-sm font-semibold">
                      {t('dashboard.pending.openEvaluations', { count: pendingSessions })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {t('dashboard.pending.tapToComplete')}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Sessions
// ---------------------------------------------------------------------------

function RecentSessions({
  sessions,
  loading,
}: {
  sessions: DashboardSession[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="scroll-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
          {t('dashboard.recent.title')}
        </h2>
        <Link to="/evaluations">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" aria-label={t('dashboard.recent.viewAllLabel')}>
            <span className="hidden sm:inline">{t('dashboard.recent.viewAll')}</span>
            <span className="sm:hidden">{t('dashboard.recent.all')}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="grain-overlay p-8 sm:p-10 text-center">
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium font-display text-sm mb-1 text-primary">{t('dashboard.recent.emptyTitle')}</p>
              <p className="text-xs text-muted-foreground mb-4">{t('dashboard.recent.emptyDescription')}</p>
            </div>
            <Link to="/new-case">
              <Button size="sm" aria-label={t('dashboard.recent.createFirstLabel')}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t('dashboard.recent.createFirst')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionCard key={session.session_id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed Section
// ---------------------------------------------------------------------------

function ActivityFeedSection({ sessions }: { sessions: DashboardSession[] }) {
  const { t } = useTranslation();
  if (sessions.length === 0) return null;

  const items: ActivityFeedItem[] = sessions.flatMap((session) => {
    const feedItems: ActivityFeedItem[] = [];
    feedItems.push({
      id: session.session_id,
      type: 'treatment' as const,
      title: session.patient_name || t('evaluation.patientNoName'),
      description: `${session.teeth.length} ${session.teeth.length === 1 ? t('patients.caseOne', { defaultValue: 'caso' }) : t('patients.caseOther', { defaultValue: 'casos' })} \u2022 ${session.treatmentTypes.join(', ')}`,
      timestamp: session.created_at,
    });
    if (session.hasDSD) {
      feedItems.push({
        id: `${session.session_id}-dsd`,
        type: 'patient' as const,
        title: t('dsd.simulation', { defaultValue: 'Simulação DSD' }),
        description: session.patient_name || '',
        timestamp: session.created_at,
      });
    }
    return feedItems;
  });

  return (
    <PageClinicActivityFeed
      items={items}
      maxItems={8}
      title={t('dashboard.activityFeed.title', { defaultValue: 'Atividade Recente' })}
      emptyText={t('dashboard.activityFeed.empty', { defaultValue: 'Nenhuma atividade recente' })}
    />
  );
}

// ---------------------------------------------------------------------------
// PrincipalTab
// ---------------------------------------------------------------------------

export function PrincipalTab({
  modules,
  sessions,
  loading,
  pendingDraft,
  pendingSessions,
  onDiscardDraft,
}: {
  modules: ModuleConfig[];
  sessions: DashboardSession[];
  loading: boolean;
  pendingDraft: WizardDraft | null;
  pendingSessions: number;
  onDiscardDraft: () => void;
}) {
  const modulesRef = useScrollRevealChildren();

  return (
    <div className="space-y-6">
      {/* Module cards */}
      <div ref={modulesRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          const isPrimary = mod.variant === 'primary';
          return (
            <Link key={mod.id} to={mod.href!} className={`scroll-reveal scroll-reveal-delay-${i + 1}`}>
              <Card className={`group relative overflow-hidden p-4 sm:p-5 rounded-xl transition-all duration-300 cursor-pointer h-full hover:shadow-md hover:-translate-y-0.5 ${isPrimary ? 'bg-primary text-primary-foreground shadow-md' : 'border border-border/50 hover:border-border shadow-sm'}`}>
                {!isPrimary && <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                <div className="relative flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110 ${isPrimary ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary/15'}`}>
                    {Icon && <Icon className={`w-5 h-5 ${isPrimary ? '' : 'text-primary'}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{mod.title}</h3>
                    <p className={`text-xs ${isPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{mod.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform ${isPrimary ? 'text-primary-foreground/60' : 'text-muted-foreground/40'}`} aria-hidden="true" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pending actions */}
      <PendingActions
        pendingDraft={pendingDraft}
        pendingSessions={pendingSessions}
        onDiscardDraft={onDiscardDraft}
      />

      {/* Recent sessions */}
      <RecentSessions
        sessions={sessions}
        loading={loading}
      />

      {/* Activity Feed */}
      <ActivityFeedSection sessions={sessions} />
    </div>
  );
}
