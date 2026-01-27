import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
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
  AlertCircle,
  Layers,
  Crown,
  Stethoscope,
  ArrowUpRight,
  CircleX,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import type { StratificationProtocol, CementationProtocol } from '@/types/protocol';
import { AddTeethModal, PendingTooth } from '@/components/AddTeethModal';
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';

// Treatment type configuration
const treatmentConfig: Record<string, { 
  label: string; 
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  showCavityInfo: boolean;
}> = {
  resina: { 
    label: 'Resina Composta', 
    shortLabel: 'Resina',
    icon: Layers,
    variant: 'default',
    showCavityInfo: true 
  },
  porcelana: { 
    label: 'Faceta de Porcelana', 
    shortLabel: 'Faceta',
    icon: Crown,
    variant: 'secondary',
    showCavityInfo: false 
  },
  coroa: { 
    label: 'Coroa Total', 
    shortLabel: 'Coroa',
    icon: Crown,
    variant: 'secondary',
    showCavityInfo: false 
  },
  implante: { 
    label: 'Implante', 
    shortLabel: 'Implante',
    icon: CircleX,
    variant: 'outline',
    showCavityInfo: false 
  },
  endodontia: { 
    label: 'Endodontia', 
    shortLabel: 'Endo',
    icon: Stethoscope,
    variant: 'outline',
    showCavityInfo: false 
  },
  encaminhamento: { 
    label: 'Encaminhamento', 
    shortLabel: 'Encaminhar',
    icon: ArrowUpRight,
    variant: 'outline',
    showCavityInfo: false 
  },
};

interface EvaluationItem {
  id: string;
  created_at: string;
  patient_name: string | null;
  patient_id: string | null;
  patient_age: number;
  tooth: string;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  photo_frontal: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  treatment_type: string | null;
  ai_treatment_indication: string | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: { checklist?: string[] } | null;
  tooth_color: string;
  bruxism: boolean;
  aesthetic_level: string;
  budget: string;
  longevity_expectation: string;
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
  const [pendingTeeth, setPendingTeeth] = useState<PendingTooth[]>([]);
  const [showAddTeethModal, setShowAddTeethModal] = useState(false);

  useEffect(() => {
    fetchEvaluationData();
    fetchPendingTeeth();
  }, [user, evaluationId]);

