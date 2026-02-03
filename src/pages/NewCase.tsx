import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Camera, Brain, ClipboardCheck, FileText, Loader2, Smile, Check, Save, Heart, Zap } from 'lucide-react';

import { useSubscription } from '@/hooks/useSubscription';
import { PhotoUploadStep, AdditionalPhotos } from '@/components/wizard/PhotoUploadStep';
import { PatientPreferencesStep, PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { AnalyzingStep } from '@/components/wizard/AnalyzingStep';
import { DSDStep, DSDResult } from '@/components/wizard/DSDStep';
import { ReviewAnalysisStep, PhotoAnalysisResult, ReviewFormData, DetectedTooth, TreatmentType, TREATMENT_LABELS } from '@/components/wizard/ReviewAnalysisStep';
import { DraftRestoreModal } from '@/components/wizard/DraftRestoreModal';
import { useWizardDraft, WizardDraft } from '@/hooks/useWizardDraft';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ThemeToggle } from '@/components/ThemeToggle';

const steps = [
  { id: 1, name: 'Foto', icon: Camera },
  { id: 2, name: 'Preferências', icon: Heart },
  { id: 3, name: 'Análise', icon: Brain },
  { id: 4, name: 'DSD', icon: Smile },
  { id: 5, name: 'Revisão', icon: ClipboardCheck },
  { id: 6, name: 'Resultado', icon: FileText },
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
  budget: 'moderado',
  longevityExpectation: 'médio',
  clinicalNotes: '',
  treatmentType: 'resina',
};

