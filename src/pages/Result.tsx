import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Download, Plus, CheckCircle, Image, Package, Sparkles, Layers, Loader2, Crown, Stethoscope, ArrowUpRight, CircleX, Heart, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
// Dynamic import for code splitting - jspdf is only loaded when PDF export is triggered
import type { Resin, StratificationProtocol, ProtocolLayer, CementationProtocol } from '@/types/protocol';

// Protocol components
import ProtocolTable from '@/components/protocol/ProtocolTable';
import ProtocolChecklist from '@/components/protocol/ProtocolChecklist';
import AlertsSection from '@/components/protocol/AlertsSection';
import WarningsSection from '@/components/protocol/WarningsSection';
import ConfidenceIndicator from '@/components/protocol/ConfidenceIndicator';
import AlternativeBox from '@/components/protocol/AlternativeBox';
import CaseSummaryBox from '@/components/protocol/CaseSummaryBox';
import WhiteningPreferenceAlert from '@/components/protocol/WhiteningPreferenceAlert';
import { DSDAnalysis } from '@/components/wizard/DSDStep';
import { CementationProtocolCard } from '@/components/protocol/CementationProtocolCard';
import { FinishingPolishingCard } from '@/components/protocol/FinishingPolishingCard';
import { BruxismAlert } from '@/components/protocol/BruxismAlert';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';

interface Alternative {
  name: string;
  manufacturer: string;
  reason: string;
}

interface Evaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
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
  checklist_progress: number[] | null;
  // DSD fields
  dsd_analysis: DSDAnalysis | null;
  dsd_simulation_url: string | null;
  // Porcelain fields
  treatment_type: 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | null;
  cementation_protocol: CementationProtocol | null;
  ai_treatment_indication: string | null;
  generic_protocol: {
    treatment_type: string;
    tooth: string;
    summary: string;
    checklist: string[];
    alerts: string[];
    recommendations: string[];
    ai_reason?: string;
  } | null;
  // Session navigation
  session_id: string;
  // Tooth bounds for visual highlight
  tooth_bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  // Patient preferences
  patient_aesthetic_goals: string | null;
  patient_desired_changes: string[] | null;
}

