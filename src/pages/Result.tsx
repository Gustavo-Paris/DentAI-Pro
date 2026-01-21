import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Plus, CheckCircle, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StratificationProtocol from '@/components/StratificationProtocol';

interface Resin {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  opacity: string;
  resistance: string;
  polishing: string;
  aesthetics: string;
  price_range: string;
  description: string | null;
}

interface Alternative {
  name: string;
  manufacturer: string;
  reason: string;
}

interface StratificationProtocolData {
  color_analysis: {
    base_shade: string;
    cervical: string;
    body: string;
    incisal: string;
    effects: string[];
  };
  stratification_layers: Array<{
    layer: number;
    material: string;
    thickness: string;
    area: string;
  }>;
  texture_notes: string;
  surface_characteristics: string[];
  recommendations: string;
}

interface Evaluation {
  id: string;
  created_at: string;
  patient_age: number;
  tooth: string;
  region: string;
  cavity_class: string;
  restoration_size: string;
  substrate: string;
  aesthetic_level: string;
  tooth_color: string;
  stratification_needed: boolean;
  bruxism: boolean;
  longevity_expectation: string;
  budget: string;
  recommendation_text: string | null;
  alternatives: Alternative[] | null;
  resins: Resin | null;
  photo_frontal: string | null;
  photo_45: string | null;
  photo_face: string | null;
  stratification_protocol: StratificationProtocolData | null;
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<{
    frontal: string | null;
    angle45: string | null;
    face: string | null;
  }>({ frontal: null, angle45: null, face: null });

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('evaluations')
        .select(`
          *,
          resins (*)
        `)
        .eq('id', id)
        .single();

      setEvaluation(data as unknown as Evaluation);
      setLoading(false);

      // Load signed URLs for photos
      if (data) {
        const urls: { frontal: string | null; angle45: string | null; face: string | null } = {
          frontal: null,
          angle45: null,
          face: null,
        };

        if (data.photo_frontal) {
          const { data: signedData } = await supabase.storage
            .from('clinical-photos')
            .createSignedUrl(data.photo_frontal, 3600);
          urls.frontal = signedData?.signedUrl || null;
        }

        if (data.photo_45) {
          const { data: signedData } = await supabase.storage
            .from('clinical-photos')
            .createSignedUrl(data.photo_45, 3600);
          urls.angle45 = signedData?.signedUrl || null;
        }

        if (data.photo_face) {
          const { data: signedData } = await supabase.storage
            .from('clinical-photos')
            .createSignedUrl(data.photo_face, 3600);
          urls.face = signedData?.signedUrl || null;
        }

        setPhotoUrls(urls);
      }
    };

    fetchEvaluation();
  }, [id]);

  const generatePDF = () => {
    // Simple print-to-PDF functionality
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <span className="text-xl font-semibold tracking-tight">ResinMatch AI</span>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Avaliação não encontrada</p>
      </div>
    );
  }

  const resin = evaluation.resins;
  const alternatives = evaluation.alternatives as Alternative[] | null;
  const hasPhotos = photoUrls.frontal || photoUrls.angle45 || photoUrls.face;
  const stratificationProtocol = evaluation.stratification_protocol as StratificationProtocolData | null;

  return (
    <div className="min-h-screen bg-background print:bg-background">
      {/* Header */}
      <header className="border-b border-border print:hidden">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">ResinMatch AI</span>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Print header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-semibold">ResinMatch AI</h1>
          <p className="text-sm text-muted-foreground">
            Relatório de Recomendação • {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Date */}
        <p className="text-sm text-muted-foreground mb-6 print:hidden">
          {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
        </p>

        {/* Main Recommendation */}
        {resin && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-foreground" />
                    {resin.name}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">{resin.manufacturer}</p>
                </div>
                <Badge variant="secondary">{resin.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Technical specs */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Opacidade</span>
                  <p className="font-medium">{resin.opacity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Resistência</span>
                  <p className="font-medium">{resin.resistance}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Polimento</span>
                  <p className="font-medium">{resin.polishing}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estética</span>
                  <p className="font-medium">{resin.aesthetics}</p>
                </div>
              </div>

              {/* AI Justification */}
              {evaluation.recommendation_text && (
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-2">Justificativa</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {evaluation.recommendation_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alternatives */}
        {alternatives && alternatives.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Alternativas</h3>
            <div className="space-y-3">
              {alternatives.map((alt, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{alt.name}</span>
                    <span className="text-sm text-muted-foreground">{alt.manufacturer}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alt.reason}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Photos */}
        {hasPhotos && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Fotos Clínicas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {photoUrls.frontal && (
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={photoUrls.frontal}
                    alt="Sorriso Frontal"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {photoUrls.angle45 && (
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={photoUrls.angle45}
                    alt="Sorriso 45°"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {photoUrls.face && (
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={photoUrls.face}
                    alt="Rosto"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stratification Protocol */}
        {stratificationProtocol && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Protocolo de Estratificação</h3>
            <StratificationProtocol protocol={stratificationProtocol} />
          </div>
        )}

        {/* Case Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Resumo do caso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Paciente</span>
                <p className="font-medium">{evaluation.patient_age} anos</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dente</span>
                <p className="font-medium">{evaluation.tooth} ({evaluation.region})</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cavidade</span>
                <p className="font-medium">{evaluation.cavity_class}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tamanho</span>
                <p className="font-medium capitalize">{evaluation.restoration_size}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estética</span>
                <p className="font-medium capitalize">{evaluation.aesthetic_level}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Orçamento</span>
                <p className="font-medium capitalize">{evaluation.budget}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
          <Link to="/evaluation" className="flex-1">
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          Esta é uma ferramenta de apoio à decisão clínica. A escolha final do material restaurador é de responsabilidade do profissional.
        </p>
      </main>
    </div>
  );
}
