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
import { ReviewAnalysisStep, PhotoAnalysisResult, ReviewFormData } from '@/components/wizard/ReviewAnalysisStep';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Helper to determine if tooth is anterior
  const isAnterior = (tooth: string) => {
    const anteriorTeeth = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
    return anteriorTeeth.includes(tooth);
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
        setAnalysisResult(data.analysis);
        
        // Pre-fill form with detected values
        const analysis = data.analysis as PhotoAnalysisResult;
        setFormData((prev) => ({
          ...prev,
          tooth: analysis.tooth || prev.tooth,
          toothRegion: analysis.tooth_region || (analysis.tooth ? (isAnterior(analysis.tooth) ? 'anterior' : 'posterior') : prev.toothRegion),
          cavityClass: analysis.cavity_class || prev.cavityClass,
          restorationSize: analysis.restoration_size || prev.restorationSize,
          vitaShade: analysis.vita_shade || prev.vitaShade,
          substrate: analysis.substrate || prev.substrate,
          substrateCondition: analysis.substrate_condition || prev.substrateCondition,
          enamelCondition: analysis.enamel_condition || prev.enamelCondition,
          depth: analysis.depth || prev.depth,
        }));

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
    if (!formData.tooth) {
      toast.error('Selecione o dente');
      return false;
    }
    return true;
  };

  // Submit the case
  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setStep(4);

    try {
      // Create evaluation record
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .insert({
          user_id: user.id,
          patient_name: formData.patientName || null,
          patient_age: parseInt(formData.patientAge),
          tooth: formData.tooth,
          region: isAnterior(formData.tooth) ? 'anterior' : 'posterior',
          cavity_class: formData.cavityClass,
          restoration_size: formData.restorationSize.toLowerCase(),
          substrate: formData.substrate.toLowerCase(),
          tooth_color: formData.vitaShade,
          depth: formData.depth,
          substrate_condition: formData.substrateCondition,
          enamel_condition: formData.enamelCondition,
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

      // Call recommend-resin edge function
      const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
        body: {
          evaluationId: evaluation.id,
          userId: user.id,
          patientAge: formData.patientAge,
          tooth: formData.tooth,
          region: isAnterior(formData.tooth) ? 'anterior' : 'posterior',
          cavityClass: formData.cavityClass,
          restorationSize: formData.restorationSize.toLowerCase(),
          substrate: formData.substrate.toLowerCase(),
          bruxism: formData.bruxism,
          aestheticLevel: formData.aestheticLevel,
          toothColor: formData.vitaShade,
          stratificationNeeded: true,
          budget: formData.budget,
          longevityExpectation: formData.longevityExpectation,
        },
      });

      if (aiError) throw aiError;

      // Update status to completed
      await supabase
        .from('evaluations')
        .update({ status: 'completed' })
        .eq('id', evaluation.id);

      toast.success('Caso analisado com sucesso!');
      navigate(`/result/${evaluation.id}`);
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-xl font-semibold tracking-tight">Novo Caso</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
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
          />
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Gerando Protocolo</h2>
              <p className="text-muted-foreground">
                A IA está criando o protocolo de estratificação personalizado...
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        {canGoBack && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {step === 3 && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Gerar Protocolo
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
