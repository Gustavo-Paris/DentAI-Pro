import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, FileText, Calendar, Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evaluation {
  id: string;
  created_at: string;
  tooth: string;
  cavity_class: string;
  patient_name: string | null;
  session_id: string | null;
  status: string | null;
  recommendation_text: string | null;
  recommended_resin_id: string | null;
  resins?: {
    name: string;
    manufacturer: string;
  } | null;
}

interface Session {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
}

interface Profile {
  full_name: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingCases, setPendingCases] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      // Fetch evaluations and group by session_id
      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select(`
          id,
          created_at,
          tooth,
          cavity_class,
          patient_name,
          session_id,
          status,
          recommendation_text,
          recommended_resin_id,
          resins!recommended_resin_id (
            name,
            manufacturer
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (evaluationsData) {
        // Count only pending cases (not completed)
        const pendingCount = evaluationsData.filter(
          e => e.status !== 'completed'
        ).length;
        setPendingCases(pendingCount);
        
        // Group by session_id
        const sessionMap = new Map<string, Evaluation[]>();
        
        evaluationsData.forEach(evaluation => {
          const sessionKey = evaluation.session_id || evaluation.id; // fallback to id for old records
          if (!sessionMap.has(sessionKey)) {
            sessionMap.set(sessionKey, []);
          }
          sessionMap.get(sessionKey)!.push(evaluation);
        });

        // Convert to array and take first 5 sessions
        const sessionsArray: Session[] = Array.from(sessionMap.entries())
          .slice(0, 5)
          .map(([sessionId, evals]) => ({
            session_id: sessionId,
            patient_name: evals[0].patient_name,
            created_at: evals[0].created_at,
            teeth: evals.map(e => e.tooth),
            evaluationCount: evals.length,
          }));

        setSessions(sessionsArray);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-lg sm:text-xl font-semibold tracking-tight">ResinMatch AI</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">Olá, {firstName}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Bem-vindo ao seu painel</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-medium mb-1">Nova Avaliação</h3>
                <p className="text-sm text-muted-foreground">Análise com IA para resina ideal</p>
              </div>
              <Link to="/new-case" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-medium mb-1">Meu Inventário</h3>
                <p className="text-sm text-muted-foreground">Gerencie suas resinas disponíveis</p>
              </div>
              <Link to="/inventory" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Package className="w-4 h-4 mr-2" />
                  Ver
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <p className={`text-2xl sm:text-3xl font-semibold ${pendingCases > 0 ? 'text-amber-600' : 'text-primary'}`}>
                  {pendingCases}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingCases === 0 ? 'Todos finalizados!' : 'Aguardando finalização'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-medium">Avaliações recentes</h2>
            <Link to="/evaluations">
              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3">
                <span className="hidden sm:inline">Ver todas as avaliações</span>
                <span className="sm:hidden">Ver todas</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <FileText className="w-8 sm:w-10 h-8 sm:h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhuma avaliação ainda</p>
              <Link to="/new-case">
                <Button>Criar primeira avaliação</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                  <Card className="p-3 sm:p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">
                          {session.patient_name || 'Paciente sem nome'}
                        </p>
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
                      <div className="flex items-center justify-between sm:justify-end gap-2 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          {format(new Date(session.created_at), "d 'de' MMM", { locale: ptBR })}
                        </div>
                        <ChevronRight className="w-4 h-4" />
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
  );
}
