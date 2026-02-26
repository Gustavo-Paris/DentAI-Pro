import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
} from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { INITIAL_FORM_DATA } from './wizard/constants';

// Sub-hooks
import { usePhotoAnalysis } from './wizard/usePhotoAnalysis';
import { useDSDIntegration } from './wizard/useDSDIntegration';
import { useWizardSubmit } from './wizard/useWizardSubmit';
import { useWizardNavigation } from './wizard/useWizardNavigation';
import { useWizardReview } from './wizard/useWizardReview';
import { useWizardDraftRestore } from './wizard/useWizardDraftRestore';
import { useWizardCredits } from './wizard/useWizardCredits';
import { useWizardAutoSave } from './wizard/useWizardAutoSave';
import { useWizardSampleCase } from './wizard/useWizardSampleCase';
import { useAnalysisResultSync } from './wizard/useAnalysisResultSync';

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
  const [originalToothTreatments, setOriginalToothTreatments] = useState<
    Record<string, TreatmentType>
  >({});

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------

  const hasCheckedDraftRef = useRef(false);

  // Shared ref owned by orchestrator — used by both photo analysis and navigation
  const analysisAbortedRef = useRef(false);

  // Forward ref: navigation calls analyzePhoto, but photo hook is created after navigation.
  // We use a stable ref that gets patched after the photo hook is created.
  const analyzePhotoRef = useRef<() => void>(() => {});

  // Forward ref: navigation calls abortAnalysis, but photo hook is created after navigation.
  const abortAnalysisRef = useRef<() => void>(() => {});

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
  // Sub-hooks
  // -------------------------------------------------------------------------

  // Credits
  const credits = useWizardCredits({
    getCreditCost,
    creditsRemaining,
    navigate,
  });

  // Navigation (uses forward refs to break circular dependency with photo analysis)
  const nav = useWizardNavigation({
    analyzePhoto: () => analyzePhotoRef.current(),
    abortAnalysis: () => abortAnalysisRef.current(),
    setAnalysisError: (error) => photoSettersRef.current.setAnalysisError(error),
    setIsAnalyzing: (analyzing) => photoSettersRef.current.setIsAnalyzing(analyzing),
    analysisAbortedRef,
    getCreditCost,
    creditsRemaining,
    navigate,
    confirmCreditUse: credits.confirmCreditUse,
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
    confirmCreditUse: credits.confirmCreditUse,
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
  abortAnalysisRef.current = photo.abortAnalysis;
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
    vitaShadeManuallySetRef: photo.vitaShadeManuallySetRef,
  });

  // Sample case detection
  const { isSampleCase } = useWizardSampleCase({
    searchParams,
    setAnalysisResult,
    setFormData,
    setSelectedTeeth,
    setToothTreatments,
    setStep: nav.setStep,
  });

  // Analysis result → teeth sync
  useAnalysisResultSync({
    analysisResult,
    setSelectedTeeth,
    setToothTreatments,
    setOriginalToothTreatments,
    setFormData,
  });

  // Auto-save (state changes, visibility change, beforeunload)
  useWizardAutoSave({
    step: nav.step,
    imageBase64,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    uploadedPhotoPath: photo.uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    vitaShadeManuallySet: photo.vitaShadeManuallySetRef.current,
    saveDraft,
    userId: user?.id,
  });

  // -------------------------------------------------------------------------
  // Re-trigger analysis after draft restore at step 3
  // -------------------------------------------------------------------------
  // When a draft is restored with step=3 but analysisResult=null (analysis was
  // in-flight when session expired), we need to re-call the edge function.
  // Without this, AnalyzingStep renders with isAnalyzing=false and stays at 0%.
  //
  // Uses a ref flag set ONLY by handleRestoreDraft (below) to avoid false
  // positives during retry-after-error flows where the same conditions hold
  // briefly while the credit confirmation dialog is open.
  const needsReanalysisRef = useRef(false);

  useEffect(() => {
    if (needsReanalysisRef.current && nav.step === 3 && !!imageBase64 && !photo.isAnalyzing) {
      needsReanalysisRef.current = false;
      console.warn('[WizardFlow] Draft restored at analysis step — re-triggering analyzePhoto()');
      // Credits were already confirmed in the original session — skip the dialog.
      // The edge function still validates credits server-side.
      nav.fullFlowCreditsConfirmedRef.current = true;
      photo.analyzePhoto();
    }
  }, [nav.step, imageBase64, photo.isAnalyzing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap handleRestoreDraft to flag step-3 restores that need re-analysis
  const handleRestoreDraft = useCallback(async () => {
    const draft = draftRestore.pendingDraft;
    if (draft?.step === 3 && !draft.analysisResult) {
      needsReanalysisRef.current = true;
    }
    return draftRestore.handleRestoreDraft();
  }, [draftRestore]);

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

  // Credits-guarded submit — check credits before delegating to actual submit
  const handleSubmitWithCreditsCheck = useCallback(async () => {
    if (!canUseCredits('case_analysis')) {
      toast.error(t('toasts.wizard.noCredits'), {
        description: t('toasts.wizard.noCreditsDescription'),
        action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
        duration: 8000,
      });
      return;
    }
    await submit.handleSubmit();
  }, [canUseCredits, submit.handleSubmit, navigate, t]);

  // -------------------------------------------------------------------------
  // Side Effects
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Return (memoized to stabilize object reference across renders)
  // -------------------------------------------------------------------------

  return useMemo(
    () => ({
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
      creditConfirmData: credits.creditConfirmData,

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
      handleSubmit: handleSubmitWithCreditsCheck,
      handleCreditConfirm: credits.handleCreditConfirm,
      handleRestoreDraft,
      handleDiscardDraft: draftRestore.handleDiscardDraft,
    }),
    [
      // State deps
      nav.step,
      nav.stepDirection,
      imageBase64,
      additionalPhotos,
      patientPreferences,
      photo.isAnalyzing,
      photo.analysisError,
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
      photo.isReanalyzing,
      hasInventory,
      patientsForAutocomplete,
      submit.isSubmitting,
      submit.submissionComplete,
      submit.completedSessionId,
      submit.submissionStep,
      submit.submissionSteps,
      photo.uploadedPhotoPath,
      draftRestore.showRestoreModal,
      draftRestore.pendingDraft,
      isSaving,
      lastSavedAt,
      creditsRemaining,
      creditsTotal,
      nav.isQuickCase,
      isSampleCase,
      canGoBack,
      credits.creditConfirmData,

      // Action deps
      setImageBase64,
      setAdditionalPhotos,
      setPatientPreferences,
      nav.goToStep,
      nav.goToPreferences,
      nav.goToQuickCase,
      nav.handlePreferencesContinue,
      handleBackWithReset,
      nav.handleRetryAnalysis,
      nav.handleSkipToReview,
      nav.cancelAnalysis,
      dsd.handleDSDComplete,
      dsd.handleDSDSkip,
      dsd.handleDSDResultChange,
      review.updateFormData,
      setSelectedTeeth,
      review.handleToothTreatmentChange,
      review.handleRestoreAiSuggestion,
      photo.handleReanalyze,
      review.handlePatientSelect,
      review.handlePatientBirthDateChange,
      setDobValidationError,
      handleSubmitWithCreditsCheck,
      credits.handleCreditConfirm,
      handleRestoreDraft,
      draftRestore.handleDiscardDraft,
    ],
  );
}
