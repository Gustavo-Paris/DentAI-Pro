import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { inventory, patients as patientsData } from '@/data';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { INITIAL_FORM_DATA } from './wizard/constants';
import { SAMPLE_CASE } from '@/data/sample-case';

// Sub-hooks
import { usePhotoAnalysis } from './wizard/usePhotoAnalysis';
import { useDSDIntegration } from './wizard/useDSDIntegration';
import { useWizardSubmit } from './wizard/useWizardSubmit';
import { useWizardNavigation } from './wizard/useWizardNavigation';
import { useWizardReview } from './wizard/useWizardReview';
import { useWizardDraftRestore } from './wizard/useWizardDraftRestore';

// Types re-exported from wizard/types.ts
export type { SubmissionStep, WizardFlowState, WizardFlowActions } from './wizard/types';
import type { WizardFlowState, WizardFlowActions } from './wizard/types';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardFlow(): WizardFlowState & WizardFlowActions {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
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
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });
  const { data: patientsForAutocomplete } = useQuery({
    queryKey: ['patients', 'autocomplete', user?.id],
    queryFn: () => patientsData.listForAutocomplete(user!.id),
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });
  const { loadDraft, saveDraft, clearDraft, isSaving, lastSavedAt } = useWizardDraft(user?.id);

  // -------------------------------------------------------------------------
  // Shared State
  // -------------------------------------------------------------------------

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>(INITIAL_FORM_DATA);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [dsdResult, setDsdResult] = useState<DSDResult | null>(null);
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
  const [isSampleCase, setIsSampleCase] = useState(false);
  const [originalToothTreatments, setOriginalToothTreatments] = useState<
    Record<string, TreatmentType>
  >({});

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
  const creditConfirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  // Shared ref owned by orchestrator — used by both photo analysis and navigation
  const analysisAbortedRef = useRef(false);

  // Forward ref: navigation calls analyzePhoto, but photo hook is created after navigation.
  // We use a stable ref that gets patched after the photo hook is created.
  const analyzePhotoRef = useRef<() => void>(() => {});

  // Forward refs for photo analysis setters needed by navigation
  const photoSettersRef = useRef({
    setAnalysisError: (_error: string | null) => {},
    setIsAnalyzing: (_analyzing: boolean) => {},
  });

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const hasInventory = (inventoryData?.items?.length ?? 0) > 0;

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
  // Sub-hooks
  // -------------------------------------------------------------------------

  // Navigation (uses forward refs to break circular dependency with photo analysis)
  const nav = useWizardNavigation({
    analyzePhoto: () => analyzePhotoRef.current(),
    setAnalysisError: (error) => photoSettersRef.current.setAnalysisError(error),
    setIsAnalyzing: (analyzing) => photoSettersRef.current.setIsAnalyzing(analyzing),
    analysisAbortedRef,
    getCreditCost,
    creditsRemaining,
    navigate,
    confirmCreditUse,
    setPatientPreferences,
  });

  // Photo analysis (uses the same analysisAbortedRef as navigation)
  const photo = usePhotoAnalysis({
    userId: user?.id,
    imageBase64,
    formData,
    setFormData,
    setStep: nav.setStep,
    isQuickCaseRef: nav.isQuickCaseRef,
    canUseCredits,
    confirmCreditUse,
    fullFlowCreditsConfirmedRef: nav.fullFlowCreditsConfirmedRef,
    analysisAbortedRef,
    invokeFunction,
    getCreditCost,
    refreshSubscription,
    navigate,
    setAnalysisResult,
    patientWhiteningLevel: patientPreferences.whiteningLevel === 'natural' ? 'natural' : 'hollywood',
  });

  // Wire up forward refs now that photo hook is created
  analyzePhotoRef.current = photo.analyzePhoto;
  photoSettersRef.current.setAnalysisError = photo.setAnalysisError;
  photoSettersRef.current.setIsAnalyzing = photo.setIsAnalyzing;

  // DSD
  const dsd = useDSDIntegration({
    analysisResult,
    setAnalysisResult,
    setSelectedTeeth,
    setToothTreatments,
    setStep: nav.setStep,
    setDsdResult,
  });

  // Submit
  const submit = useWizardSubmit({
    user,
    formData,
    setFormData,
    selectedTeeth,
    selectedPatientId,
    patientBirthDate,
    originalPatientBirthDate,
    uploadedPhotoPath: photo.uploadedPhotoPath,
    analysisResult,
    dsdResult,
    patientPreferences,
    toothTreatments,
    setStep: nav.setStep,
    clearDraft,
    navigate,
  });

  // Review
  const review = useWizardReview({
    setFormData,
    setToothTreatments,
    originalToothTreatments,
    vitaShadeManuallySetRef: photo.vitaShadeManuallySetRef,
    setSelectedPatientId,
    setPatientBirthDate,
    setOriginalPatientBirthDate,
    setDobValidationError,
  });

  // Draft Restore
  const draftRestore = useWizardDraftRestore({
    setStep: nav.setStep,
    setFormData,
    setSelectedTeeth,
    setToothTreatments,
    setAnalysisResult,
    setDsdResult,
    setUploadedPhotoPath: photo.setUploadedPhotoPath,
    setAdditionalPhotos,
    setPatientPreferences,
    setImageBase64,
    clearDraft,
  });

  // -------------------------------------------------------------------------
  // Derived (depends on sub-hooks)
  // -------------------------------------------------------------------------

  const canGoBack = nav.step >= 1 && nav.step <= 5;

  const handleBackWithReset = useCallback(() => {
    if (nav.step === 6) {
      submit.resetSubmission();
    }
    nav.handleBack();
  }, [nav.step, nav.handleBack, submit.resetSubmission]);

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
        t('toasts.wizard.lowCreditsWarning', { remaining: creditsRemaining, required: fullWorkflowCost }),
        { duration: 6000, description: t('toasts.wizard.lowCreditsDescription') },
      );
    } else if (creditsRemaining === 0) {
      toast.error(t('toasts.wizard.noCredits'), {
        description: t('toasts.wizard.noCreditsDescription'),
        action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
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
        draftRestore.setPendingDraft(draft);
        draftRestore.setShowRestoreModal(true);
      }
    };
    checkDraft();
  }, [loadDraft, draftRestore]);

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
      nav.setStep(5);
    }
  }, [searchParams, nav]);

  // Auto-save when state changes (from step 1 with image)
  useEffect(() => {
    if (nav.step >= 1 && imageBase64 !== null && user) {
      saveDraft({
        step: nav.step,
        formData,
        selectedTeeth,
        toothTreatments,
        analysisResult,
        dsdResult,
        uploadedPhotoPath: photo.uploadedPhotoPath,
        additionalPhotos,
        patientPreferences,
      });
    }
  }, [
    nav.step,
    imageBase64,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    photo.uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    saveDraft,
    user,
  ]);

  // Beforeunload warning during wizard steps 2-5
  useEffect(() => {
    if (nav.step < 2 || nav.step > 5) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nav.step]);

  // Auto-select detected teeth and initialize per-tooth treatments
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map((t) => t.tooth);
      // Preserve virtual entries (e.g. GENGIVO for gengivoplasty) that are not
      // part of detected_teeth but were added by DSD integration.
      setSelectedTeeth((prev) => {
        const virtual = prev.filter((t) => !t.match(/^\d+$/));
        return [...allTeeth, ...virtual];
      });

      setToothTreatments((prev) => {
        const merged: Record<string, TreatmentType> = {};
        analysisResult.detected_teeth.forEach((t) => {
          merged[t.tooth] = prev[t.tooth] || t.treatment_indication || 'resina';
        });
        // Preserve virtual entries (e.g. GENGIVO)
        for (const [key, val] of Object.entries(prev)) {
          if (!key.match(/^\d+$/)) merged[key] = val;
        }
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
    step: nav.step,
    stepDirection: nav.stepDirection,
    imageBase64,
    additionalPhotos,
    patientPreferences,
    isAnalyzing: photo.isAnalyzing,
    analysisError: photo.analysisError,
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
    isReanalyzing: photo.isReanalyzing,
    hasInventory,
    patients: patientsForAutocomplete || [],
    isSubmitting: submit.isSubmitting,
    submissionComplete: submit.submissionComplete,
    completedSessionId: submit.completedSessionId,
    submissionStep: submit.submissionStep,
    submissionSteps: submit.submissionSteps,
    uploadedPhotoPath: photo.uploadedPhotoPath,
    showRestoreModal: draftRestore.showRestoreModal,
    pendingDraft: draftRestore.pendingDraft,
    isSaving,
    lastSavedAt,
    creditsRemaining,
    creditsTotal,
    isQuickCase: nav.isQuickCase,
    isSampleCase,
    canGoBack,
    creditConfirmData,

    // Actions
    setImageBase64,
    setAdditionalPhotos,
    setPatientPreferences,
    goToStep: nav.goToStep,
    goToPreferences: nav.goToPreferences,
    goToQuickCase: nav.goToQuickCase,
    handlePreferencesContinue: nav.handlePreferencesContinue,
    handleBack: handleBackWithReset,
    handleRetryAnalysis: nav.handleRetryAnalysis,
    handleSkipToReview: nav.handleSkipToReview,
    cancelAnalysis: nav.cancelAnalysis,
    handleDSDComplete: dsd.handleDSDComplete,
    handleDSDSkip: dsd.handleDSDSkip,
    handleDSDResultChange: dsd.handleDSDResultChange,
    updateFormData: review.updateFormData,
    setSelectedTeeth,
    handleToothTreatmentChange: review.handleToothTreatmentChange,
    handleRestoreAiSuggestion: review.handleRestoreAiSuggestion,
    handleReanalyze: photo.handleReanalyze,
    handlePatientSelect: review.handlePatientSelect,
    handlePatientBirthDateChange: review.handlePatientBirthDateChange,
    setDobValidationError,
    handleSubmit: submit.handleSubmit,
    handleCreditConfirm,
    handleRestoreDraft: draftRestore.handleRestoreDraft,
    handleDiscardDraft: draftRestore.handleDiscardDraft,
  };
}
