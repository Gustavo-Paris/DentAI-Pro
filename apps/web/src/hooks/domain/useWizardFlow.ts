import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { inventory } from '@/data';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import type { WizardDraft, AdditionalPhotos } from '@/hooks/useWizardDraft';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  DetectedTooth,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';

import { INITIAL_FORM_DATA } from './wizard/constants';
import { isAnterior, inferCavityClass, getFullRegion, getGenericProtocol } from './wizard/helpers';
import { SAMPLE_CASE } from '@/data/sample-case';

// Types re-exported from wizard/types.ts
export type { SubmissionStep, WizardFlowState, WizardFlowActions } from './wizard/types';
import type { WizardFlowState, WizardFlowActions } from './wizard/types';

// Helpers imported from ./wizard/helpers.ts

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardFlow(): WizardFlowState & WizardFlowActions {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invokeFunction } = useAuthenticatedFetch();
  const {
    canUseCredits,
    refreshSubscription,
    creditsRemaining,
    creditsTotal,
    getCreditCost,
  } = useSubscription();
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'list', 0],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { items, count } = await inventory.list({ userId: user.id, page: 0, pageSize: 30 });
      return { items, totalCount: count, hasMore: count > 30 };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const { loadDraft, saveDraft, clearDraft, isSaving, lastSavedAt } = useWizardDraft(user?.id);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const prevStepRef = useRef(1);
  const analysisAbortedRef = useRef(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(INITIAL_FORM_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [dsdResult, setDsdResult] = useState<DSDResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientBirthDate, setPatientBirthDate] = useState<string | null>(null);
  const [originalPatientBirthDate, setOriginalPatientBirthDate] = useState<string | null>(null);
  const [toothTreatments, setToothTreatments] = useState<Record<string, TreatmentType>>({});
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotos>({
    smile45: null,
    face: null,
  });
  const [patientPreferences, setPatientPreferences] = useState<PatientPreferences>({
    whiteningLevel: 'natural',
  });
  const [dobValidationError, setDobValidationError] = useState(false);
  const [isQuickCase, setIsQuickCase] = useState(false);
  const [isSampleCase, setIsSampleCase] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);
  const [originalToothTreatments, setOriginalToothTreatments] = useState<
    Record<string, TreatmentType>
  >({});
  const [currentToothIndex, setCurrentToothIndex] = useState(-1);

  // Track if user manually overrode vitaShade — prevent AI from resetting it
  const vitaShadeManuallySetRef = useRef(false);
  const [creditConfirmData, setCreditConfirmData] = useState<{
    operation: string;
    operationLabel: string;
    cost: number;
    remaining: number;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------

  const hasCheckedDraftRef = useRef(false);
  const hasCheckedSampleRef = useRef(false);
  const hasShownCreditWarningRef = useRef(false);
  const isQuickCaseRef = useRef(false);
  const fullFlowCreditsConfirmedRef = useRef(false);
  const creditConfirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const canGoBack = step >= 1 && step <= 5;
  const hasInventory = (inventoryData?.items?.length ?? 0) > 0;

  const submissionSteps = useMemo(() => {
    const teethToShow = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth].filter(Boolean);
    const steps: SubmissionStep[] = [
      { label: 'Preparando dados do paciente...', completed: submissionStep >= 1 },
    ];

    if (submissionStep >= 2 && teethToShow.length > 0) {
      for (let i = 0; i < teethToShow.length; i++) {
        const isCompleted = i < currentToothIndex || submissionStep >= 4;
        const isActive = i === currentToothIndex && submissionStep >= 2 && submissionStep < 4;
        steps.push({
          label: `Dente ${teethToShow[i]}${isActive ? ' — gerando protocolo...' : ''}`,
          completed: isCompleted,
        });
      }
    }

    steps.push({ label: 'Finalizando e salvando...', completed: submissionStep >= 4 });
    return steps;
  }, [submissionStep, selectedTeeth, formData.tooth, currentToothIndex]);

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const getToothData = useCallback(
    (toothNumber: string) => {
      return analysisResult?.detected_teeth?.find((t) => t.tooth === toothNumber);
    },
    [analysisResult],
  );

  const getToothTreatment = useCallback(
    (tooth: string): TreatmentType => {
      return (
        toothTreatments[tooth] ||
        getToothData(tooth)?.treatment_indication ||
        formData.treatmentType ||
        'resina'
      );
    },
    [toothTreatments, getToothData, formData.treatmentType],
  );

  const uploadImageToStorage = useCallback(
    async (base64: string): Promise<string | null> => {
      if (!user) return null;
      try {
        const byteString = atob(base64.split(',')[1]);
        const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const fileName = `${user.id}/intraoral_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('clinical-photos')
          .upload(fileName, blob, { upsert: true });
        if (error) throw error;
        return fileName;
      } catch (error) {
        logger.error('Upload error:', error);
        return null;
      }
    },
    [user],
  );

  const validateForm = useCallback((): boolean => {
    if (!formData.patientAge || !patientBirthDate) {
      // DOB is optional — show soft warning and default age to 30
      toast.warning('Data de nascimento não informada. Usando idade padrão de 30 anos.', {
        duration: 4000,
      });
      setFormData((prev) => ({ ...prev, patientAge: prev.patientAge || '30' }));
    }
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    if (teethToProcess.length === 0 || !teethToProcess[0]) {
      toast.error('Selecione pelo menos um dente');
      return false;
    }
    setDobValidationError(false);
    return true;
  }, [formData.patientAge, formData.tooth, patientBirthDate, selectedTeeth]);

  // -------------------------------------------------------------------------
  // Credit confirmation
  // -------------------------------------------------------------------------

  const confirmCreditUse = useCallback(
    (operation: string, operationLabel: string, costOverride?: number): Promise<boolean> => {
      const cost = costOverride ?? getCreditCost(operation);
      return new Promise((resolve) => {
        creditConfirmResolveRef.current = resolve;
        setCreditConfirmData({ operation, operationLabel, cost, remaining: creditsRemaining });
      });
    },
    [getCreditCost, creditsRemaining],
  );

  const handleCreditConfirm = useCallback((confirmed: boolean) => {
    creditConfirmResolveRef.current?.(confirmed);
    creditConfirmResolveRef.current = null;
    setCreditConfirmData(null);
  }, []);

  // -------------------------------------------------------------------------
  // Core Actions
  // -------------------------------------------------------------------------

  const analyzePhoto = useCallback(async () => {
    if (!imageBase64) return;

    // Full flow credits were already confirmed upfront in goToPreferences
    if (!fullFlowCreditsConfirmedRef.current) {
      if (!canUseCredits('case_analysis')) {
        toast.error('Créditos insuficientes. Faça upgrade do seu plano para continuar.', {
          action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
        });
        return;
      }

      const confirmed = await confirmCreditUse('case_analysis', 'Análise com IA');
      if (!confirmed) return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);
    analysisAbortedRef.current = false;

    try {
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) setUploadedPhotoPath(photoPath);

      const { data } = await withRetry(
        async () => {
          const result = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
            'analyze-dental-photo',
            { body: { imageBase64, imageType: 'intraoral' } },
          );
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt) => {
            logger.warn(`Analysis retry attempt ${attempt}`);
            toast.info('Reconectando ao servidor...', { duration: 3000 });
          },
        },
      );

      // If user cancelled while request was in-flight, discard result
      if (analysisAbortedRef.current) {
        analysisAbortedRef.current = false;
        return;
      }

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion:
              primaryToothData.tooth_region ||
              (primaryToothData.tooth
                ? isAnterior(primaryToothData.tooth)
                  ? 'anterior'
                  : 'posterior'
                : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            // Only update vitaShade from AI if user hasn't manually overridden it
            vitaShade: vitaShadeManuallySetRef.current ? prev.vitaShade : (analysis.vita_shade || prev.vitaShade),
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        } else if (analysis.vita_shade && !vitaShadeManuallySetRef.current) {
          setFormData((prev) => ({ ...prev, vitaShade: analysis.vita_shade || prev.vitaShade }));
        }

        setIsAnalyzing(false);
        const cost = getCreditCost('case_analysis');
        toast.success('Análise concluída', { description: `${cost} crédito utilizado.` });
        refreshSubscription();
        setStep(isQuickCaseRef.current ? 5 : 4);
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; name?: string };
      logger.error('Analysis error:', error);

      let errorMessage: string;
      const isNetwork =
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('network') ||
        err.message?.includes('timeout');

      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Limite de requisições excedido. Aguarde 1-2 minutos antes de tentar novamente.';
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
        errorMessage = 'Créditos insuficientes. Faça upgrade do seu plano para continuar.';
        refreshSubscription();
      } else if (err.message?.includes('não retornou dados')) {
        errorMessage =
          'A IA não conseguiu identificar estruturas dentárias. Dicas: use boa iluminação, foque na região intraoral e evite reflexos no espelho.';
      } else if (isNetwork) {
        errorMessage =
          'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('500') || err.message?.includes('edge function')) {
        errorMessage =
          'Erro temporário no servidor. Seu crédito não foi consumido — tente novamente em instantes.';
      } else {
        errorMessage =
          'Não foi possível analisar a foto. Verifique se a imagem está nítida e tente novamente.';
      }

      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
    }
  }, [
    imageBase64,
    canUseCredits,
    confirmCreditUse,
    navigate,
    uploadImageToStorage,
    invokeFunction,
    getCreditCost,
    refreshSubscription,
  ]);

  const handleReanalyze = useCallback(async () => {
    if (!imageBase64) return;

    if (!canUseCredits('case_analysis')) {
      toast.error('Créditos insuficientes. Faça upgrade do seu plano para reanalisar.', {
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
      });
      return;
    }

    setIsReanalyzing(true);
    try {
      const { data } = await withRetry(
        async () => {
          const result = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
            'analyze-dental-photo',
            { body: { imageBase64, imageType: 'intraoral' } },
          );
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt) => {
            logger.warn(`Reanalysis retry attempt ${attempt}`);
            toast.info('Reconectando ao servidor...', { duration: 3000 });
          },
        },
      );

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            tooth: primaryToothData.tooth || prev.tooth,
            toothRegion:
              primaryToothData.tooth_region ||
              (primaryToothData.tooth
                ? isAnterior(primaryToothData.tooth)
                  ? 'anterior'
                  : 'posterior'
                : prev.toothRegion),
            cavityClass: primaryToothData.cavity_class || prev.cavityClass,
            restorationSize: primaryToothData.restoration_size || prev.restorationSize,
            // Only update vitaShade from AI if user hasn't manually overridden it
            vitaShade: vitaShadeManuallySetRef.current ? prev.vitaShade : (analysis.vita_shade || prev.vitaShade),
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
      logger.error('Reanalysis error:', error);
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
        toast.error('Créditos insuficientes para reanálise.', {
          action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
        });
        refreshSubscription();
      } else {
        toast.error('Erro na reanálise. Tente novamente.');
      }
    } finally {
      setIsReanalyzing(false);
    }
  }, [imageBase64, canUseCredits, navigate, invokeFunction, refreshSubscription]);

  const handleSubmit = useCallback(async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStep(0);
    setCurrentToothIndex(-1);
    setStep(6);

    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formData.tooth];
    const createdEvaluationIds: string[] = [];
    const sessionId = crypto.randomUUID();
    const treatmentCounts: Record<string, number> = {};
    let successCount = 0;
    const failedTeeth: Array<{ tooth: string; error: unknown }> = [];

    try {
      // Step 1: Patient
      setSubmissionStep(1);
      let patientId = selectedPatientId;

      if (formData.patientName && !patientId) {
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
          if (patientError.code === '23505') {
            const { data: existingPatient } = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', formData.patientName.trim())
              .maybeSingle();
            if (existingPatient) patientId = existingPatient.id;
          } else {
            logger.error('Error creating patient:', patientError);
          }
        } else if (newPatient) {
          patientId = newPatient.id;
        }
      }

      if (patientId && patientBirthDate && !originalPatientBirthDate) {
        await supabase
          .from('patients')
          .update({ birth_date: patientBirthDate })
          .eq('id', patientId);
      }

      // Step 2: Evaluations + Protocols (per-tooth with retry)
      setSubmissionStep(2);

      for (const [index, tooth] of teethToProcess.entries()) {
        setCurrentToothIndex(index);
        const toothData = getToothData(tooth);
        const treatmentType = getToothTreatment(tooth);
        // Normalize treatment type: Gemini sometimes returns English values
        const normalizedTreatment = ({
          porcelain: 'porcelana', resin: 'resina', crown: 'coroa',
          implant: 'implante', endodontics: 'endodontia', referral: 'encaminhamento',
          gingivoplasty: 'gengivoplastia',
        } as Record<string, TreatmentType>)[treatmentType] || treatmentType;

        let evaluationId: string | null = null;

        // Gengivoplasty is a tissue procedure, not per-tooth — use sensible defaults
        const isGengivoplasty = tooth === 'GENGIVO' || normalizedTreatment === 'gengivoplastia';

        try {
          // Insert evaluation (DB is fast, no retry needed)
          const insertData = {
            user_id: user.id,
            session_id: sessionId,
            patient_id: patientId || null,
            patient_name: formData.patientName || null,
            patient_age: parseInt(formData.patientAge) || 30,
            tooth: isGengivoplasty ? 'GENGIVO' : tooth,
            region: isGengivoplasty ? 'anterior-superior' : getFullRegion(tooth),
            cavity_class: isGengivoplasty ? 'N/A' : inferCavityClass(toothData, formData.cavityClass, normalizedTreatment),
            restoration_size: isGengivoplasty ? 'N/A' : (toothData?.restoration_size || formData.restorationSize),
            substrate: isGengivoplasty ? 'N/A' : (toothData?.substrate || formData.substrate),
            tooth_color: formData.vitaShade || 'A2',
            depth: isGengivoplasty ? null : (toothData?.depth || formData.depth),
            substrate_condition: isGengivoplasty ? null : (toothData?.substrate_condition || formData.substrateCondition),
            enamel_condition: isGengivoplasty ? null : (toothData?.enamel_condition || formData.enamelCondition),
            bruxism: formData.bruxism,
            aesthetic_level: formData.aestheticLevel || 'estético',
            budget: formData.budget || 'moderado',
            longevity_expectation: formData.longevityExpectation || 'longo',
            photo_frontal: uploadedPhotoPath,
            status: 'analyzing',
            treatment_type: normalizedTreatment,
            desired_tooth_shape: 'natural',
            ai_treatment_indication:
              isGengivoplasty ? 'gengivoplastia' : (toothData?.treatment_indication || analysisResult?.treatment_indication || null),
            ai_indication_reason:
              isGengivoplasty ? 'Harmonização gengival identificada pela análise DSD' : (toothData?.indication_reason || analysisResult?.indication_reason || null),
            dsd_analysis: dsdResult?.analysis || null,
            dsd_simulation_url: dsdResult?.simulation_url || null,
            dsd_simulation_layers: dsdResult?.layers || null,
            tooth_bounds: toothData?.tooth_bounds || null,
            patient_aesthetic_goals:
              patientPreferences.whiteningLevel === 'hollywood'
                ? 'Clareamento intenso - nível Hollywood (BL1)'
                : patientPreferences.whiteningLevel === 'white'
                  ? 'Clareamento notável - dentes mais brancos (BL2/BL3)'
                  : patientPreferences.whiteningLevel === 'natural'
                    ? 'Aparência natural e sutil (A1/A2)'
                    : null,
            patient_desired_changes: null,
          };

          const { data: evaluation, error: evalError } = await supabase
            .from('evaluations')
            .insert(insertData as never)
            .select()
            .single();

          if (evalError) throw evalError;
          evaluationId = evaluation.id;
          createdEvaluationIds.push(evaluation.id);

          // Generate protocol WITH retry (2 retries, 2s exponential backoff)
          await withRetry(
            async () => {
              switch (normalizedTreatment) {
                case 'porcelana': {
                  // Build DSD context for this tooth if available
                  const cementDsdSuggestion = dsdResult?.analysis?.suggestions?.find(
                    s => s.tooth === tooth,
                  );
                  const { error: cementError } = await supabase.functions.invoke(
                    'recommend-cementation',
                    {
                      body: {
                        evaluationId: evaluation.id,
                        teeth: [tooth],
                        shade: formData.vitaShade,
                        ceramicType: 'Dissilicato de lítio',
                        substrate: toothData?.substrate || formData.substrate,
                        substrateCondition:
                          toothData?.substrate_condition || formData.substrateCondition,
                        aestheticGoals:
                          patientPreferences.whiteningLevel === 'hollywood'
                            ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). A cor ALVO da faceta e do cimento deve ser BL1 ou compatível.'
                            : patientPreferences.whiteningLevel === 'white'
                              ? 'Paciente deseja clareamento NOTÁVEL (BL2/BL3). A cor ALVO da faceta e do cimento deve ser BL2/BL3 ou compatível.'
                              : patientPreferences.whiteningLevel === 'natural'
                                ? 'Paciente prefere aparência NATURAL (A1/A2).'
                                : undefined,
                        dsdContext: cementDsdSuggestion
                          ? {
                              currentIssue: cementDsdSuggestion.current_issue,
                              proposedChange: cementDsdSuggestion.proposed_change,
                              observations: dsdResult?.analysis?.observations || [],
                            }
                          : undefined,
                      },
                    },
                  );
                  if (cementError) throw cementError;
                  break;
                }
                case 'resina': {
                  // Build DSD context for this tooth if available
                  const resinDsdSuggestion = dsdResult?.analysis?.suggestions?.find(
                    s => s.tooth === tooth,
                  );
                  const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
                    body: {
                      evaluationId: evaluation.id,
                      userId: user.id,
                      patientAge: formData.patientAge || '30',
                      tooth,
                      region: getFullRegion(tooth),
                      cavityClass: inferCavityClass(toothData, formData.cavityClass, normalizedTreatment),
                      restorationSize: toothData?.restoration_size || formData.restorationSize,
                      substrate: toothData?.substrate || formData.substrate,
                      bruxism: formData.bruxism,
                      aestheticLevel: formData.aestheticLevel,
                      toothColor: formData.vitaShade,
                      stratificationNeeded: true,
                      budget: formData.budget,
                      longevityExpectation: formData.longevityExpectation,
                      aestheticGoals:
                        patientPreferences.whiteningLevel === 'hollywood'
                          ? 'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
                          : patientPreferences.whiteningLevel === 'white'
                            ? 'Paciente deseja clareamento NOTÁVEL (BL2/BL3). Ajustar camadas 1-2 tons mais claras.'
                            : patientPreferences.whiteningLevel === 'natural'
                              ? 'Paciente prefere aparência NATURAL (A1/A2). Manter tons naturais.'
                              : undefined,
                      dsdContext: resinDsdSuggestion
                        ? {
                            currentIssue: resinDsdSuggestion.current_issue,
                            proposedChange: resinDsdSuggestion.proposed_change,
                            observations: dsdResult?.analysis?.observations || [],
                          }
                        : undefined,
                    },
                  });
                  if (aiError) throw aiError;
                  break;
                }
                case 'implante':
                case 'coroa':
                case 'endodontia':
                case 'encaminhamento':
                case 'gengivoplastia': {
                  const genericProtocol = getGenericProtocol(normalizedTreatment, tooth, toothData);
                  // Enrich gengivoplasty summary with DSD details if available
                  if (normalizedTreatment === 'gengivoplastia' && dsdResult?.analysis?.suggestions) {
                    const gingivoSuggestions = dsdResult.analysis.suggestions.filter(s => {
                      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
                      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
                    });
                    if (gingivoSuggestions.length > 0) {
                      genericProtocol.summary += ` Dentes envolvidos: ${gingivoSuggestions.map(s => s.tooth).join(', ')}. Observações DSD: ${gingivoSuggestions.map(s => s.proposed_change).join('; ')}.`;
                    }
                  }
                  await supabase
                    .from('evaluations')
                    .update({
                      generic_protocol: genericProtocol,
                      recommendation_text: genericProtocol.summary,
                    })
                    .eq('id', evaluation.id);
                  break;
                }
              }
            },
            {
              maxRetries: 2,
              baseDelay: 2000,
              onRetry: (attempt, err) => {
                logger.warn(`Retry ${attempt} for tooth ${tooth}:`, err);
              },
            },
          );

          await supabase.from('evaluations').update({ status: 'draft' }).eq('id', evaluation.id);
          treatmentCounts[normalizedTreatment] = (treatmentCounts[normalizedTreatment] || 0) + 1;
          successCount++;
        } catch (toothError) {
          logger.error(`Error processing tooth ${tooth}:`, toothError);
          failedTeeth.push({ tooth, error: toothError });

          // Mark the evaluation as 'error' so the user can identify it
          if (evaluationId) {
            await supabase
              .from('evaluations')
              .update({ status: 'error' })
              .eq('id', evaluationId);
          }
        }
      }

      // Step 4: Save pending teeth
      setSubmissionStep(4);
      const allDetectedTeeth = analysisResult?.detected_teeth || [];
      const unselectedTeeth = allDetectedTeeth.filter((t) => !teethToProcess.includes(t.tooth));

      if (unselectedTeeth.length > 0) {
        const { error: pendingError } = await supabase.from('session_detected_teeth').insert(
          unselectedTeeth.map((t) => ({
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
          })),
        );
        if (pendingError) {
          logger.error('Error saving pending teeth:', pendingError);
        }
      }

      // Determine outcome: all success, partial success, or all failed
      if (successCount === 0) {
        // ALL failed — stay on step 5
        const firstErr = failedTeeth[0]?.error as { message?: string; code?: string } | undefined;
        let errorMessage = 'Erro ao criar caso. Nenhum protocolo foi gerado.';
        if (firstErr?.message?.includes('Failed to fetch') || firstErr?.message?.includes('edge function')) {
          errorMessage = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
        }
        toast.error(errorMessage, { duration: 5000 });
        setStep(5);
      } else {
        // At least some succeeded — show success animation then navigate
        clearDraft();
        toast.dismiss();
        setIsSubmitting(false);
        setSubmissionComplete(true);

        if (failedTeeth.length > 0) {
          // Partial success — warn about failures
          const failedList = failedTeeth.map((f) => f.tooth).join(', ');
          toast.warning(
            `${successCount} de ${teethToProcess.length} protocolos gerados. Dentes ${failedList} falharam — tente novamente.`,
            { duration: 8000 },
          );
        } else {
          // All succeeded
          toast.success(
            `${successCount} protocolo${successCount > 1 ? 's' : ''} gerado${successCount > 1 ? 's' : ''} com sucesso`,
          );
        }

        // Brief success animation before navigating
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSubmissionComplete(false);
        navigate(`/evaluation/${sessionId}`);
      }
    } catch (error: unknown) {
      // This catch handles errors BEFORE the loop (patient creation, etc.)
      const err = error as { message?: string; code?: string };
      logger.error('Error creating case:', error);

      let errorMessage = 'Erro ao criar caso';
      let shouldGoBack = true;

      if (err.code === '23505') {
        errorMessage = 'Paciente já cadastrado com este nome. Selecione o paciente existente.';
      } else if (err.code === '23503') {
        errorMessage = 'Erro de referência no banco de dados. Verifique os dados do paciente.';
      } else if (
        err.message?.includes('network') ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch')
      ) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = 'Muitas requisições. Aguarde alguns minutos.';
        shouldGoBack = false;
      } else if (err.message && err.message.length < 100) {
        errorMessage = `Erro: ${err.message}`;
      }

      toast.error(errorMessage, { duration: 5000 });
      if (shouldGoBack) setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    validateForm,
    selectedTeeth,
    formData,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    uploadedPhotoPath,
    analysisResult,
    dsdResult,
    patientPreferences,
    getToothData,
    getToothTreatment,
    clearDraft,
    navigate,
  ]);

  // Track step direction for animations
  useEffect(() => {
    if (step !== prevStepRef.current) {
      setStepDirection(step > prevStepRef.current ? 'forward' : 'backward');
      prevStepRef.current = step;
    }
  }, [step]);

  // -------------------------------------------------------------------------
  // Navigation Actions
  // -------------------------------------------------------------------------

  const goToStep = useCallback((targetStep: number) => {
    // Only allow jumping to completed steps (past steps < current)
    if (targetStep >= step || targetStep < 1 || step === 6) return;
    // Step 3 is auto-processing — redirect to step 2 (or step 1 for quick case)
    if (targetStep === 3) {
      setStep(isQuickCase ? 1 : 2);
      return;
    }
    // Quick case: skip steps 2 (preferences) and 4 (DSD)
    if (isQuickCase && (targetStep === 2 || targetStep === 4)) return;
    setStep(targetStep);
  }, [step, isQuickCase]);

  const goToPreferences = useCallback(async () => {
    setIsQuickCase(false);
    isQuickCaseRef.current = false;

    const fullCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');

    if (creditsRemaining < fullCost) {
      toast.error('Créditos insuficientes para análise completa. Faça upgrade do seu plano.', {
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
      });
      return;
    }

    const confirmed = await confirmCreditUse('full_analysis', 'Análise Completa com IA', fullCost);
    if (!confirmed) return;

    fullFlowCreditsConfirmedRef.current = true;
    setStep(2);
  }, [getCreditCost, creditsRemaining, navigate, confirmCreditUse]);

  const goToQuickCase = useCallback(() => {
    setIsQuickCase(true);
    isQuickCaseRef.current = true;
    setPatientPreferences({ whiteningLevel: 'natural' });
    analyzePhoto();
  }, [analyzePhoto]);

  const handlePreferencesContinue = useCallback(() => {
    analyzePhoto();
  }, [analyzePhoto]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      navigate('/dashboard');
    } else if (step === 2) {
      fullFlowCreditsConfirmedRef.current = false;
      setStep(1);
    } else if (step === 3) {
      if (isQuickCase) {
        setStep(1);
        setIsQuickCase(false);
        isQuickCaseRef.current = false;
      } else {
        setStep(2);
      }
      setAnalysisError(null);
      setIsAnalyzing(false);
    } else if (step === 4) {
      setStep(2);
    } else if (step === 5) {
      if (isQuickCase) {
        setStep(3);
      } else {
        setStep(4);
      }
    }
  }, [step, navigate, isQuickCase]);

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyzePhoto();
  }, [analyzePhoto]);

  const handleSkipToReview = useCallback(() => {
    setAnalysisError(null);
    setIsAnalyzing(false);
    setStep(5);
    toast.info('Prosseguindo com entrada manual.');
  }, []);

  const cancelAnalysis = useCallback(() => {
    analysisAbortedRef.current = true;
    setIsAnalyzing(false);
    setAnalysisError(null);
    if (isQuickCase) {
      setStep(1);
      setIsQuickCase(false);
      isQuickCaseRef.current = false;
    } else {
      setStep(2);
    }
    toast.info('Análise cancelada.');
  }, [isQuickCase]);

  // -------------------------------------------------------------------------
  // DSD Actions
  // -------------------------------------------------------------------------

  const handleDSDComplete = useCallback(
    (result: DSDResult | null) => {
      setDsdResult(result);

      if (result?.analysis?.suggestions?.length && analysisResult) {
        const clinicalTeeth = analysisResult.detected_teeth || [];
        const existingNumbers = new Set(clinicalTeeth.map((t) => String(t.tooth)));

        const dsdAdditions: DetectedTooth[] = [];
        for (const s of result.analysis.suggestions) {
          // Skip gengivoplasty suggestions — these are handled as a separate case, not per-tooth
          const proposedLower = s.proposed_change.toLowerCase();
          if (proposedLower.includes('gengivoplastia') || proposedLower.includes('gengival')) continue;

          const toothId = String(s.tooth);
          if (!existingNumbers.has(toothId)) {
            const toothNum = parseInt(toothId);
            const isUpper = toothNum >= 10 && toothNum <= 28;
            const isAnteriorTooth = isAnterior(toothId);

            dsdAdditions.push({
              tooth: toothId,
              tooth_region: isAnteriorTooth
                ? isUpper
                  ? 'anterior-superior'
                  : 'anterior-inferior'
                : isUpper
                  ? 'posterior-superior'
                  : 'posterior-inferior',
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
            (a, b) => (parseInt(a.tooth) || 0) - (parseInt(b.tooth) || 0),
          );
          setAnalysisResult((prev) => (prev ? { ...prev, detected_teeth: unified } : null));
        }

        setToothTreatments((prev) => {
          const updated = { ...prev };
          for (const s of result.analysis.suggestions) {
            // Skip gengivoplasty — don't override per-tooth treatments
            const proposedLower = s.proposed_change.toLowerCase();
            if (proposedLower.includes('gengivoplastia') || proposedLower.includes('gengival')) continue;

            if (s.treatment_indication && s.treatment_indication !== 'resina') {
              if (!prev[s.tooth] || prev[s.tooth] === 'resina') {
                updated[s.tooth] = s.treatment_indication as TreatmentType;
              }
            }
          }
          return updated;
        });
      }

      // Auto-add gengivoplasty case if DSD layers include complete-treatment with gengivoplasty
      // OR if any suggestion has treatment_indication: "gengivoplastia"
      const hasGengivoplasty = result?.layers?.some(l => l.includes_gengivoplasty) ||
        result?.analysis?.suggestions?.some(s => s.treatment_indication === 'gengivoplastia');
      if (hasGengivoplasty) {
        // Add a virtual "GENGIVO" tooth entry for gengivoplasty
        setSelectedTeeth((prev) =>
          prev.includes('GENGIVO') ? prev : [...prev, 'GENGIVO'],
        );
        setToothTreatments((prev) => ({
          ...prev,
          GENGIVO: 'gengivoplastia' as TreatmentType,
        }));
        toast.info('Gengivoplastia adicionada automaticamente pelo DSD');
      }

      setStep(5);
    },
    [analysisResult],
  );

  const handleDSDSkip = useCallback(() => {
    setDsdResult(null);
    setStep(5);
  }, []);

  // Update dsdResult in parent state as the DSD analysis progresses (for draft auto-save)
  const handleDSDResultChange = useCallback((result: DSDResult | null) => {
    setDsdResult(result);
  }, []);

  // -------------------------------------------------------------------------
  // Review Actions
  // -------------------------------------------------------------------------

  const updateFormData = useCallback((updates: Partial<ReviewFormData>) => {
    // Track manual vitaShade override so AI doesn't reset it
    if ('vitaShade' in updates && updates.vitaShade) {
      vitaShadeManuallySetRef.current = true;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleToothTreatmentChange = useCallback((tooth: string, treatment: TreatmentType) => {
    setToothTreatments((prev) => ({ ...prev, [tooth]: treatment }));
  }, []);

  const handleRestoreAiSuggestion = useCallback(
    (tooth: string) => {
      const original = originalToothTreatments[tooth];
      if (original) {
        setToothTreatments((prev) => ({ ...prev, [tooth]: original }));
      }
    },
    [originalToothTreatments],
  );

  const handlePatientSelect = useCallback(
    (_name: string, patientId?: string, birthDate?: string | null) => {
      setSelectedPatientId(patientId || null);
      setPatientBirthDate(birthDate || null);
      setOriginalPatientBirthDate(birthDate || null);
      if (birthDate) setDobValidationError(false);

      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        setFormData((prev) => ({ ...prev, patientAge: String(age) }));
      } else {
        setFormData((prev) => ({ ...prev, patientAge: '' }));
      }
    },
    [],
  );

  const handlePatientBirthDateChange = useCallback((date: string | null) => {
    setPatientBirthDate(date);
    if (date) setDobValidationError(false);
  }, []);

  // -------------------------------------------------------------------------
  // Draft Actions
  // -------------------------------------------------------------------------

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
        logger.error('Error loading draft image:', err);
      }
    }

    setShowRestoreModal(false);
    setPendingDraft(null);
    toast.success('Rascunho restaurado com sucesso');
  }, [pendingDraft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowRestoreModal(false);
    setPendingDraft(null);
  }, [clearDraft]);

  // -------------------------------------------------------------------------
  // Side Effects
  // -------------------------------------------------------------------------

  // Low-credit warning on mount
  useEffect(() => {
    if (hasShownCreditWarningRef.current) return;
    hasShownCreditWarningRef.current = true;

    const fullWorkflowCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
    if (creditsRemaining < fullWorkflowCost && creditsRemaining > 0) {
      toast.warning(
        `Você tem ${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''}. O fluxo completo (análise + DSD) requer ${fullWorkflowCost}.`,
        { duration: 6000, description: 'Você pode pular o DSD para economizar créditos.' },
      );
    } else if (creditsRemaining === 0) {
      toast.error('Sem créditos disponíveis.', {
        description: 'Faça upgrade do seu plano para criar novos casos.',
        action: { label: 'Ver Planos', onClick: () => navigate('/pricing') },
        duration: 8000,
      });
    }
  }, [creditsRemaining, getCreditCost, navigate]);

  // Check for pending draft on mount
  useEffect(() => {
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const checkDraft = async () => {
      const draft = await loadDraft();
      if (draft && draft.step >= 1) {
        setPendingDraft(draft);
        setShowRestoreModal(true);
      }
    };
    checkDraft();
  }, [loadDraft]);

  // Sample case: pre-fill state and jump to review step
  useEffect(() => {
    if (hasCheckedSampleRef.current) return;
    hasCheckedSampleRef.current = true;

    if (searchParams.get('sample') === 'true') {
      setIsSampleCase(true);
      setAnalysisResult(SAMPLE_CASE.analysisResult);
      setFormData(SAMPLE_CASE.formData);
      setSelectedTeeth([...SAMPLE_CASE.selectedTeeth]);
      setToothTreatments({ ...SAMPLE_CASE.toothTreatments });
      setStep(5);
    }
  }, [searchParams]);

  // Auto-save when state changes (from step 1 with image)
  useEffect(() => {
    if (step >= 1 && imageBase64 !== null && user) {
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
  }, [
    step,
    imageBase64,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    saveDraft,
    user,
  ]);

  // Beforeunload warning during wizard steps 2-5
  useEffect(() => {
    if (step < 2 || step > 5) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  // Auto-select detected teeth and initialize per-tooth treatments
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map((t) => t.tooth);
      setSelectedTeeth(allTeeth);

      setToothTreatments((prev) => {
        const merged: Record<string, TreatmentType> = {};
        analysisResult.detected_teeth.forEach((t) => {
          merged[t.tooth] = prev[t.tooth] || t.treatment_indication || 'resina';
        });
        return merged;
      });

      setOriginalToothTreatments((prev) => {
        if (Object.keys(prev).length === 0) {
          const original: Record<string, TreatmentType> = {};
          analysisResult.detected_teeth.forEach((t) => {
            original[t.tooth] = t.treatment_indication || 'resina';
          });
          return original;
        }
        return prev;
      });
    }

    if (analysisResult?.treatment_indication) {
      setFormData((prev) => ({
        ...prev,
        treatmentType: analysisResult.treatment_indication as TreatmentType,
      }));
    }
  }, [analysisResult]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    step,
    stepDirection,
    imageBase64,
    additionalPhotos,
    patientPreferences,
    isAnalyzing,
    analysisError,
    analysisResult,
    dsdResult,
    formData,
    selectedTeeth,
    toothTreatments,
    originalToothTreatments,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    dobValidationError,
    isReanalyzing,
    hasInventory,
    isSubmitting,
    submissionComplete,
    submissionStep,
    submissionSteps,
    uploadedPhotoPath,
    showRestoreModal,
    pendingDraft,
    isSaving,
    lastSavedAt,
    creditsRemaining,
    creditsTotal,
    isQuickCase,
    isSampleCase,
    canGoBack,
    creditConfirmData,

    // Actions
    setImageBase64,
    setAdditionalPhotos,
    setPatientPreferences,
    goToStep,
    goToPreferences,
    goToQuickCase,
    handlePreferencesContinue,
    handleBack,
    handleRetryAnalysis,
    handleSkipToReview,
    cancelAnalysis,
    handleDSDComplete,
    handleDSDSkip,
    handleDSDResultChange,
    updateFormData,
    setSelectedTeeth,
    handleToothTreatmentChange,
    handleRestoreAiSuggestion,
    handleReanalyze,
    handlePatientSelect,
    handlePatientBirthDateChange,
    setDobValidationError,
    handleSubmit,
    handleCreditConfirm,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