interface DentistProfile {
  full_name: string | null;
  cro: string | null;
  clinic_name: string | null;
  clinic_logo_url: string | null;
}

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPdfConfirmDialog, setShowPdfConfirmDialog] = useState(false);
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{
    frontal: string | null;
    angle45: string | null;
    face: string | null;
  }>({ frontal: null, angle45: null, face: null });
  const [dsdSimulationUrl, setDsdSimulationUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      // Fetch evaluation with user ownership check (defense-in-depth alongside RLS)
      const { data } = await supabase
        .from('evaluations')
        .select(`
          *,
          resins:resins!recommended_resin_id (*),
          ideal_resin:resins!ideal_resin_id (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setEvaluation(data as unknown as Evaluation);
      setLoading(false);

      // Fetch dentist profile
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, cro, clinic_name, clinic_logo_url')
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

        // Load DSD simulation URL
        const dsdUrl = data.dsd_simulation_url;
        if (dsdUrl) {
          const { data: dsdSigned } = await supabase.storage
            .from('dsd-simulations')
            .createSignedUrl(dsdUrl, 3600);
          setDsdSimulationUrl(dsdSigned?.signedUrl || null);
        }
      }
    };

    fetchData();
  }, [id, user]);

  const handleChecklistChange = async (indices: number[]) => {
    if (!evaluation || !id || !user) return;

    // Update local state immediately for responsiveness
    setEvaluation(prev => prev ? { ...prev, checklist_progress: indices } : null);

    // Persist to database with user ownership check (defense-in-depth)
    const { error } = await supabase
      .from('evaluations')
      .update({ checklist_progress: indices })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving checklist progress:', error);
      toast.error('Erro ao salvar progresso');
    }
  };

  // Helper to fetch image as base64
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Check if checklist is complete - calculates checklist inline to avoid reference issues
  const getChecklistCompletionStatus = () => {
    if (!evaluation) return { complete: true, total: 0, progress: 0 };
    
    const treatmentType = evaluation.treatment_type || 'resina';
    const isPorcelain = treatmentType === 'porcelana';
    const isSpecial = ['implante', 'coroa', 'endodontia', 'encaminhamento'].includes(treatmentType);
    const cementation = evaluation.cementation_protocol as CementationProtocol | null;
    const generic = evaluation.generic_protocol;
    const protocol = evaluation.stratification_protocol;
    
    const checklistItems = isPorcelain 
      ? (cementation?.checklist || []) 
      : isSpecial && generic
      ? generic.checklist
      : (protocol?.checklist || []);
    
    const progressIndices = evaluation.checklist_progress || [];
    return {
      complete: checklistItems.length === 0 || progressIndices.length === checklistItems.length,
      total: checklistItems.length,
      progress: progressIndices.length
    };
  };

  // Handler for PDF button click - validates checklist first
  const handlePdfButtonClick = () => {
    const status = getChecklistCompletionStatus();
    if (!status.complete) {
      setShowPdfConfirmDialog(true);
    } else {
      handleExportPDF();
    }
  };

  const handleExportPDF = async () => {
    if (!evaluation) return;
    
    setShowPdfConfirmDialog(false);
    setGeneratingPDF(true);
    
    try {
      const evalProtocol = evaluation.stratification_protocol;
      
      // Load photos and clinic logo as base64 for PDF embedding
      let clinicLogoBase64: string | null = null;
      if (dentistProfile?.clinic_logo_url) {
        const { data: logoUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(dentistProfile.clinic_logo_url);
        clinicLogoBase64 = await fetchImageAsBase64(logoUrl.publicUrl);
      }
      
      const [photoFrontalBase64, photo45Base64, photoFaceBase64, dsdSimBase64] = await Promise.all([
        photoUrls.frontal ? fetchImageAsBase64(photoUrls.frontal) : Promise.resolve(null),
        photoUrls.angle45 ? fetchImageAsBase64(photoUrls.angle45) : Promise.resolve(null),
        photoUrls.face ? fetchImageAsBase64(photoUrls.face) : Promise.resolve(null),
        dsdSimulationUrl ? fetchImageAsBase64(dsdSimulationUrl) : Promise.resolve(null),
      ]);
      
      // Dynamic import for code splitting - jspdf/html2canvas only load when needed
      const { generateProtocolPDF } = await import('@/lib/generatePDF');
      
      await generateProtocolPDF({
        createdAt: evaluation.created_at,
        dentistName: dentistProfile?.full_name || undefined,
        dentistCRO: dentistProfile?.cro || undefined,
        clinicName: dentistProfile?.clinic_name || undefined,
        clinicLogo: clinicLogoBase64 || undefined,
        patientName: evaluation.patient_name || undefined,
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
        
        // Clinical photos
        photoFrontal: photoFrontalBase64 || undefined,
        photo45: photo45Base64 || undefined,
        photoFace: photoFaceBase64 || undefined,
        
        // DSD data
        dsdAnalysis: evaluation.dsd_analysis ? {
          facial_midline: evaluation.dsd_analysis.facial_midline,
          dental_midline: evaluation.dsd_analysis.dental_midline,
          smile_line: evaluation.dsd_analysis.smile_line,
          buccal_corridor: evaluation.dsd_analysis.buccal_corridor,
          occlusal_plane: evaluation.dsd_analysis.occlusal_plane,
          golden_ratio_compliance: evaluation.dsd_analysis.golden_ratio_compliance,
          symmetry_score: evaluation.dsd_analysis.symmetry_score,
          suggestions: evaluation.dsd_analysis.suggestions,
          observations: evaluation.dsd_analysis.observations,
        } : undefined,
        dsdSimulationImage: dsdSimBase64 || undefined,
        
        // Additional clinical data
        substrate: evaluation.substrate,
        longevityExpectation: evaluation.longevity_expectation,
        budget: evaluation.budget,
        
        // Ideal resin info
        idealResin: evaluation.ideal_resin || undefined,
        idealReason: evaluation.ideal_reason || undefined,
        isFromInventory: evaluation.is_from_inventory,
        
        // Porcelain data
        treatmentType: (evaluation.treatment_type === 'porcelana' ? 'porcelana' : 'resina') as 'resina' | 'porcelana',
        cementationProtocol: evaluation.cementation_protocol || undefined,
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
            <span className="text-xl font-semibold tracking-tight">DentAI Pro</span>
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
  
  // Determine treatment type
  const treatmentType = evaluation.treatment_type || 'resina';
  const isPorcelain = treatmentType === 'porcelana';
  const isSpecialTreatment = ['implante', 'coroa', 'endodontia', 'encaminhamento'].includes(treatmentType);
  const cementationProtocol = evaluation.cementation_protocol as CementationProtocol | null;
  const genericProtocol = evaluation.generic_protocol;
  
  // Get protocol data from new structure (for resin)
  const protocol = evaluation.stratification_protocol;
  const layers = protocol?.layers || evaluation.protocol_layers || [];
  const checklist = isPorcelain 
    ? (cementationProtocol?.checklist || []) 
    : isSpecialTreatment && genericProtocol
    ? genericProtocol.checklist
    : (protocol?.checklist || []);
  const alerts = isPorcelain 
    ? (cementationProtocol?.alerts || []) 
    : isSpecialTreatment && genericProtocol
    ? genericProtocol.alerts
    : (evaluation.alerts || []);
  const warnings = isPorcelain ? (cementationProtocol?.warnings || []) : (evaluation.warnings || []);
  const confidence = isPorcelain ? (cementationProtocol?.confidence || "média") : (protocol?.confidence || "média");
  const protocolAlternative = protocol?.alternative;
  
  const showIdealResin = idealResin && idealResin.id !== resin?.id;
  const hasProtocol = isPorcelain ? !!cementationProtocol : isSpecialTreatment ? !!genericProtocol : layers.length > 0;

  // Treatment type display info with styling
  const treatmentStyles: Record<string, { 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    bgClass: string;
    borderClass: string;
    iconClass: string;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
    ringClass: string;
    solidBgClass: string;
    glowClass: string;
    overlayColor: string;
  }> = {
    resina: {
      label: 'Restauração em Resina',
      icon: Layers,
      bgClass: 'bg-primary/5 dark:bg-primary/10',
      borderClass: 'border-primary/20 dark:border-primary/30',
      iconClass: 'text-primary',
      badgeVariant: 'default',
      ringClass: 'ring-blue-500',
      solidBgClass: 'bg-blue-600',
      glowClass: 'bg-blue-400',
      overlayColor: 'rgba(59, 130, 246, 0.45)',
    },
    porcelana: {
      label: 'Faceta de Porcelana',
      icon: Crown,
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      borderClass: 'border-amber-200 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400',
      badgeVariant: 'secondary',
      ringClass: 'ring-amber-500',
      solidBgClass: 'bg-amber-600',
      glowClass: 'bg-amber-400',
      overlayColor: 'rgba(249, 115, 22, 0.45)',
    },
    coroa: {
      label: 'Coroa Protética',
      icon: Crown,
      bgClass: 'bg-purple-50 dark:bg-purple-950/20',
      borderClass: 'border-purple-200 dark:border-purple-800',
      iconClass: 'text-purple-600 dark:text-purple-400',
      badgeVariant: 'secondary',
      ringClass: 'ring-purple-500',
      solidBgClass: 'bg-purple-600',
      glowClass: 'bg-purple-400',
      overlayColor: 'rgba(147, 51, 234, 0.45)',
    },
    implante: {
      label: 'Indicação de Implante',
      icon: CircleX,
      bgClass: 'bg-orange-50 dark:bg-orange-950/20',
      borderClass: 'border-orange-200 dark:border-orange-800',
      iconClass: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'secondary',
      ringClass: 'ring-orange-500',
      solidBgClass: 'bg-orange-600',
      glowClass: 'bg-orange-400',
      overlayColor: 'rgba(239, 68, 68, 0.45)',
    },
    endodontia: {
      label: 'Tratamento de Canal',
      icon: Stethoscope,
      bgClass: 'bg-rose-50 dark:bg-rose-950/20',
      borderClass: 'border-rose-200 dark:border-rose-800',
      iconClass: 'text-rose-600 dark:text-rose-400',
      badgeVariant: 'destructive',
      ringClass: 'ring-rose-500',
      solidBgClass: 'bg-rose-600',
      glowClass: 'bg-rose-400',
      overlayColor: 'rgba(244, 63, 94, 0.45)',
    },
    encaminhamento: { 
      label: 'Encaminhamento', 
      icon: ArrowUpRight, 
      bgClass: 'bg-muted/50',
      borderClass: 'border-border',
      iconClass: 'text-muted-foreground',
      badgeVariant: 'outline',
      ringClass: 'ring-gray-400',
      solidBgClass: 'bg-gray-600',
      glowClass: 'bg-gray-400',
      overlayColor: 'rgba(107, 114, 128, 0.45)',
    },
  };
  const currentTreatmentStyle = treatmentStyles[treatmentType] || treatmentStyles.resina;
  const TreatmentIcon = currentTreatmentStyle.icon;

  return (
    <div className="min-h-screen bg-background print:bg-background">
      {/* Header */}
      <header className="border-b border-border print:hidden">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">ResinMatch AI</span>
          <div className="flex items-center gap-2">
            <Link to={`/evaluation/${evaluation.session_id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Avaliação
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4 print:hidden">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/evaluation/${evaluation.session_id}`}>Avaliação</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dente {evaluation.tooth}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Print header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-semibold">ResinMatch AI</h1>
          <p className="text-sm text-muted-foreground">
            Relatório de Recomendação • {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Date */}
        <p className="text-sm text-muted-foreground mb-4 print:hidden">
          {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
        </p>

        {/* Treatment Type Header - Always visible */}
        <Card className={`mb-6 ${currentTreatmentStyle.bgClass} ${currentTreatmentStyle.borderClass}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentTreatmentStyle.bgClass}`}>
                <TreatmentIcon className={`w-6 h-6 ${currentTreatmentStyle.iconClass}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{currentTreatmentStyle.label}</h2>
                <p className="text-sm text-muted-foreground">
                  Dente {evaluation.tooth} • {evaluation.region.replace('-', ' ')}
                </p>
              </div>
              <Badge variant={currentTreatmentStyle.badgeVariant}>
                {treatmentType === 'resina' ? 'Direta' : 'Indireta'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Banner - Only for resin treatments */}
        {treatmentType === 'resina' && !evaluation.has_inventory_at_creation && (
          <Card className="mb-6 border-primary/20 bg-primary/5 dark:bg-primary/10 print:hidden">
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

        {/* Special Treatment Recommendations */}
        {isSpecialTreatment && genericProtocol?.recommendations && (
          <Card className="mb-6 border-muted">
            <CardContent className="py-4">
              <p className="text-sm font-medium mb-2">Recomendações ao paciente:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {genericProtocol.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* SECTION 1: Case Summary - Contextual based on treatment type */}
        <section className="mb-8">
          <CaseSummaryBox
            treatmentType={treatmentType}
            patientAge={evaluation.patient_age}
            tooth={evaluation.tooth}
            region={evaluation.region}
            cavityClass={evaluation.cavity_class}
            restorationSize={evaluation.restoration_size}
            toothColor={evaluation.tooth_color}
            aestheticLevel={evaluation.aesthetic_level}
            bruxism={evaluation.bruxism}
            stratificationNeeded={evaluation.stratification_needed}
            indicationReason={evaluation.ai_treatment_indication || genericProtocol?.ai_reason}
          />
        </section>

        {/* DSD Section - Collapsible */}
        {evaluation.dsd_analysis && (
          <section className="mb-8">
            <CollapsibleDSD
              analysis={evaluation.dsd_analysis}
              beforeImage={photoUrls.frontal}
              afterImage={dsdSimulationUrl}
              defaultOpen={false}
            />
          </section>
        )}

        {/* Patient Preferences - show text from patient_aesthetic_goals */}
        {evaluation.patient_aesthetic_goals && (
          <section className="mb-8">
            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Preferências do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  "{evaluation.patient_aesthetic_goals}"
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Whitening Preference Alert - Only for resin treatments with aesthetic goals mentioning whitening */}
        {treatmentType === 'resina' && (
          <section className="mb-8">
            <WhiteningPreferenceAlert
              originalColor={evaluation.tooth_color}
              aestheticGoals={evaluation.patient_aesthetic_goals}
              protocolLayers={layers}
            />
          </section>
        )}

        {/* Bruxism Alert - Emphatic warning */}
        {evaluation.bruxism && (
          <section className="mb-8">
            <BruxismAlert show={true} treatmentType={treatmentType} />
          </section>
        )}

        {hasPhotos && (
          <section className="mb-8">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Fotos Clínicas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photoUrls.frontal && (
                <div className="relative">
                  {/* Outer glow effect */}
                  <div className={`absolute -inset-1 rounded-xl ${currentTreatmentStyle.glowClass} opacity-60`} />
                  
                  <div className={`relative aspect-square rounded-lg overflow-hidden bg-secondary ring-4 ${currentTreatmentStyle.ringClass} ring-offset-4 ring-offset-background shadow-xl`}>
                    <img
                      src={photoUrls.frontal}
                      alt="Foto Clínica"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Colored overlay directly on the tooth */}
                    {evaluation.tooth_bounds && (
                      <div 
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          left: `${evaluation.tooth_bounds.x - evaluation.tooth_bounds.width / 2}%`,
                          top: `${evaluation.tooth_bounds.y - evaluation.tooth_bounds.height / 2}%`,
                          width: `${evaluation.tooth_bounds.width}%`,
                          height: `${evaluation.tooth_bounds.height}%`,
                          backgroundColor: currentTreatmentStyle.overlayColor,
                          mixBlendMode: 'multiply',
                          boxShadow: `0 0 20px 8px ${currentTreatmentStyle.overlayColor}`,
                        }}
                      />
                    )}
                    
                    {/* Tooth number badge - smaller and positioned based on tooth location */}
                    <div className="absolute bottom-2 left-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg ${currentTreatmentStyle.solidBgClass} text-white`}>
                        <span>Dente {evaluation.tooth}</span>
                      </div>
                    </div>
                  </div>
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

        {/* SECTION 3: Protocol - Conditional based on treatment type */}
        {isPorcelain && cementationProtocol ? (
          <section className="mb-8">
            <CementationProtocolCard 
              protocol={cementationProtocol}
              checkedIndices={evaluation.checklist_progress || []}
              onProgressChange={handleChecklistChange}
            />
          </section>
        ) : (
          <>
            {/* Resin Protocol Layers Table */}
            {hasProtocol && treatmentType === 'resina' && (
              <section className="mb-8">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Protocolo de Estratificação
                </h3>
                <ProtocolTable layers={layers} />
                
                {/* Resin Summary Card */}
                {layers.length > 0 && (
                  <Card className="mt-4 border-primary/20">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Resinas Utilizadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Deduplicate resins by brand + shade */}
                        {[...new Set(layers.map(l => `${l.resin_brand} ${l.shade}`))].map((resin, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {resin}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </section>
            )}
            
            {/* Finishing & Polishing Section - Only for resin */}
            {treatmentType === 'resina' && protocol?.finishing && (
              <section className="mb-8">
                <FinishingPolishingCard protocol={protocol.finishing} />
              </section>
            )}
            
            {/* Generic Protocol for special treatments */}
            {isSpecialTreatment && genericProtocol && (
              <section className="mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {treatmentType === 'coroa' && <Crown className="w-4 h-4" />}
                      {treatmentType === 'implante' && <CircleX className="w-4 h-4" />}
                      {treatmentType === 'endodontia' && <Stethoscope className="w-4 h-4" />}
                      {treatmentType === 'encaminhamento' && <ArrowUpRight className="w-4 h-4" />}
                      {treatmentType === 'coroa' && 'Planejamento Protético'}
                      {treatmentType === 'implante' && 'Planejamento Cirúrgico'}
                      {treatmentType === 'endodontia' && 'Protocolo Endodôntico'}
                      {treatmentType === 'encaminhamento' && 'Orientações de Encaminhamento'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {genericProtocol.summary && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {genericProtocol.summary}
                      </p>
                    )}
                    <ProtocolChecklist 
                      items={genericProtocol.checklist} 
                      checkedIndices={evaluation.checklist_progress || []}
                      onProgressChange={handleChecklistChange}
                    />
                  </CardContent>
                </Card>
              </section>
            )}

            {/* SECTION 4: Simplified Alternative - Only for resin */}
            {treatmentType === 'resina' && protocolAlternative && (
              <section className="mb-8">
                <AlternativeBox alternative={protocolAlternative} />
              </section>
            )}
          </>
        )}

        {/* SECTION 5: Step-by-Step Checklist - Only for resin (porcelain and special have integrated) */}
        {treatmentType === 'resina' && checklist.length > 0 && (
          <section className="mb-8 print:hidden">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Passo a Passo</CardTitle>
              </CardHeader>
              <CardContent>
                <ProtocolChecklist 
                  items={checklist} 
                  checkedIndices={evaluation.checklist_progress || []}
                  onProgressChange={handleChecklistChange}
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* SECTION 6 & 7: Alerts and Warnings side by side - Only for resin */}
        {treatmentType === 'resina' && (alerts.length > 0 || warnings.length > 0) && (
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertsSection alerts={alerts} />
            <WarningsSection warnings={warnings} />
          </section>
        )}

        {/* SECTION 8: Confidence Indicator - Only for resin */}
        {treatmentType === 'resina' && hasProtocol && (
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

        {/* PDF Confirmation Dialog */}
        <AlertDialog open={showPdfConfirmDialog} onOpenChange={setShowPdfConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Checklist incompleto</AlertDialogTitle>
              <AlertDialogDescription>
                O checklist do protocolo ainda não está 100% concluído. 
                Deseja gerar o PDF mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportPDF}>
                Gerar PDF
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Actions */}
        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={handlePdfButtonClick} disabled={generatingPDF}>
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