  const fetchEvaluationData = async () => {
    if (!user || !evaluationId) return;

    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        created_at,
        patient_name,
        patient_id,
        patient_age,
        tooth,
        cavity_class,
        restoration_size,
        status,
        photo_frontal,
        checklist_progress,
        stratification_protocol,
        treatment_type,
        ai_treatment_indication,
        cementation_protocol,
        generic_protocol,
        tooth_color,
        bruxism,
        aesthetic_level,
        budget,
        longevity_expectation,
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
      setEvaluations(data as unknown as EvaluationItem[]);
      // Photo is now handled by OptimizedImage component
    } else {
      toast.error('Avaliação não encontrada');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const fetchPendingTeeth = async () => {
    if (!user || !evaluationId) return;

    const { data, error } = await supabase
      .from('session_detected_teeth')
      .select('*')
      .eq('session_id', evaluationId)
      .eq('user_id', user.id)
      .order('tooth', { ascending: true });

    if (error) {
      console.error('Error fetching pending teeth:', error);
    } else if (data) {
      setPendingTeeth(data as PendingTooth[]);
    }
  };

  const handleAddTeethSuccess = () => {
    fetchEvaluationData();
    fetchPendingTeeth();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get checklist based on treatment type
  const getChecklist = (evaluation: EvaluationItem): string[] => {
    const treatmentType = evaluation.treatment_type || 'resina';
    switch (treatmentType) {
      case 'porcelana':
        return (evaluation.cementation_protocol as CementationProtocol)?.checklist || [];
      case 'coroa':
      case 'implante':
      case 'endodontia':
      case 'encaminhamento':
        return evaluation.generic_protocol?.checklist || [];
      default: // resina
        return evaluation.stratification_protocol?.checklist || [];
    }
  };

  // Check if checklist is complete for a given evaluation
  const isChecklistComplete = (evaluation: EvaluationItem): boolean => {
    const checklist = getChecklist(evaluation);
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
    const checklist = getChecklist(evaluation);
    const progress = evaluation.checklist_progress || [];
    return { current: progress.length, total: checklist.length };
  };
  
  // Get clinical details based on treatment type
  const getClinicalDetails = (evaluation: EvaluationItem): string => {
    const treatmentType = evaluation.treatment_type || 'resina';
    const config = treatmentConfig[treatmentType];
    
    if (config?.showCavityInfo) {
      return `${evaluation.cavity_class} • ${evaluation.restoration_size}`;
    }
    
    // For other treatments, show AI indication or short description
    return evaluation.ai_treatment_indication || config?.label || '-';
  };
  
  // Get treatment badge
  const getTreatmentBadge = (evaluation: EvaluationItem) => {
    const treatmentType = evaluation.treatment_type || 'resina';
    const config = treatmentConfig[treatmentType] || treatmentConfig.resina;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className="w-3 h-3" />
        <span className="hidden md:inline">{config.shortLabel}</span>
      </Badge>
    );
  };

  const getStatusBadge = (evaluation: EvaluationItem) => {
    if (evaluation.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <CheckCircle className="w-3 h-3" />
          <span className="hidden sm:inline">Finalizado</span>
        </span>
      );
    }
    
    const { current, total } = getChecklistProgress(evaluation);
    const hasChecklist = total > 0;
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        <span className="hidden sm:inline">Planejado</span>
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-lg sm:text-xl font-semibold tracking-tight">
              <span className="hidden sm:inline">Detalhes da Avaliação</span>
              <span className="sm:hidden">Detalhes</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patientName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Evaluation Header */}
            <Card className="mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Photo Preview - Using optimized thumbnail */}
                  {evaluations[0]?.photo_frontal ? (
                    <ClinicalPhotoThumbnail
                      path={evaluations[0].photo_frontal}
                      alt="Foto clínica"
                      size="grid"
                      className="w-full md:w-32 lg:w-48 h-32 sm:h-48 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-full md:w-32 lg:w-48 h-32 sm:h-48 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 sm:w-12 h-8 sm:h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Evaluation Info */}
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-semibold mb-2">{patientName}</h1>
                    
                    <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{evaluationDate}</span>
                        <span className="sm:hidden">
                          {evaluations[0]?.created_at 
                            ? format(new Date(evaluations[0].created_at), "dd/MM/yyyy", { locale: ptBR })
                            : ''
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        {evaluations.length} dente(s)
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {evaluations.map(e => (
                        <Badge key={e.id} variant="outline" className="text-xs">
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
            <div className="flex flex-wrap justify-end gap-2 mb-4">
              {pendingTeeth.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddTeethModal(true)}
                  className="text-xs sm:text-sm border-primary/50 text-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar mais dentes</span>
                  <span className="sm:hidden">Adicionar</span>
                  <Badge variant="secondary" className="ml-1.5 text-xs">{pendingTeeth.length}</Badge>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsCompleted}
                disabled={completedCount === evaluations.length}
                className="text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Marcar todos como concluídos</span>
                <span className="sm:hidden">Concluir todos</span>
              </Button>
            </div>

            {/* Cases Table - Desktop */}
            <Card className="hidden sm:block">
              <CardHeader>
                <CardTitle className="text-lg">Casos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dente</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.tooth}</TableCell>
                        <TableCell>{getTreatmentBadge(evaluation)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground capitalize">
                            {getClinicalDetails(evaluation)}
                          </span>
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

            {/* Cases Cards - Mobile */}
            <div className="sm:hidden space-y-3">
              <h3 className="font-semibold text-lg">Casos Gerados</h3>
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTreatmentBadge(evaluation)}
                      <p className="font-semibold">Dente {evaluation.tooth}</p>
                    </div>
                    {getStatusBadge(evaluation)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 capitalize">
                    {getClinicalDetails(evaluation)}
                  </p>
                  
                  {evaluation.treatment_type === 'resina' && evaluation.resins && (
                    <div className="mb-3 p-2 bg-muted/50 rounded">
                      <p className="text-sm font-medium">{evaluation.resins.name}</p>
                      <p className="text-xs text-muted-foreground">{evaluation.resins.manufacturer}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/result/${evaluation.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportPDF(evaluation.id)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        {evaluation.status !== 'completed' && canMarkAsCompleted(evaluation) && (
                          <DropdownMenuItem onClick={() => handleMarkAsCompleted(evaluation.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como finalizado
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      
      {/* Add Teeth Modal */}
      {evaluations.length > 0 && (
        <AddTeethModal
          open={showAddTeethModal}
          onClose={() => setShowAddTeethModal(false)}
          pendingTeeth={pendingTeeth}
          sessionId={evaluationId || ''}
          patientData={{
            name: evaluations[0]?.patient_name || null,
            age: evaluations[0]?.patient_age || 30,
            id: evaluations[0]?.patient_id || null,
            vitaShade: evaluations[0]?.tooth_color || 'A2',
            bruxism: evaluations[0]?.bruxism || false,
            aestheticLevel: evaluations[0]?.aesthetic_level || 'alto',
            budget: evaluations[0]?.budget || 'moderado',
            longevityExpectation: evaluations[0]?.longevity_expectation || 'médio',
            photoPath: evaluations[0]?.photo_frontal || null,
          }}
          onSuccess={handleAddTeethSuccess}
        />
      )}
    </div>
  );
}