export default function NewCase() {
  const [step, setStep] = useState(1);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [dsdResult, setDsdResult] = useState<DSDResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientBirthDate, setPatientBirthDate] = useState<string | null>(null);
  const [originalPatientBirthDate, setOriginalPatientBirthDate] = useState<string | null>(null);
  // Removed tooth shape selection - now uses 'natural' as default internally
  const [toothTreatments, setToothTreatments] = useState<Record<string, TreatmentType>>({});
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotos>({ smile45: null, face: null });
  const [patientPreferences, setPatientPreferences] = useState<PatientPreferences>({ whiteningLevel: 'natural' });
  const [dobValidationError, setDobValidationError] = useState(false);
  
  // Draft restoration state
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { invokeFunction } = useAuthenticatedFetch();
  const { canUseCredits, refreshSubscription, creditsRemaining, creditsTotal, getCreditCost } = useSubscription();
  
  // Auto-save hook
  const { loadDraft, saveDraft, clearDraft, isSaving, lastSavedAt } = useWizardDraft(user?.id);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  // Ref to ensure draft check only runs once
  const hasCheckedDraftRef = useRef(false);
  const hasShownCreditWarningRef = useRef(false);

  // Proactive low-credit warning on mount
  useEffect(() => {
    if (hasShownCreditWarningRef.current) return;
    hasShownCreditWarningRef.current = true;

    const fullWorkflowCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
    if (creditsRemaining < fullWorkflowCost && creditsRemaining > 0) {
      toast.warning(`Você tem ${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''}. O fluxo completo (análise + DSD) requer ${fullWorkflowCost}.`, {
        duration: 6000,
        description: 'Você pode pular o DSD para economizar créditos.',
      });
    } else if (creditsRemaining === 0) {
      toast.error('Sem créditos disponíveis.', {
        description: 'Faça upgrade do seu plano para criar novos casos.',
        action: {
          label: 'Ver Planos',
          onClick: () => navigate('/pricing'),
        },
        duration: 8000,
      });
    }
  }, [creditsRemaining, getCreditCost, navigate]);

  // Check for pending draft on mount (only once)
  useEffect(() => {
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const checkDraft = async () => {
      const draft = await loadDraft();
      if (draft && draft.step >= 2) {
        setPendingDraft(draft);
        setShowRestoreModal(true);
      }
    };
    checkDraft();
  }, [loadDraft]);

  // Auto-save when state changes (only after analysis step)
  useEffect(() => {
    if (step >= 4 && user) {
      saveDraft({
        step,
        formData,
        selectedTeeth,
        toothTreatments,
        analysisResult,
        dsdResult,
        uploadedPhotoPath,
        additionalPhotos,
        patientPreferences,
      });
    }
  }, [step, formData, selectedTeeth, toothTreatments, analysisResult, dsdResult, uploadedPhotoPath, additionalPhotos, patientPreferences, saveDraft, user]);

  // Handle draft restoration - also load image from storage
  const handleRestoreDraft = useCallback(async () => {
    if (!pendingDraft) return;
    
    setStep(pendingDraft.step);
    setFormData(pendingDraft.formData);
    setSelectedTeeth(pendingDraft.selectedTeeth);
    setToothTreatments(pendingDraft.toothTreatments);
    setAnalysisResult(pendingDraft.analysisResult);
    setDsdResult(pendingDraft.dsdResult);
    setUploadedPhotoPath(pendingDraft.uploadedPhotoPath);
    setAdditionalPhotos(pendingDraft.additionalPhotos || { smile45: null, face: null });
    setPatientPreferences(pendingDraft.patientPreferences || { whiteningLevel: 'natural' });
    
    // Load image from storage if available
    if (pendingDraft.uploadedPhotoPath) {
      try {
        const { data } = await supabase.storage
          .from('clinical-photos')
          .download(pendingDraft.uploadedPhotoPath);
        
        if (data) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageBase64(reader.result as string);
          };
          reader.readAsDataURL(data);
        }
      } catch (err) {
        console.error('Error loading draft image:', err);
        // Image load failed, but continue with draft restoration
      }
    }
    
    setShowRestoreModal(false);
    setPendingDraft(null);
    toast.success('Rascunho restaurado com sucesso');
  }, [pendingDraft]);

  // Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowRestoreModal(false);
    setPendingDraft(null);
  }, [clearDraft]);

  // Auto-select all detected teeth and initialize per-tooth treatments when analysis completes
  // Preserves user overrides for teeth that already had a treatment set
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map(t => t.tooth);
      setSelectedTeeth(allTeeth);

      // Merge: keep existing user overrides, only initialize NEW teeth from AI
      setToothTreatments(prev => {
        const merged: Record<string, TreatmentType> = {};
        analysisResult.detected_teeth.forEach(t => {
          merged[t.tooth] = prev[t.tooth] || t.treatment_indication || 'resina';
        });
        return merged;
      });
    }

    // CRITICAL: Sync global treatment type with AI indication (for form-level default)
    if (analysisResult?.treatment_indication) {
      setFormData(prev => ({
        ...prev,
        treatmentType: analysisResult.treatment_indication as TreatmentType,
      }));
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

    // Pre-check credits before starting analysis
    if (!canUseCredits('case_analysis')) {
      toast.error('Créditos insuficientes. Faça upgrade do seu plano para continuar.', {
        action: {
          label: 'Ver Planos',
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }

    setStep(3); // Go to analyzing step (step 3 now)
    setIsAnalyzing(true);
    setAnalysisError(null); // Clear any previous error

    try {
      // Upload to storage first
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) {
        setUploadedPhotoPath(photoPath);
      }

      // Call the analyze-dental-photo edge function with authenticated fetch
      const { data, error } = await invokeFunction<{ analysis: PhotoAnalysisResult }>('analyze-dental-photo', {
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

        // Move to DSD step after successful analysis
        setIsAnalyzing(false);
        const cost = getCreditCost('case_analysis');
        toast.success('Análise concluída', {
          description: `${cost} crédito utilizado.`,
        });
        refreshSubscription(); // Update credit count after consumption
        setStep(4); // DSD step (step 4 now)
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Analysis error:', error);
      
      // Determine error message
      let errorMessage = 'Não foi possível analisar a foto. Verifique se a imagem está nítida e tente novamente.';
      
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Limite de requisições excedido. Aguarde alguns minutos e tente novamente.';
      } else if (err.message?.includes('402') || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') {
        errorMessage = 'Créditos insuficientes. Faça upgrade do seu plano para continuar.';
        refreshSubscription(); // Sync credit state
      } else if (err.message?.includes('não retornou dados')) {
        errorMessage = 'A IA não conseguiu identificar estruturas dentárias na foto. Tente uma foto com melhor iluminação.';
      }
      
      // Set error state - user stays on step 3 and sees error UI
      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
      // DO NOT advance step - let user decide to retry or skip
    }
  };

  // Handle preferences step navigation
  const handlePreferencesContinue = () => {
    analyzePhoto();
  };

  // Retry analysis
  const handleRetryAnalysis = () => {
    setAnalysisError(null);
    analyzePhoto();
  };

  // Skip to manual review
  const handleSkipToReview = () => {
    setAnalysisError(null);
    setIsAnalyzing(false);
    setStep(5); // Review step (step 5 now)
    toast.info('Prosseguindo com entrada manual.');
  };

  // Reanalyze photo (force new AI analysis)
  const handleReanalyze = async () => {
    if (!imageBase64) return;

    // Pre-check credits before reanalysis
    if (!canUseCredits('case_analysis')) {
      toast.error('Créditos insuficientes. Faça upgrade do seu plano para reanalisar.', {
        action: {
          label: 'Ver Planos',
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }

    setIsReanalyzing(true);

    try {
      // Call the analyze-dental-photo edge function with authenticated fetch
      const { data, error } = await invokeFunction<{ analysis: PhotoAnalysisResult }>('analyze-dental-photo', {
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

        refreshSubscription();
        toast.success('Reanálise concluída', {
          description: `${analysis.detected_teeth?.length || 0} dente(s) detectado(s). 1 crédito utilizado.`,
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Reanalysis error:', error);

      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (err.message?.includes('402') || err.code === 'INSUFFICIENT_CREDITS' || err.code === 'PAYMENT_REQUIRED') {
        toast.error('Créditos insuficientes para reanálise.', {
          action: {
            label: 'Ver Planos',
            onClick: () => navigate('/pricing'),
          },
        });
        refreshSubscription();
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
    if (!formData.patientAge || !patientBirthDate) {
      setDobValidationError(true);
      toast.error('Informe a data de nascimento do paciente');
      return false;
    }
    // For multi-tooth, we need at least one selected
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    if (teethToProcess.length === 0 || !teethToProcess[0]) {
      toast.error('Selecione pelo menos um dente');
      return false;
    }
    setDobValidationError(false);
    return true;
  };

  // Get tooth data from analysis result
  const getToothData = (toothNumber: string) => {
    return analysisResult?.detected_teeth?.find(t => t.tooth === toothNumber);
  };

  // Handler for per-tooth treatment changes
  const handleToothTreatmentChange = (tooth: string, treatment: TreatmentType) => {
    setToothTreatments(prev => ({ ...prev, [tooth]: treatment }));
  };

  // Get treatment type for a specific tooth
  const getToothTreatment = (tooth: string): TreatmentType => {
    return toothTreatments[tooth] || getToothData(tooth)?.treatment_indication || formData.treatmentType || 'resina';
  };

  // Submission steps for LoadingOverlay
  const submissionSteps = useMemo(() => {
    const teethCount = selectedTeeth.length > 0 ? selectedTeeth.length : 1;
    return [
      { label: 'Preparando dados do paciente...', completed: submissionStep >= 1 },
      { label: `Criando ${teethCount} caso(s) clínico(s)...`, completed: submissionStep >= 2 },
      { label: 'Gerando protocolos personalizados...', completed: submissionStep >= 3 },
      { label: 'Finalizando e salvando...', completed: submissionStep >= 4 },
    ];
  }, [submissionStep, selectedTeeth.length]);

  // Submit the case - process all selected teeth with their individual treatment types
  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStep(0);
    setStep(6); // Go to result step (step 6 now)

    // Determine which teeth to process
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    const createdEvaluationIds: string[] = [];
    
    // Generate a shared session_id for all teeth in this batch
    const sessionId = crypto.randomUUID();

    // Track treatment counts for success message
    const treatmentCounts: Record<string, number> = {};

    try {
      // Step 1: Handle patient creation/linking
      setSubmissionStep(1);
      let patientId = selectedPatientId;
      
      if (formData.patientName && !patientId) {
        // Create new patient if name provided but no existing patient selected
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: user.id,
            name: formData.patientName.trim(),
            birth_date: patientBirthDate || null,
          })
          .select('id')
          .single();

        if (patientError) {
          // If conflict (patient already exists), try to find them
          if (patientError.code === '23505') {
            const { data: existingPatient } = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', formData.patientName.trim())
              .maybeSingle();
            
            if (existingPatient) {
              patientId = existingPatient.id;
            }
          } else {
            console.error('Error creating patient:', patientError);
          }
        } else if (newPatient) {
          patientId = newPatient.id;
        }
      }
      
      // Update existing patient's birth_date if it was added for the first time
      if (patientId && patientBirthDate && !originalPatientBirthDate) {
        await supabase
          .from('patients')
          .update({ birth_date: patientBirthDate })
          .eq('id', patientId);
      }

      // Step 2: Create evaluation records
      setSubmissionStep(2);

      for (const tooth of teethToProcess) {
        // Get tooth-specific data if available from AI analysis
        const toothData = getToothData(tooth);
        
        // CRITICAL: Get treatment type for THIS specific tooth
        const treatmentType = getToothTreatment(tooth);
        
        // Track for success message
        treatmentCounts[treatmentType] = (treatmentCounts[treatmentType] || 0) + 1;
        
        // Create evaluation record for each tooth
        const insertData = {
          user_id: user.id,
          session_id: sessionId,
          patient_id: patientId || null,
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
          // CRITICAL: Save PER-TOOTH treatment type and DSD data
          treatment_type: treatmentType,
          desired_tooth_shape: 'natural', // Fixed default - removed manual selection
          ai_treatment_indication: toothData?.treatment_indication || analysisResult?.treatment_indication || null,
          ai_indication_reason: toothData?.indication_reason || analysisResult?.indication_reason || null,
          dsd_analysis: dsdResult?.analysis || null,
          dsd_simulation_url: dsdResult?.simulation_url || null,
          // Tooth position for visual highlight overlay
          tooth_bounds: toothData?.tooth_bounds || null,
          // Patient aesthetic preferences - descriptive text
          patient_aesthetic_goals: patientPreferences.whiteningLevel === 'hollywood'
            ? 'Clareamento intenso - nível Hollywood (BL3)'
            : patientPreferences.whiteningLevel === 'white'
            ? 'Clareamento notável - dentes mais brancos (BL1/BL2)'
            : patientPreferences.whiteningLevel === 'natural'
            ? 'Aparência natural e sutil (A1/A2)'
            : null,
          patient_desired_changes: null, // Legacy field - now using patient_aesthetic_goals
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase typing requires cast for dynamic data
        const { data: evaluation, error: evalError } = await supabase
          .from('evaluations')
          .insert(insertData as never)
          .select()
          .single();

        if (evalError) throw evalError;
        createdEvaluationIds.push(evaluation.id);

        // Step 3: Generate protocols
        setSubmissionStep(3);
        // CRITICAL: Call the correct edge function based on EACH TOOTH'S treatment type
        switch (treatmentType) {
          case 'porcelana':
            // Call recommend-cementation for porcelain veneers
            const { error: cementError } = await supabase.functions.invoke('recommend-cementation', {
              body: {
                evaluationId: evaluation.id,
                teeth: [tooth],
                shade: formData.vitaShade,
                ceramicType: 'Dissilicato de lítio',
                substrate: toothData?.substrate || formData.substrate,
                substrateCondition: toothData?.substrate_condition || formData.substrateCondition,
              },
            });
            if (cementError) throw cementError;
            break;

          case 'resina':
            // Call recommend-resin for composite restorations
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
          // Patient preferences - enriched text for AI
                aestheticGoals: patientPreferences.whiteningLevel === 'hollywood'
                  ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL3). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
                  : patientPreferences.whiteningLevel === 'white'
                  ? 'Paciente deseja clareamento NOTÁVEL (BL1/BL2). Ajustar camadas 1-2 tons mais claras.'
                  : patientPreferences.whiteningLevel === 'natural'
                  ? 'Paciente prefere aparência NATURAL com clareamento sutil (A1/A2).'
                  : undefined,
              },
            });
            if (aiError) throw aiError;
            break;

          case 'implante':
          case 'coroa':
          case 'endodontia':
          case 'encaminhamento':
            // For these treatment types, save a generic protocol with reference checklist
            const genericProtocol = getGenericProtocol(treatmentType, tooth, toothData);
            await supabase
              .from('evaluations')
              .update({ 
                generic_protocol: genericProtocol,
                recommendation_text: genericProtocol.summary,
              })
              .eq('id', evaluation.id);
            break;
        }

        // Update status to draft (ready for checklist completion)
        await supabase
          .from('evaluations')
          .update({ status: 'draft' })
          .eq('id', evaluation.id);
      }

      // Step 4: Finalize and save pending teeth
      setSubmissionStep(4);

      // Save unselected teeth to session_detected_teeth for later use
      const allDetectedTeeth = analysisResult?.detected_teeth || [];
      const unselectedTeeth = allDetectedTeeth.filter(t => !teethToProcess.includes(t.tooth));
      
      if (unselectedTeeth.length > 0) {
        const { error: pendingError } = await supabase
          .from('session_detected_teeth')
          .insert(
            unselectedTeeth.map(t => ({
              session_id: sessionId,
              user_id: user.id,
              tooth: t.tooth,
              priority: t.priority,
              treatment_indication: t.treatment_indication || 'resina',
              indication_reason: t.indication_reason || null,
              cavity_class: t.cavity_class,
              restoration_size: t.restoration_size,
              substrate: t.substrate,
              substrate_condition: t.substrate_condition,
              enamel_condition: t.enamel_condition,
              depth: t.depth,
              tooth_region: t.tooth_region,
              tooth_bounds: t.tooth_bounds || null,
            }))
          );
        
        if (pendingError) {
          console.error('Error saving pending teeth:', pendingError);
          // Non-critical error, don't block the flow
        }
      }

      // Build success message with treatment counts
      const treatmentMessages = Object.entries(treatmentCounts)
        .map(([type, count]) => `${count} ${TREATMENT_LABELS[type as TreatmentType] || type}`)
        .join(', ');
      
      toast.success(`Casos criados: ${treatmentMessages}`);
      
      // Clear draft after successful submission
      clearDraft();
      
      navigate(`/evaluation/${sessionId}`);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Error creating case:', error);
      
      let errorMessage = 'Erro ao criar caso';
      let shouldGoBack = true;
      
      // Erros de banco de dados
      if (err.code === '23505') {
        errorMessage = 'Paciente já cadastrado com este nome. Selecione o paciente existente.';
      } else if (err.code === '23503') {
        errorMessage = 'Erro de referência no banco de dados. Verifique os dados do paciente.';
      } 
      // Erros de Edge Functions
      else if (err.message?.includes('recommend-resin')) {
        errorMessage = 'Erro ao gerar protocolo de resina. Verifique a cor VITA e tente novamente.';
      } else if (err.message?.includes('recommend-cementation')) {
        errorMessage = 'Erro ao gerar protocolo de cimentação. Tente novamente.';
      }
      // Erros de validação
      else if (err.message?.includes('Cor VITA') || err.message?.includes('VITA inválida')) {
        errorMessage = 'Cor VITA inválida. Selecione uma cor válida (ex: A1, A2, B1).';
      }
      // Erros de rede
      else if (err.message?.includes('network') || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      // Erros de rate limit
      else if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Muitas requisições. Aguarde alguns minutos.';
        shouldGoBack = false;
      }
      // Erro genérico com detalhes
      else if (err.message && err.message.length < 100) {
        errorMessage = `Erro: ${err.message}`;
      }
      
      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) {
        setStep(5); // Voltar para revisão (step 5 é a revisão no wizard de 6 passos)
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate generic protocol for non-restorative treatments
  const getGenericProtocol = (treatmentType: TreatmentType, tooth: string, toothData: DetectedTooth | undefined) => {
    const protocols: Record<string, { summary: string; checklist: string[]; alerts: string[]; recommendations: string[] }> = {
      implante: {
        summary: `Dente ${tooth} indicado para extração e reabilitação com implante.`,
        checklist: [
          'Solicitar tomografia computadorizada cone beam',
          'Avaliar quantidade e qualidade óssea disponível',
          'Verificar espaço protético adequado',
          'Avaliar condição periodontal dos dentes adjacentes',
          'Planejar tempo de osseointegração',
          'Discutir opções de prótese provisória',
          'Encaminhar para cirurgião implantodontista',
          'Agendar retorno para acompanhamento',
        ],
        alerts: [
          'Avaliar contraindicações sistêmicas para cirurgia',
          'Verificar uso de bifosfonatos ou anticoagulantes',
          'Considerar enxerto ósseo se necessário',
        ],
        recommendations: [
          'Manter higiene oral adequada',
          'Evitar fumar durante o tratamento',
          'Seguir orientações pré e pós-operatórias',
        ],
      },
      coroa: {
        summary: `Dente ${tooth} indicado para restauração com coroa total.`,
        checklist: [
          'Realizar preparo coronário seguindo princípios biomecânicos',
          'Avaliar necessidade de núcleo/pino intrarradicular',
          'Selecionar material da coroa (metal-cerâmica, cerâmica pura, zircônia)',
          'Moldagem de trabalho',
          'Confecção de provisório adequado',
          'Prova da infraestrutura',
          'Seleção de cor com escala VITA',
          'Cimentação definitiva',
          'Ajuste oclusal',
          'Orientações de higiene',
        ],
        alerts: [
          'Verificar saúde pulpar antes do preparo',
          'Avaliar relação coroa-raiz',
          'Considerar tratamento periodontal prévio se necessário',
        ],
        recommendations: [
          'Proteger o provisório durante a espera',
          'Evitar alimentos duros e pegajosos',
        ],
      },
      endodontia: {
        summary: `Dente ${tooth} necessita de tratamento endodôntico antes de restauração definitiva.`,
        checklist: [
          'Confirmar diagnóstico pulpar',
          'Solicitar radiografia periapical',
          'Avaliar anatomia radicular',
          'Planejamento do acesso endodôntico',
          'Instrumentação e irrigação dos canais',
          'Medicação intracanal se necessário',
          'Obturação dos canais radiculares',
          'Radiografia de controle pós-obturação',
          'Agendar restauração definitiva',
          'Orientar retorno se houver dor ou inchaço',
        ],
        alerts: [
          'Avaliar necessidade de retratamento',
          'Verificar presença de lesão periapical',
          'Considerar encaminhamento para especialista em casos complexos',
        ],
        recommendations: [
          'Evitar mastigar do lado tratado até restauração definitiva',
          'Retornar imediatamente se houver dor intensa ou inchaço',
        ],
      },
      encaminhamento: {
        summary: `Dente ${tooth} requer avaliação especializada.`,
        checklist: [
          'Documentar achados clínicos',
          'Realizar radiografias necessárias',
          'Preparar relatório para o especialista',
          'Identificar especialidade adequada',
          'Orientar paciente sobre próximos passos',
          'Agendar retorno para acompanhamento',
        ],
        alerts: [
          'Urgência do encaminhamento depende do diagnóstico',
          'Manter comunicação com especialista',
        ],
        recommendations: [
          'Levar exames e relatório ao especialista',
          'Informar sobre medicamentos em uso',
        ],
      },
    };

    const protocol = protocols[treatmentType] || protocols.encaminhamento;
    
    return {
      treatment_type: treatmentType,
      tooth: tooth,
      ai_reason: toothData?.indication_reason || null,
      ...protocol,
    };
  };

  // DSD handlers - union of clinical + DSD teeth for review
  // Clinical analysis is the base, DSD adds any teeth it found that clinical missed
  const handleDSDComplete = (result: DSDResult | null) => {
    setDsdResult(result);

    if (result?.analysis?.suggestions?.length && analysisResult) {
      const clinicalTeeth = analysisResult.detected_teeth || [];
      // Coerce to string for safe comparison (Gemini may return number or string)
      const existingNumbers = new Set(clinicalTeeth.map(t => String(t.tooth)));

      // Add DSD-only teeth to the clinical list
      const dsdAdditions: DetectedTooth[] = [];
      for (const s of result.analysis.suggestions) {
        const toothId = String(s.tooth);
        if (!existingNumbers.has(toothId)) {
          const toothNum = parseInt(toothId);
          const isUpper = toothNum >= 10 && toothNum <= 28;
          const isAnteriorTooth = ['11','12','13','21','22','23','31','32','33','41','42','43'].includes(toothId);

          dsdAdditions.push({
            tooth: toothId,
            tooth_region: isAnteriorTooth
              ? (isUpper ? 'anterior-superior' : 'anterior-inferior')
              : (isUpper ? 'posterior-superior' : 'posterior-inferior'),
            cavity_class: null,
            restoration_size: null,
            substrate: null,
            substrate_condition: null,
            enamel_condition: null,
            depth: null,
            priority: 'média',
            notes: `DSD: ${s.current_issue} → ${s.proposed_change}`,
            treatment_indication: s.treatment_indication || 'resina',
            indication_reason: s.proposed_change,
          });
          existingNumbers.add(toothId);
        }
      }

      if (dsdAdditions.length > 0) {
        const unified = [...clinicalTeeth, ...dsdAdditions].sort(
          (a, b) => (parseInt(a.tooth) || 0) - (parseInt(b.tooth) || 0)
        );

        setAnalysisResult(prev => prev ? { ...prev, detected_teeth: unified } : null);
        // selectedTeeth and toothTreatments will update via the useEffect on analysisResult
      }

      // Sync DSD treatment recommendations with per-tooth treatments
      // If DSD suggests "porcelana" for a tooth that was set to "resina" (default),
      // upgrade the treatment to match the DSD recommendation
      setToothTreatments(prev => {
        const updated = { ...prev };
        for (const s of result.analysis.suggestions) {
          if (s.treatment_indication && s.treatment_indication !== 'resina') {
            // Only upgrade if user hasn't manually changed it (still at default "resina")
            if (!prev[s.tooth] || prev[s.tooth] === 'resina') {
              updated[s.tooth] = s.treatment_indication as TreatmentType;
            }
          }
        }
        return updated;
      });
    }

    setStep(5); // Move to review (step 5)
  };

  const handleDSDSkip = () => {
    setDsdResult(null);
    setStep(5); // Move to review (step 5)
  };

  // Navigation handlers
  const handleBack = () => {
    if (step === 1) {
      navigate('/dashboard');
    } else if (step === 2) {
      setStep(1); // Go back to photo from preferences
    } else if (step === 3) {
      // From analyzing step - go back to preferences
      setStep(2);
      setAnalysisError(null);
      setIsAnalyzing(false);
    } else if (step === 4) {
      setStep(2); // Go back to preferences from DSD (skip re-analysis)
    } else if (step === 5) {
      setStep(4); // Go back to DSD from review
    }
  };

  const canGoBack = step >= 1 && step <= 5;

  return (
    <div id="main-content" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <span className="text-lg sm:text-xl font-semibold tracking-tight">Novo Caso</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* Credit indicator */}
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${
                  creditsRemaining <= 2
                    ? 'border-red-300 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                    : creditsRemaining <= 5
                      ? 'border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : ''
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{creditsRemaining}</span>
                <span className="hidden sm:inline">crédito{creditsRemaining !== 1 ? 's' : ''}</span>
              </Badge>

              {/* Auto-save indicator */}
              {step >= 4 && (
                <Badge variant="outline" className="text-xs gap-1.5">
                  {isSaving ? (
                    <>
                      <Save className="w-3 h-3 animate-pulse" />
                      <span className="hidden sm:inline">Salvando...</span>
                    </>
                  ) : lastSavedAt ? (
                    <>
                      <Check className="w-3 h-3 text-primary" />
                      <span className="hidden sm:inline">Salvo</span>
                    </>
                  ) : null}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          {/* Step counter - always visible */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Passo {step} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {steps.find(s => s.id === step)?.name}
            </span>
          </div>
          
          {/* Progress bar */}
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Step icons */}
          <div className="flex justify-between">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-colors ${
                    step > s.id 
                      ? 'bg-primary/20 text-primary' 
                      : step === s.id 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : 'bg-secondary'
                  }`}
                >
                  {step > s.id ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <PhotoUploadStep
            imageBase64={imageBase64}
            onImageChange={setImageBase64}
            onAnalyze={() => setStep(2)}
            isUploading={false}
            additionalPhotos={additionalPhotos}
            onAdditionalPhotosChange={setAdditionalPhotos}
          />
        )}

        {step === 2 && (
          <PatientPreferencesStep
            preferences={patientPreferences}
            onPreferencesChange={setPatientPreferences}
            onContinue={handlePreferencesContinue}
          />
        )}

        {step === 3 && (
          <AnalyzingStep 
            imageBase64={imageBase64}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            onRetry={handleRetryAnalysis}
            onSkipToReview={handleSkipToReview}
            onBack={handleBack}
          />
        )}

        {step === 4 && (
          <DSDStep
            imageBase64={imageBase64}
            onComplete={handleDSDComplete}
            onSkip={handleDSDSkip}
            additionalPhotos={additionalPhotos}
            patientPreferences={patientPreferences}
            detectedTeeth={analysisResult?.detected_teeth}
            initialResult={dsdResult}
            clinicalObservations={analysisResult?.observations}
          />
        )}

        {step === 5 && (
          <ReviewAnalysisStep
            analysisResult={analysisResult}
            formData={formData}
            onFormChange={handleFormChange}
            imageBase64={imageBase64}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
            selectedTeeth={selectedTeeth}
            onSelectedTeethChange={setSelectedTeeth}
            toothTreatments={toothTreatments}
            onToothTreatmentChange={handleToothTreatmentChange}
            dsdObservations={dsdResult?.analysis?.observations}
            dsdSuggestions={dsdResult?.analysis?.suggestions}
            selectedPatientId={selectedPatientId}
            patientBirthDate={patientBirthDate}
            onPatientBirthDateChange={(date) => {
              setPatientBirthDate(date);
              if (date) setDobValidationError(false);
            }}
            dobError={dobValidationError}
            onDobErrorChange={setDobValidationError}
            whiteningLevel={patientPreferences.whiteningLevel}
            onPatientSelect={(_name, patientId, birthDate) => {
              setSelectedPatientId(patientId || null);
              setPatientBirthDate(birthDate || null);
              setOriginalPatientBirthDate(birthDate || null);
              if (birthDate) setDobValidationError(false);
              
              // Auto-calculate age if birth date exists
              if (birthDate) {
                const birth = new Date(birthDate);
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                  age--;
                }
                setFormData(prev => ({ ...prev, patientAge: String(age) }));
              } else {
                // Clear age if no birth date
                setFormData(prev => ({ ...prev, patientAge: '' }));
              }
            }}
          />
        )}

        {step === 6 && (
          <>
            <LoadingOverlay
              isLoading={isSubmitting}
              message="Gerando Caso Clínico"
              steps={submissionSteps}
            />
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Processando...
                </p>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        {canGoBack && (
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {step === 5 && (
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
      
      {/* Draft Restore Modal */}
      <DraftRestoreModal
        open={showRestoreModal}
        onOpenChange={setShowRestoreModal}
        lastSavedAt={pendingDraft?.lastSavedAt || null}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
    </div>
  );
}
