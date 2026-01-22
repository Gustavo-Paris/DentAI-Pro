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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  LogOut, 
  ArrowLeft, 
  Eye, 
  FileDown, 
  CheckCircle, 
  MoreHorizontal,
  Calendar,
  User,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface StratificationProtocol {
  checklist?: string[];
  layers?: unknown[];
  [key: string]: unknown;
}

interface EvaluationItem {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  resins?: {
    name: string;
    manufacturer: string;
  } | null;
}

export default function EvaluationDetails() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluationData();
  }, [user, evaluationId]);

  const fetchEvaluationData = async () => {
    if (!user || !evaluationId) return;

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
        checklist_progress,
        stratification_protocol,
        resins!recommended_resin_id (
          name,
          manufacturer
        )
      `)
      .eq('user_id', user.id)
      .eq('session_id', evaluationId)
      .order('tooth', { ascending: true });

    if (error) {
      console.error('Error fetching evaluation:', error);
      toast.error('Erro ao carregar avaliação');
      navigate('/dashboard');
    } else if (data && data.length > 0) {
      setEvaluations(data as EvaluationItem[]);
      
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
      toast.error('Avaliação não encontrada');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Check if checklist is complete for a given evaluation
  const isChecklistComplete = (evaluation: EvaluationItem): boolean => {
    const protocol = evaluation.stratification_protocol;
    const checklist = protocol?.checklist || [];
    const progress = evaluation.checklist_progress || [];
    
    // If there's no checklist, consider it complete
    if (checklist.length === 0) return true;
    
    return progress.length >= checklist.length;
  };

  const handleMarkAsCompleted = async (id: string) => {
    const evaluation = evaluations.find(e => e.id === id);
    if (!evaluation) return;

    if (!isChecklistComplete(evaluation)) {
      toast.error('Complete todas as etapas do checklist antes de finalizar este caso');
      return;
    }

    const { error } = await supabase
      .from('evaluations')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Caso marcado como finalizado');
      fetchEvaluationData();
    }
  };

  const handleMarkAllAsCompleted = async () => {
    const pending = evaluations.filter(e => e.status !== 'completed');
    const completable = pending.filter(e => isChecklistComplete(e));

    if (pending.length === 0) {
      toast.info('Todos os casos já estão finalizados');
      return;
    }

    if (completable.length === 0) {
      toast.error('Nenhum caso pode ser finalizado. Complete os checklists primeiro.');
      return;
    }

    const { error } = await supabase
      .from('evaluations')
      .update({ status: 'completed' })
      .in('id', completable.map(e => e.id));

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      const skipped = pending.length - completable.length;
      if (skipped > 0) {
        toast.success(`${completable.length} caso(s) finalizado(s). ${skipped} caso(s) aguardando checklist.`);
      } else {
        toast.success(`${completable.length} caso(s) marcado(s) como finalizado(s)`);
      }
      fetchEvaluationData();
    }
  };

  const handleExportPDF = (id: string) => {
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info('Abrindo página para impressão...');
  };

  const getChecklistProgress = (evaluation: EvaluationItem): { current: number; total: number } => {
    const protocol = evaluation.stratification_protocol;
    const checklist = protocol?.checklist || [];
    const progress = evaluation.checklist_progress || [];
    return { current: progress.length, total: checklist.length };
  };

  const getStatusBadge = (evaluation: EvaluationItem) => {
    if (evaluation.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <CheckCircle className="w-3 h-3" />
          Finalizado
        </span>
      );
    }
    
    const { current, total } = getChecklistProgress(evaluation);
    const hasChecklist = total > 0;
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        Planejado
        {hasChecklist && (
          <span className="text-muted-foreground">({current}/{total})</span>
        )}
      </span>
    );
  };

  const canMarkAsCompleted = (evaluation: EvaluationItem): boolean => {
    return evaluation.status !== 'completed' && isChecklistComplete(evaluation);
  };

  const patientName = evaluations[0]?.patient_name || 'Paciente sem nome';
  const evaluationDate = evaluations[0]?.created_at 
    ? format(new Date(evaluations[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';
  const completedCount = evaluations.filter(e => e.status === 'completed').length;

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
            <span className="text-xl font-semibold tracking-tight">Detalhes da Avaliação</span>
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
            {/* Evaluation Header */}
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

                  {/* Evaluation Info */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold mb-2">{patientName}</h1>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {evaluationDate}
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
                Marcar todos como concluídos
              </Button>
            </div>

            {/* Cases Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Casos Gerados</CardTitle>
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
                        <TableCell>{getStatusBadge(evaluation)}</TableCell>
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
                                Ver caso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPDF(evaluation.id)}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Exportar PDF
                              </DropdownMenuItem>
                              {evaluation.status !== 'completed' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem 
                                      onClick={() => handleMarkAsCompleted(evaluation.id)}
                                      disabled={!canMarkAsCompleted(evaluation)}
                                      className={!canMarkAsCompleted(evaluation) ? 'opacity-50' : ''}
                                    >
                                      {canMarkAsCompleted(evaluation) ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Marcar como finalizado
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  {!canMarkAsCompleted(evaluation) && (
                                    <TooltipContent>
                                      Complete o checklist para finalizar
                                    </TooltipContent>
                                  )}
                                </Tooltip>
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
