import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ArrowLeft, Eye, FileDown, CheckCircle, MoreHorizontal, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Evaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  resins?: {
    name: string;
  } | null;
}

type FilterStatus = 'all' | 'draft' | 'completed';

export default function Cases() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchEvaluations();
  }, [user]);

  const fetchEvaluations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        created_at,
        patient_name,
        tooth,
        cavity_class,
        status,
        resins!recommended_resin_id (
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Erro ao carregar casos');
    } else {
      setEvaluations(data || []);
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
      fetchEvaluations();
    }
  };

  const handleExportPDF = (id: string) => {
    // Open the result page in a new tab for printing
    window.open(`/result/${id}?print=true`, '_blank');
    toast.info('Abrindo página para impressão...');
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (filter === 'all') return true;
    if (filter === 'draft') return evaluation.status === 'draft' || !evaluation.status;
    if (filter === 'completed') return evaluation.status === 'completed';
    return true;
  });

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
            <span className="text-xl font-semibold tracking-tight">Meus Casos</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar:</span>
            <Select value={filter} onValueChange={(value: FilterStatus) => setFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Planejados</SelectItem>
                <SelectItem value="completed">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredEvaluations.length} caso(s)
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Nenhum caso encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'all' 
                ? 'Você ainda não criou nenhum caso clínico.'
                : `Nenhum caso com status "${filter === 'draft' ? 'planejado' : 'finalizado'}".`
              }
            </p>
            <Link to="/new-case">
              <Button>Criar primeiro caso</Button>
            </Link>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Dente</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      {evaluation.patient_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{evaluation.tooth}</TableCell>
                    <TableCell>{evaluation.cavity_class}</TableCell>
                    <TableCell>
                      {format(new Date(evaluation.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
                            Ver detalhes
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
          </Card>
        )}
      </main>
    </div>
  );
}
