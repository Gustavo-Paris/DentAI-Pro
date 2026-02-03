import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useDashboardData } from '@/hooks/queries/useDashboard';
import { useWizardDraft, WizardDraft } from '@/hooks/useWizardDraft';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogOut, Plus, FileText, Package, ChevronRight, Search, FileWarning, TrendingUp, Users, CheckCircle2, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BRAND_NAME } from '@/lib/branding';
import { useSubscription } from '@/hooks/useSubscription';
import { CreditBadge } from '@/components/CreditBadge';

interface Session {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);

  const { data: profileData, isLoading: loadingProfile } = useProfile();
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboardData();
  const { creditsRemaining, creditsTotal, isLoading: loadingCredits } = useSubscription();
  const { loadDraft, clearDraft } = useWizardDraft(user?.id);

  const loading = loadingProfile || loadingDashboard;
  const profile = profileData?.profile;
  const avatarUrl = profileData?.avatarUrl;
  const metrics = dashboardData?.metrics ?? {
    pendingCases: 0,
    weeklyEvaluations: 0,
    completionRate: 0,
    totalPatients: 0,
  };
  const sessions = dashboardData?.sessions ?? [];

  // Check for pending draft
  useEffect(() => {
    const checkDraft = async () => {
      if (user) {
        const draft = await loadDraft();
        if (draft) {
          setPendingDraft(draft);
        }
      }
    };
    checkDraft();
  }, [user, loadDraft]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setPendingDraft(null);
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

  // Compute week range for tooltip
  const weekRange = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    return {
      start: format(start, "d 'de' MMM", { locale: ptBR }),
      end: format(end, "d 'de' MMM, yyyy", { locale: ptBR }),
    };
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (session: Session) => {
    if (session.completedCount === session.evaluationCount) {
      return (
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
          Concluído
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
        Em progresso
      </Badge>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <span className="text-lg sm:text-xl font-semibold tracking-tight">{BRAND_NAME}</span>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      const event = new KeyboardEvent('keydown', {
                        key: 'k',
                        metaKey: true,
                        bubbles: true,
                      });
                      document.dispatchEvent(event);
                    }}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary rounded-md border border-border transition-colors"
                    aria-label="Abrir busca global (⌘K)"
                  >
                    <Search className="w-4 h-4" />
                    <span>Buscar...</span>
                    <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-background rounded border border-border">
                      ⌘K
                    </kbd>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Buscar pacientes, avaliações e ações</p>
                </TooltipContent>
              </Tooltip>
              <CreditBadge variant="compact" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/profile" aria-label="Acessar meu perfil">
                    <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                      <AvatarImage src={avatarUrl || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="text-xs bg-primary/10">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Meu perfil</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sair da conta">
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Encerrar sessão</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-xl sm:text-2xl font-semibold mb-1">Olá, {firstName}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Bem-vindo ao seu painel</p>
          </div>

          {/* Value Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 sm:p-4 hover-scale cursor-default animate-fade-in" style={{ animationDelay: '0.05s' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <FileWarning className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">Em aberto</p>
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className={`text-xl sm:text-2xl font-semibold ${metrics.pendingCases > 0 ? 'text-amber-600' : 'text-primary'}`}>
                      {metrics.pendingCases}
                    </p>
                  )}
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Casos aguardando conclusão do checklist</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 sm:p-4 hover-scale cursor-default animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-semibold">
                      {metrics.weeklyEvaluations}
                    </p>
                  )}
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{weekRange.start} - {weekRange.end}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 sm:p-4 hover-scale cursor-default animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">Conclusão</p>
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-semibold text-primary">
                      {metrics.completionRate}%
                    </p>
                  )}
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Taxa de casos concluídos vs. total</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-3 sm:p-4 hover-scale cursor-default animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">Pacientes</p>
                  </div>
                  {loading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-semibold">
                      {metrics.totalPatients}
                    </p>
                  )}
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pacientes únicos cadastrados</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6 animate-fade-in border-primary/20 bg-primary/5" style={{ animationDelay: '0.25s' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium mb-1">Nova Avaliação</h3>
                  <p className="text-sm text-muted-foreground">
                    Análise com IA
                    <span className="inline-flex items-center gap-1 ml-2 text-xs text-primary font-medium">
                      <Zap className="w-3 h-3" /> 3 créditos
                    </span>
                  </p>
                </div>
                <Link to="/new-case" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto" aria-label="Iniciar nova avaliação">
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Iniciar
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium mb-1">Meus Pacientes</h3>
                  <p className="text-sm text-muted-foreground">{metrics.totalPatients} cadastrados</p>
                </div>
                <Link to="/patients" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto" aria-label="Ver lista de pacientes">
                    <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                    Ver
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium mb-1">Meu Inventário</h3>
                  <p className="text-sm text-muted-foreground">Resinas disponíveis</p>
                </div>
                <Link to="/inventory" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto" aria-label="Ver inventário de resinas">
                    <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                    Ver
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Sessions */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-medium">Avaliações recentes</h2>
              <Link to="/evaluations">
                <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3" aria-label="Ver todas as avaliações">
                  <span className="hidden sm:inline">Ver todas as avaliações</span>
                  <span className="sm:hidden">Ver todas</span>
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : sessions.length === 0 && !pendingDraft ? (
              <Card className="p-6 sm:p-8 text-center">
                <FileText className="w-8 sm:w-10 h-8 sm:h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <p className="text-muted-foreground mb-4">Nenhuma avaliação ainda</p>
                <Link to="/new-case">
                  <Button aria-label="Criar primeira avaliação">Criar primeira avaliação</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Draft as first item if exists */}
                {pendingDraft && (
                  <Card className="p-3 sm:p-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 animate-scale-in">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileWarning className="w-4 h-4 text-amber-600" aria-hidden="true" />
                          <p className="font-medium text-sm sm:text-base">
                            {pendingDraft.formData?.patientName || 'Paciente sem nome'}
                          </p>
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 bg-amber-100 dark:bg-amber-900/50">
                            Rascunho
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {pendingDraft.selectedTeeth?.length || 0} dente{(pendingDraft.selectedTeeth?.length || 0) !== 1 ? 's' : ''} selecionado{(pendingDraft.selectedTeeth?.length || 0) !== 1 ? 's' : ''}
                          </p>
                          <span className="text-muted-foreground" aria-hidden="true">•</span>
                          <p className="text-xs text-muted-foreground">
                            Salvo {formatDistanceToNow(new Date(pendingDraft.lastSavedAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900/50"
                          onClick={handleDiscardDraft}
                          aria-label="Descartar rascunho"
                        >
                          Descartar
                        </Button>
                        <Link to="/new-case">
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" aria-label="Continuar avaliação">
                            Continuar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                )}

              {/* Regular sessions */}
              {sessions.map((session) => (
                <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                  <Card className="p-3 sm:p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {session.patient_name || 'Paciente sem nome'}
                          </p>
                          {getStatusBadge(session)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {session.evaluationCount} dente{session.evaluationCount > 1 ? 's' : ''}
                          </p>
                          <span className="text-muted-foreground hidden sm:inline">•</span>
                          <div className="flex gap-1 flex-wrap">
                            {session.teeth.slice(0, 2).map((tooth) => (
                              <Badge key={tooth} variant="outline" className="text-xs">
                                {tooth}
                              </Badge>
                            ))}
                            {session.teeth.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{session.teeth.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
                        <span className="hidden sm:inline">
                          {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
                        </span>
                        <span className="sm:hidden">
                          {format(new Date(session.created_at), "dd/MM", { locale: ptBR })}
                        </span>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
