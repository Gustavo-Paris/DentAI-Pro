import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Plus, CheckCircle, Image, Package, Sparkles, Layers, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateProtocolPDF } from '@/lib/generatePDF';

// Protocol components
import ProtocolTable, { ProtocolLayer } from '@/components/protocol/ProtocolTable';
import ProtocolChecklist from '@/components/protocol/ProtocolChecklist';
import AlertsSection from '@/components/protocol/AlertsSection';
import WarningsSection from '@/components/protocol/WarningsSection';
import ConfidenceIndicator from '@/components/protocol/ConfidenceIndicator';
import AlternativeBox, { ProtocolAlternative } from '@/components/protocol/AlternativeBox';
import CaseSummaryBox from '@/components/protocol/CaseSummaryBox';

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

interface StratificationProtocol {
  layers: ProtocolLayer[];
  alternative: ProtocolAlternative;
  checklist: string[];
  confidence: "alta" | "média" | "baixa";
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
  stratification_protocol: StratificationProtocol | null;
  protocol_layers: ProtocolLayer[] | null;
  alerts: string[] | null;
  warnings: string[] | null;
  is_from_inventory: boolean;
  ideal_resin_id: string | null;
  ideal_reason: string | null;
  ideal_resin: Resin | null;
  has_inventory_at_creation: boolean;
}

interface DentistProfile {
  full_name: string | null;
  cro: string | null;
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{
    frontal: string | null;
    angle45: string | null;
    face: string | null;
  }>({ frontal: null, angle45: null, face: null });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Fetch evaluation
      const { data } = await supabase
        .from('evaluations')
        .select(`
          *,
          resins:resins!recommended_resin_id (*),
          ideal_resin:resins!ideal_resin_id (*)
        `)
        .eq('id', id)
        .single();

      setEvaluation(data as unknown as Evaluation);
      setLoading(false);

      // Fetch dentist profile
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, cro')
          .eq('user_id', user.id)
          .single();
        
        setDentistProfile(profileData);
      }

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

    fetchData();
  }, [id, user]);

  const handleExportPDF = async () => {
    if (!evaluation) return;
    
    setGeneratingPDF(true);
    
    try {
      const evalProtocol = evaluation.stratification_protocol;
      
      await generateProtocolPDF({
        createdAt: evaluation.created_at,
        dentistName: dentistProfile?.full_name || undefined,
        dentistCRO: dentistProfile?.cro || undefined,
        patientAge: evaluation.patient_age,
        tooth: evaluation.tooth,
        region: evaluation.region,
        cavityClass: evaluation.cavity_class,
        restorationSize: evaluation.restoration_size,
        toothColor: evaluation.tooth_color,
        aestheticLevel: evaluation.aesthetic_level,
        bruxism: evaluation.bruxism,
        stratificationNeeded: evaluation.stratification_needed,
        resin: evaluation.resins,
        recommendationText: evaluation.recommendation_text,
        layers: evalProtocol?.layers || evaluation.protocol_layers || [],
        alternative: evalProtocol?.alternative,
        checklist: evalProtocol?.checklist || [],
        alerts: evaluation.alerts || [],
        warnings: evaluation.warnings || [],
        confidence: evalProtocol?.confidence || 'média',
      });
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <span className="text-xl font-semibold tracking-tight">ResinMatch AI</span>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
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
  const idealResin = evaluation.ideal_resin;
  const alternatives = evaluation.alternatives as Alternative[] | null;
  const hasPhotos = photoUrls.frontal || photoUrls.angle45 || photoUrls.face;
  
  // Get protocol data from new structure
  const protocol = evaluation.stratification_protocol;
  const layers = protocol?.layers || evaluation.protocol_layers || [];
  const checklist = protocol?.checklist || [];
  const alerts = evaluation.alerts || [];
  const warnings = evaluation.warnings || [];
  const confidence = protocol?.confidence || "média";
  const protocolAlternative = protocol?.alternative;
  
  const showIdealResin = idealResin && idealResin.id !== resin?.id;
  const hasProtocol = layers.length > 0;

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

      <main className="container mx-auto px-6 py-8 max-w-3xl">
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

        {/* Inventory Banner */}
        {!evaluation.has_inventory_at_creation && (
          <Card className="mb-6 border-primary/20 bg-primary/5 print:hidden">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Personalize suas recomendações
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastre as resinas do seu consultório para receber sugestões baseadas no seu estoque.
                  </p>
                </div>
                <Link to="/inventory">
                  <Button size="sm" variant="outline">
                    Ir para Inventário
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: Case Summary */}
        <section className="mb-8">
          <CaseSummaryBox
            patientAge={evaluation.patient_age}
            tooth={evaluation.tooth}
            region={evaluation.region}
            cavityClass={evaluation.cavity_class}
            restorationSize={evaluation.restoration_size}
            toothColor={evaluation.tooth_color}
            aestheticLevel={evaluation.aesthetic_level}
            bruxism={evaluation.bruxism}
            stratificationNeeded={evaluation.stratification_needed}
          />
        </section>

        {/* SECTION 2: Clinical Photos / Simulation */}
        {hasPhotos && (
          <section className="mb-8">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Fotos Clínicas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photoUrls.frontal && (
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={photoUrls.frontal}
                    alt="Foto Clínica"
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
          </section>
        )}

        {/* Main Recommendation */}
        {resin && (
          <section className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-foreground" />
                      {resin.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">{resin.manufacturer}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{resin.type}</Badge>
                    {evaluation.is_from_inventory && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Package className="w-3 h-3 mr-1" />
                        No seu estoque
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Technical specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
          </section>
        )}

        {/* SECTION 3: Protocol Layers Table */}
        {hasProtocol && (
          <section className="mb-8">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Protocolo de Camadas
            </h3>
            <ProtocolTable layers={layers} />
          </section>
        )}

        {/* SECTION 4: Simplified Alternative */}
        {protocolAlternative && (
          <section className="mb-8">
            <AlternativeBox alternative={protocolAlternative} />
          </section>
        )}

        {/* SECTION 5: Step-by-Step Checklist */}
        {checklist.length > 0 && (
          <section className="mb-8 print:hidden">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Passo a Passo</CardTitle>
              </CardHeader>
              <CardContent>
                <ProtocolChecklist items={checklist} />
              </CardContent>
            </Card>
          </section>
        )}

        {/* SECTION 6 & 7: Alerts and Warnings side by side */}
        {(alerts.length > 0 || warnings.length > 0) && (
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertsSection alerts={alerts} />
            <WarningsSection warnings={warnings} />
          </section>
        )}

        {/* SECTION 8: Confidence Indicator */}
        {hasProtocol && (
          <section className="mb-8">
            <ConfidenceIndicator confidence={confidence} />
          </section>
        )}

        {/* Ideal Resin (when different from recommended) */}
        {showIdealResin && (
          <section className="mb-8">
            <Card className="border-muted-foreground/20 bg-secondary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  Opção Ideal (fora do estoque)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{idealResin.name}</p>
                  <p className="text-sm text-muted-foreground">{idealResin.manufacturer}</p>
                </div>
                {evaluation.ideal_reason && (
                  <p className="text-sm text-muted-foreground">
                    {evaluation.ideal_reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Considere adquirir para casos futuros similares
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Alternatives */}
        {alternatives && alternatives.length > 0 && (
          <section className="mb-8">
            <h3 className="font-medium mb-3">Outras Alternativas</h3>
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
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={handleExportPDF} disabled={generatingPDF}>
            {generatingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Baixar PDF
          </Button>
          <Link to="/new-case" className="flex-1">
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Novo Caso
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
