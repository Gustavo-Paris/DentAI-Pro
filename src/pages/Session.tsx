import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  ArrowLeft, 
  Eye, 
  FileDown, 
  CheckCircle, 
  MoreHorizontal,
  Calendar,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface SessionEvaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  resins?: {
    name: string;
    manufacturer: string;
  } | null;
}

export default function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [evaluations, setEvaluations] = useState<SessionEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, [user, sessionId]);

  const fetchSessionData = async () => {
    if (!user || !sessionId) return;

    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        created_at,
        patient_name,
        tooth,
        cavity_class,
        restoration_size,
        status,
        photo_frontal,
        resins!recommended_resin_id (
          name,
          manufacturer
        )
      `)
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('tooth', { ascending: true });

    if (error) {
      console.error('Error fetching session:', error);
      toast.error('Erro ao carregar sessão');
      navigate('/dashboard');
    } else if (data && data.length > 0) {
      setEvaluations(data);
      
      // Load photo if available
      const photoPath = data[0]?.photo_frontal;
      if (photoPath) {
        const { data: urlData } = await supabase.storage
          .from('clinical-photos')
          .createSignedUrl(photoPath, 3600);
        if (urlData?.signedUrl) {
          setPhotoUrl(urlData.signedUrl);
        }
      }
    } else {
      toast.error('Sessão não encontrada');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMarkAsCompleted = async (id: string) => {
    const { error } = await supabase
      .from('evaluations')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Caso marcado como finalizado');
      fetchSessionData();
    }
  };

  const handleMarkAllAsCompleted = async () => {
    const pendingIds = evaluations
      .filter(e => e.status !== 'completed')
      .map(e => e.id);

    if (pendingIds.length === 0) {
      toast.info('Todos os casos já estão finalizados');
      return;
    }

    const { error } = await supabase
      .from('evaluations')
      .update({ status: 'completed' })
      .in('id', pendingIds);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`${pendingIds.length} caso(s) marcado(s) como finalizado(s)`);
      fetchSessionData();
    }
  };

  const handleExportPDF = (id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info('Abrindo página para impressão...');
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <CheckCircle className="w-3 h-3" />
          Finalizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        Planejado
      </span>
    );
  };

  const patientName = evaluations[0]?.patient_name || 'Paciente sem nome';
  const sessionDate = evaluations[0]?.created_at 
    ? format(new Date(evaluations[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';
  const completedCount = evaluations.filter(e => e.status === 'completed').length;
  const teethList = evaluations.map(e => e.tooth).join(', ');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-xl font-semibold tracking-tight">Detalhes da Sessão</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Session Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photo Preview */}
                  {photoUrl && (
                    <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img 
                        src={photoUrl} 
                        alt="Foto clínica" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!photoUrl && (
                    <div className="w-full md:w-48 h-48 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Session Info */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold mb-2">{patientName}</h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {sessionDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {evaluations.length} dente(s)
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {evaluations.map(e => (
                        <Badge key={e.id} variant="outline">
                          Dente {e.tooth}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Progresso:</span>
                      <span className="font-medium">
                        {completedCount}/{evaluations.length} finalizados
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 mb-4">
              <Button 
                variant="outline" 
                onClick={handleMarkAllAsCompleted}
                disabled={completedCount === evaluations.length}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar todos como finalizados
              </Button>
            </div>

            {/* Teeth Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Protocolos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dente</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Resina</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.tooth}</TableCell>
                        <TableCell>{evaluation.cavity_class}</TableCell>
                        <TableCell className="capitalize">{evaluation.restoration_size}</TableCell>
                        <TableCell>
                          {evaluation.resins ? (
                            <div>
                              <p className="font-medium">{evaluation.resins.name}</p>
                              <p className="text-xs text-muted-foreground">{evaluation.resins.manufacturer}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/result/${evaluation.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver protocolo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPDF(evaluation.id)}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Exportar PDF
                              </DropdownMenuItem>
                              {evaluation.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => handleMarkAsCompleted(evaluation.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como finalizado
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
