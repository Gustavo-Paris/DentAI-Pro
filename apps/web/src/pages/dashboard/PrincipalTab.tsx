import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageClinicActivityFeed } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import type { ActivityFeedItem } from '@parisgroup-ai/domain-odonto-ai/dashboard';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { WizardDraft } from '@/hooks/useWizardDraft';
import { Button, Card, Badge } from '@parisgroup-ai/pageshell/primitives';
import { ListSkeleton, ActivityFeedSkeleton } from '@/components/skeletons';
import {
  FileText, FileWarning, ChevronRight, ArrowRight, Plus,
  Sparkles, Users, Package, Settings, Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/date-utils';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useSubscription } from '@/hooks/useSubscription';
import { SessionCard } from './SessionCard';

// ---------------------------------------------------------------------------
// Color tokens — centralized hardcoded gradients
// ---------------------------------------------------------------------------

/** Left-accent bar for draft cards (primary brand) */
const DRAFT_ACCENT_GRADIENT = 'bg-gradient-to-b from-primary to-primary/70';

/** Left-accent bar for pending evaluations (amber → orange warning) */
const PENDING_ACCENT_GRADIENT = 'bg-gradient-to-b from-warning to-warning/70';

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
    <Card className="relative overflow-hidden p-3 sm:p-4 animate-scale-in ai-shimmer-border">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${DRAFT_ACCENT_GRADIENT}`} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="w-4 h-4 text-primary" aria-hidden="true" />
            <p className="font-semibold text-sm sm:text-base">
              {draft.formData?.patientName || t('evaluation.patientNoName')}
            </p>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 dark:bg-primary/10 font-semibold uppercase tracking-wider">
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
                locale: getDateLocale(),
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
            <Button size="sm" className="btn-glow text-xs shadow-sm" aria-label={t('dashboard.draft.continueLabel')}>
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
      <div className="space-y-3">
        {pendingDraft && (
          <DraftCard draft={pendingDraft} onDiscard={onDiscardDraft} />
        )}
        {pendingSessions > 0 && (
          <Link to="/evaluations">
            <Card className="group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer dark:bg-gradient-to-br dark:from-card dark:to-card/80 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 glow-card">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent dark:block hidden pointer-events-none" />
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${PENDING_ACCENT_GRADIENT}`} />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <FileWarning className="w-4 h-4 text-warning" aria-hidden="true" />
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
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground" aria-label={t('dashboard.recent.viewAllLabel')}>
            <span className="hidden sm:inline">{t('dashboard.recent.viewAll')}</span>
            <span className="sm:hidden">{t('dashboard.recent.all')}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : sessions.length === 0 ? (
        <Card className="p-8 sm:p-10 text-center">
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
        <div className="space-y-3 stagger-enter">
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

// ActivityFeedSkeleton imported from @/components/skeletons

function ActivityFeedSection({ sessions, loading }: { sessions: DashboardSession[]; loading: boolean }) {
  const { t } = useTranslation();
  if (loading) return <ActivityFeedSkeleton />;
  if (sessions.length === 0) return null;

  const items: ActivityFeedItem[] = sessions.flatMap((session) => {
    const feedItems: ActivityFeedItem[] = [];
    const relativeTime = formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: getDateLocale() });
    feedItems.push({
      id: session.session_id,
      type: 'treatment' as const,
      title: session.patient_name || t('dashboard.session.unnamedCase', {
        date: format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() }),
        count: session.teeth.length,
      }),
      description: `${t('evaluation.case', { count: session.teeth.length })} \u2022 ${session.treatmentTypes.join(', ')}`,
      timestamp: relativeTime,
    });
    if (session.hasDSD) {
      feedItems.push({
        id: `${session.session_id}-dsd`,
        type: 'patient' as const,
        title: t('dsd.simulation'),
        description: session.patient_name || t('dashboard.activityFeed.dsdCompleted'),
        timestamp: relativeTime,
      });
    }
    return feedItems;
  });

  return (
    <PageClinicActivityFeed
      items={items}
      maxItems={8}
      title={t('dashboard.activityFeed.title')}
      emptyText={t('dashboard.activityFeed.empty')}
    />
  );
}

// ---------------------------------------------------------------------------
// HeroCard — prominent CTA for existing users
// ---------------------------------------------------------------------------

function HeroCard() {
  const { t } = useTranslation();
  const { getCreditCost } = useSubscription();
  const totalCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
  return (
    <Link to="/new-case">
      <Card className="group relative overflow-hidden p-5 sm:p-6 rounded-xl glass-panel bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ai-shimmer-border">
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 shrink-0 transition-transform duration-200 group-hover:scale-110 glow-icon">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg font-display">{t('dashboard.hero.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.hero.subtitle')}</p>
            <span className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3 text-primary" />
              {t('dashboard.hero.credits', { count: totalCost })}
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// QuickActions — compact navigation shortcuts
// ---------------------------------------------------------------------------

function QuickActions() {
  const { t } = useTranslation();
  const actions = [
    { to: '/patients', icon: Users, label: t('dashboard.myPatients') },
    { to: '/inventory', icon: Package, label: t('dashboard.myInventory') },
    { to: '/profile', icon: Settings, label: t('nav.profile') },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to}>
          <Card className="group glass-panel p-3 sm:p-4 rounded-xl text-center hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate w-full">{label}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PrincipalTab
// ---------------------------------------------------------------------------

export function PrincipalTab({
  sessions,
  loading,
  pendingDraft,
  pendingSessions,
  onDiscardDraft,
}: {
  sessions: DashboardSession[];
  loading: boolean;
  pendingDraft: WizardDraft | null;
  pendingSessions: number;
  onDiscardDraft: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero + Quick Actions */}
      <div className="space-y-4">
        <HeroCard />
        <QuickActions />
      </div>

      {/* Glow divider */}
      <div className="glow-divider" aria-hidden="true" />

      {/* Pending actions */}
      <PendingActions
        pendingDraft={pendingDraft}
        pendingSessions={pendingSessions}
        onDiscardDraft={onDiscardDraft}
      />

      {/* 2-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <RecentSessions sessions={sessions} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeedSection sessions={sessions} loading={loading} />
        </div>
      </div>
    </div>
  );
}
