import { Link } from 'react-router-dom';
import { DashboardModuleCard } from '@pageshell/composites/dashboard';
import type { ModuleConfig } from '@pageshell/composites/dashboard';
import type { DashboardSession } from '@/hooks/domain/useDashboard';
import { WizardDraft } from '@/hooks/useWizardDraft';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  return (
    <Card className="relative overflow-hidden p-3 sm:p-4 animate-scale-in">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/70" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="w-4 h-4 text-primary" aria-hidden="true" />
            <p className="font-semibold text-sm sm:text-base">
              {draft.formData?.patientName || 'Paciente sem nome'}
            </p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 dark:bg-primary/10 font-semibold uppercase tracking-wider">
              Rascunho
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {draft.selectedTeeth?.length || 0} dente{(draft.selectedTeeth?.length || 0) !== 1 ? 's' : ''} selecionado{(draft.selectedTeeth?.length || 0) !== 1 ? 's' : ''}
            </p>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <p className="text-xs text-muted-foreground">
              Salvo {formatDistanceToNow(new Date(draft.lastSavedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
            onClick={onDiscard}
            aria-label="Descartar rascunho"
          >
            Descartar
          </Button>
          <Link to="/new-case">
            <Button size="sm" className="btn-glow-gold text-xs shadow-sm" aria-label="Continuar avaliação">
              Continuar
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
  if (!pendingDraft && pendingSessions === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground mb-3">
        Ações Pendentes
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
                      {pendingSessions} {pendingSessions !== 1 ? 'avaliações' : 'avaliação'} em aberto
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Toque para ver e concluir
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
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="scroll-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
          Avaliações recentes
        </h2>
        <Link to="/evaluations">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" aria-label="Ver todas as avaliações">
            <span className="hidden sm:inline">Ver todas</span>
            <span className="sm:hidden">Todas</span>
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
              <p className="font-medium font-display text-sm mb-1 text-primary">Nenhuma avaliação ainda</p>
              <p className="text-xs text-muted-foreground mb-4">Comece criando sua primeira avaliação com IA</p>
            </div>
            <Link to="/new-case">
              <Button size="sm" aria-label="Criar primeira avaliação">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Criar avaliação
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
        {modules.map((mod, i) => (
          <div key={mod.id} className={`scroll-reveal scroll-reveal-delay-${i + 1}`}>
            <DashboardModuleCard module={mod} />
          </div>
        ))}
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
    </div>
  );
}
