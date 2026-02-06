import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BRAND_NAME } from '@/lib/branding';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle,
  Calendar,
  Layers,
  Crown,
  Stethoscope,
  ArrowUpRight,
  CircleX,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const treatmentLabels: Record<string, { label: string; icon: typeof Layers }> = {
  resina: { label: 'Resina Composta', icon: Layers },
  porcelana: { label: 'Faceta de Porcelana', icon: Crown },
  coroa: { label: 'Coroa Total', icon: Crown },
  implante: { label: 'Implante', icon: CircleX },
  endodontia: { label: 'Endodontia', icon: Stethoscope },
  encaminhamento: { label: 'Encaminhamento', icon: ArrowUpRight },
};

interface SharedEval {
  tooth: string;
  treatment_type: string | null;
  cavity_class: string;
  status: string | null;
  ai_treatment_indication: string | null;
  patient_name: string | null;
  created_at: string;
}

export default function SharedEvaluation() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [evaluations, setEvaluations] = useState<SharedEval[]>([]);
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) return;

      // Look up the shared link
      const { data: link, error: linkError } = await supabase
        .from('shared_links')
        .select('session_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (linkError || !link) {
        setExpired(true);
        setLoading(false);
        return;
      }

      // Check expiry
      if (new Date(link.expires_at) < new Date()) {
        setExpired(true);
        setLoading(false);
        return;
      }

      // Fetch evaluation data (read-only, public fields only)
      const { data: evals, error: evalError } = await supabase
        .from('evaluations')
        .select('tooth, treatment_type, cavity_class, status, ai_treatment_indication, patient_name, created_at')
        .eq('session_id', link.session_id)
        .order('tooth', { ascending: true });

      if (evalError || !evals || evals.length === 0) {
        setExpired(true);
        setLoading(false);
        return;
      }

      setEvaluations(evals);
      setPatientName(evals[0].patient_name || 'Paciente');
      setLoading(false);
    };

    fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-xl font-semibold font-display mb-2">Link expirado ou inválido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Este link de compartilhamento não está mais disponível.
          </p>
          <Button asChild>
            <Link to="/">Ir para {BRAND_NAME}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = evaluations.filter((e) => e.status === 'completed').length;
  const evalDate = evaluations[0]?.created_at
    ? format(new Date(evaluations[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-[0.2em] font-display text-gradient-gold">{BRAND_NAME}</span>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Visualização compartilhada
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-display">{patientName}</CardTitle>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {evalDate}
              </div>
              <span>
                {evaluations.length} dente{evaluations.length > 1 ? 's' : ''} avaliado{evaluations.length > 1 ? 's' : ''}
              </span>
              <span>
                {completedCount}/{evaluations.length} concluído{completedCount !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-3">
          {evaluations.map((evaluation, index) => {
            const treatment = treatmentLabels[evaluation.treatment_type || 'resina'];
            const TreatmentIcon = treatment?.icon || Layers;

            return (
              <Card key={index} className="shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-mono">
                        {evaluation.tooth}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <TreatmentIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {treatment?.label || 'Tratamento'}
                          </span>
                        </div>
                        {evaluation.ai_treatment_indication && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {evaluation.ai_treatment_indication}
                          </p>
                        )}
                      </div>
                    </div>
                    {evaluation.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <CheckCircle className="w-3 h-3" />
                        Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        Planejado
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Gerado por {BRAND_NAME} &middot; Ferramenta de apoio à decisão clínica
        </p>
      </main>
    </div>
  );
}
