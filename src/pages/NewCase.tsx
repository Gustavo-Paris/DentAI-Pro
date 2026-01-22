import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Camera, Brain, ClipboardCheck, FileText, Loader2 } from 'lucide-react';

import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';
import { ReviewAnalysisStep, PhotoAnalysisResult, ReviewFormData, DetectedTooth } from '@/components/wizard/ReviewAnalysisStep';

const steps = [
  { id: 1, name: 'Foto', icon: Camera },
  { id: 2, name: 'Análise', icon: Brain },
  { id: 3, name: 'Revisão', icon: ClipboardCheck },
  { id: 4, name: 'Resultado', icon: FileText },
];

const initialFormData: ReviewFormData = {
  patientName: '',
  patientAge: '',
  tooth: '',
  toothRegion: 'anterior',
  cavityClass: 'Classe I',
  restorationSize: 'Média',
  vitaShade: 'A2',
  substrate: 'Esmalte e Dentina',
  substrateCondition: 'Saudável',
  enamelCondition: 'Íntegro',
  depth: 'Média',
  bruxism: false,
  aestheticLevel: 'alto',
  budget: 'intermediário',
  longevityExpectation: 'média',
  clinicalNotes: '',
};

export default function NewCase() {
  const [step, setStep] = useState(1);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Auto-select all detected teeth when analysis completes
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map(t => t.tooth);
      setSelectedTeeth(allTeeth);
    }
  }, [analysisResult]);

  // Helper to determine if tooth is anterior
  const isAnterior = (tooth: string) => {
    const anteriorTeeth = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
    return anteriorTeeth.includes(tooth);
  };

  // Helper to get full region format for API
  const getFullRegion = (tooth: string): string => {
    const toothNum = parseInt(tooth);
    const isUpper = toothNum >= 10 && toothNum <= 28;
    if (isAnterior(tooth)) {
      return isUpper ? 'anterior-superior' : 'anterior-inferior';
    }
    return isUpper ? 'posterior-superior' : 'posterior-inferior';
  };

  // Upload image to storage and get path
  const uploadImageToStorage = async (base64: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert base64 to blob
      const response = await fetch(base64);
      const blob = await response.blob();
      
      const fileName = `${user.id}/intraoral_${Date.now()}.jpg`;
      
      const { error } = await supabase.storage
        .from('clinical-photos')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;
      return fileName;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Call AI to analyze the photo
  const analyzePhoto = async () => {
    if (!imageBase64) return;

    setStep(2);
    setIsAnalyzing(true);

    try {
      // Upload to storage first
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) {
        setUploadedPhotoPath(photoPath);
      }

      // Call the analyze-dental-photo edge function
      const { data, error } = await supabase.functions.invoke('analyze-dental-photo', {
        body: {
          imageBase64: imageBase64,
          imageType: 'intraoral',
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);
        
        // Pre-fill form with primary tooth or first detected tooth
        const primaryToothData = analysis.detected_teeth?.find(
          (t) => t.tooth === analysis.primary_tooth
        ) || analysis.detected_teeth?.[0];
        
        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion: primaryToothData.tooth_region || (primaryToothData.tooth ? (isAnterior(primaryToothData.tooth) ? 'anterior' : 'posterior') : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            vitaShade: analysis.vita_shade || prev.vitaShade,
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        } else if (analysis.vita_shade) {
          // Even if no teeth detected, use VITA shade
          setFormData((prev) => ({
            ...prev,
            vitaShade: analysis.vita_shade || prev.vitaShade,
          }));
        }

        // Move to review step
        setTimeout(() => {
          setStep(3);
        }, 500);
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Handle rate limit / payment errors
      if (error?.message?.includes('429') || error?.code === 'RATE_LIMITED') {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (error?.message?.includes('402') || error?.code === 'PAYMENT_REQUIRED') {
        toast.error('Créditos insuficientes. Adicione créditos à sua conta.');
      } else {
        toast.error('Erro na análise. Prosseguindo com entrada manual.');
      }
      
      // Move to review step anyway for manual input
      setStep(3);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reanalyze photo (force new AI analysis)
  const handleReanalyze = async () => {
    if (!imageBase64) return;

    setIsReanalyzing(true);

    try {
      // Call the analyze-dental-photo edge function again
      const { data, error } = await supabase.functions.invoke('analyze-dental-photo', {
        body: {
          imageBase64: imageBase64,
          imageType: 'intraoral',
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);
        
        // Pre-fill form with primary tooth or first detected tooth
        const primaryToothData = analysis.detected_teeth?.find(
          (t) => t.tooth === analysis.primary_tooth
        ) || analysis.detected_teeth?.[0];
        
        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion: primaryToothData.tooth_region || (primaryToothData.tooth ? (isAnterior(primaryToothData.tooth) ? 'anterior' : 'posterior') : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            vitaShade: analysis.vita_shade || prev.vitaShade,
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        }

        toast.success(`Reanálise concluída: ${analysis.detected_teeth?.length || 0} dente(s) detectado(s)`);
      }
    } catch (error: any) {
      console.error('Reanalysis error:', error);
      
      if (error?.message?.includes('429') || error?.code === 'RATE_LIMITED') {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else {
        toast.error('Erro na reanálise. Tente novamente.');
      }
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Handle form changes
  const handleFormChange = (updates: Partial<ReviewFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!formData.patientAge) {
      toast.error('Informe a idade do paciente');
      return false;
    }
    // For multi-tooth, we need at least one selected
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    if (teethToProcess.length === 0 || !teethToProcess[0]) {
      toast.error('Selecione pelo menos um dente');
      return false;
    }
    return true;
  };

  // Get tooth data from analysis result
  const getToothData = (toothNumber: string) => {
    return analysisResult?.detected_teeth?.find(t => t.tooth === toothNumber);
  };

  // Submit the case - process all selected teeth
  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setStep(4);

    // Determine which teeth to process
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    const createdEvaluationIds: string[] = [];
    
    // Generate a shared session_id for all teeth in this batch
    const sessionId = crypto.randomUUID();

    try {
      for (const tooth of teethToProcess) {
        // Get tooth-specific data if available from AI analysis
        const toothData = getToothData(tooth);
        
        // Create evaluation record for each tooth
        const { data: evaluation, error: evalError } = await supabase
          .from('evaluations')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            patient_name: formData.patientName || null,
            patient_age: parseInt(formData.patientAge),
            tooth: tooth,
            region: getFullRegion(tooth),
            cavity_class: toothData?.cavity_class || formData.cavityClass,
            restoration_size: toothData?.restoration_size || formData.restorationSize,
            substrate: toothData?.substrate || formData.substrate,
            tooth_color: formData.vitaShade,
            depth: toothData?.depth || formData.depth,
            substrate_condition: toothData?.substrate_condition || formData.substrateCondition,
            enamel_condition: toothData?.enamel_condition || formData.enamelCondition,
            bruxism: formData.bruxism,
            aesthetic_level: formData.aestheticLevel,
            budget: formData.budget,
            longevity_expectation: formData.longevityExpectation,
            photo_frontal: uploadedPhotoPath,
            status: 'analyzing',
          })
          .select()
          .single();

        if (evalError) throw evalError;
        createdEvaluationIds.push(evaluation.id);

        // Call recommend-resin edge function for each tooth
        const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
          body: {
            evaluationId: evaluation.id,
            userId: user.id,
            patientAge: formData.patientAge,
            tooth: tooth,
            region: getFullRegion(tooth),
            cavityClass: toothData?.cavity_class || formData.cavityClass,
            restorationSize: toothData?.restoration_size || formData.restorationSize,
            substrate: toothData?.substrate || formData.substrate,
            bruxism: formData.bruxism,
            aestheticLevel: formData.aestheticLevel,
            toothColor: formData.vitaShade,
            stratificationNeeded: true,
            budget: formData.budget,
            longevityExpectation: formData.longevityExpectation,
          },
        });

        if (aiError) throw aiError;

        // Update status to draft (ready for checklist completion)
        await supabase
          .from('evaluations')
          .update({ status: 'draft' })
          .eq('id', evaluation.id);
      }

      // Success message - always navigate to evaluation page for consistency
      toast.success(`${teethToProcess.length} caso(s) gerado(s) com sucesso!`);
      navigate(`/evaluation/${sessionId}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar caso');
      setStep(3); // Go back to review on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation handlers
  const handleBack = () => {
    if (step === 1) {
      navigate('/dashboard');
    } else if (step === 3) {
      setStep(1);
    }
  };

  const canGoBack = step === 1 || step === 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-lg sm:text-xl font-semibold tracking-tight">Novo Caso</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-colors ${
                    step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs hidden sm:block">{s.name}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step Content */}
        {step === 1 && (
          <PhotoUploadStep
            imageBase64={imageBase64}
            onImageChange={setImageBase64}
            onAnalyze={analyzePhoto}
            isUploading={false}
          />
        )}

        {step === 2 && (
          <AnalyzingStep imageBase64={imageBase64} />
        )}

        {step === 3 && (
          <ReviewAnalysisStep
            analysisResult={analysisResult}
            formData={formData}
            onFormChange={handleFormChange}
            imageBase64={imageBase64}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
            selectedTeeth={selectedTeeth}
            onSelectedTeethChange={setSelectedTeeth}
          />
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Gerando Caso</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                A IA está criando o caso clínico personalizado...
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        {canGoBack && (
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {step === 3 && (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Gerar Caso
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
