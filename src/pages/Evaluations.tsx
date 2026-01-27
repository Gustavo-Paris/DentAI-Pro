import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvaluationsList } from '@/hooks/queries/useEvaluations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogOut, ArrowLeft, ChevronRight, CheckCircle, FileText, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LocationState {
  newSessionId?: string;
  patientName?: string;
  teethCount?: number;
}

type FilterStatus = 'all' | 'pending' | 'completed';

export default function Evaluations() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const newSessionId = locationState?.newSessionId;
  const teethCount = locationState?.teethCount || 0;

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(0);
  const [allSessions, setAllSessions] = useState<Array<{
    session_id: string;
    patient_name: string | null;
    created_at: string;
    teeth: string[];
    evaluationCount: number;
    completedCount: number;
  }>>([]);

  const { data, isLoading, isFetching } = useEvaluationsList(page, 20);

  // Accumulate sessions across pages
  useEffect(() => {
    if (data?.sessions) {
      if (page === 0) {
        setAllSessions(data.sessions);
      } else {
        setAllSessions(prev => [...prev, ...data.sessions]);
      }
    }
  }, [data, page]);

  // Clear state after viewing to prevent stale highlights on refresh
  useEffect(() => {
    if (newSessionId) {
      window.history.replaceState({}, document.title);
    }
  }, [newSessionId]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredSessions = allSessions.filter((session) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return session.completedCount < session.evaluationCount;
    if (filter === 'completed') return session.completedCount === session.evaluationCount;
    return true;
  });

  const getStatusBadge = (session: { completedCount: number; evaluationCount: number }) => {
    if (session.completedCount === session.evaluationCount) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <CheckCircle className="w-3 h-3" />
          <span className="hidden sm:inline">Finalizado</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        <span className="hidden sm:inline">Em progresso</span>
        <span className="text-muted-foreground">({session.completedCount}/{session.evaluationCount})</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-lg sm:text-xl font-semibold tracking-tight">Avaliações</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Success Banner for New Session */}
        {newSessionId && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">
                Avaliação criada com {teethCount} caso{teethCount > 1 ? 's' : ''}!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                A avaliação nova está destacada abaixo.
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar:</span>
            <Select value={filter} onValueChange={(value: FilterStatus) => setFilter(value)}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Em progresso</SelectItem>
                <SelectItem value="completed">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredSessions.length} de {data?.totalCount ?? 0} avaliação(ões)
          </p>
        </div>

        {/* Sessions List */}
        {isLoading && page === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FileText className="w-10 sm:w-12 h-10 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'all'
                ? 'Você ainda não criou nenhuma avaliação.'
                : `Nenhuma avaliação com status "${filter === 'pending' ? 'em progresso' : 'finalizada'}".`
              }
            </p>
            <Link to="/new-case">
              <Button>Criar primeira avaliação</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                <Card
                  className={`p-3 sm:p-4 hover:bg-secondary/50 transition-colors cursor-pointer ${
                    newSessionId === session.session_id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base">
                          {session.patient_name || 'Paciente sem nome'}
                        </p>
                        {newSessionId === session.session_id && (
                          <Badge variant="secondary" className="text-xs">Nova</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {session.evaluationCount} dente{session.evaluationCount > 1 ? 's' : ''}
                        </p>
                        <span className="text-muted-foreground hidden sm:inline">•</span>
                        <div className="flex gap-1 flex-wrap">
                          {session.teeth.slice(0, 3).map((tooth) => (
                            <Badge key={tooth} variant="outline" className="text-xs">
                              {tooth}
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
                      {getStatusBadge(session)}
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
                        </span>
                        <span className="sm:hidden">
                          {format(new Date(session.created_at), "dd/MM", { locale: ptBR })}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {/* Load More Button */}
            {data?.hasMore && (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="w-full mt-4"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
