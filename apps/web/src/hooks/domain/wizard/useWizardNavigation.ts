import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardNavigationParams {
  analyzePhoto: () => void;
  setAnalysisError: (error: string | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisAbortedRef: React.RefObject<boolean>;
  getCreditCost: (operation: string) => number;
  creditsRemaining: number;
  navigate: (path: string) => void;
  confirmCreditUse: (
    operation: string,
    operationLabel: string,
    costOverride?: number,
  ) => Promise<boolean>;
  setPatientPreferences: React.Dispatch<React.SetStateAction<{ whiteningLevel: string }>>;
  /** Abort the in-flight HTTP request for photo analysis (prevents wasted credits) */
  abortAnalysis?: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardNavigation({
  analyzePhoto,
  setAnalysisError,
  setIsAnalyzing,
  analysisAbortedRef,
  getCreditCost,
  creditsRemaining,
  navigate,
  confirmCreditUse,
  setPatientPreferences,
  abortAnalysis,
}: UseWizardNavigationParams) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [isQuickCase, setIsQuickCase] = useState(false);

  const prevStepRef = useRef(1);
  const isQuickCaseRef = useRef(false);
  const fullFlowCreditsConfirmedRef = useRef(false);

  // Track step direction for animations
  useEffect(() => {
    if (step !== prevStepRef.current) {
      setStepDirection(step > prevStepRef.current ? 'forward' : 'backward');
      prevStepRef.current = step;
    }
  }, [step]);

  const goToStep = useCallback((targetStep: number) => {
    // Only allow jumping to completed steps (past steps < current)
    if (targetStep >= step || targetStep < 1) return;
    // Allow going back from result (step 6) to review (step 5) only
    if (step === 6 && targetStep !== 5) return;
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
      trackEvent('insufficient_credits', { operation_type: 'full_analysis' });
      toast.error(t('toasts.wizard.insufficientCredits'), {
        action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
      });
      return;
    }

    const confirmed = await confirmCreditUse('full_analysis', t('wizard.creditLabel.fullAnalysis', { defaultValue: 'Análise Completa com IA' }), fullCost);
    if (!confirmed) return;

    fullFlowCreditsConfirmedRef.current = true;
    setStep(2);
  }, [getCreditCost, creditsRemaining, navigate, confirmCreditUse]);

  const goToQuickCase = useCallback(() => {
    setIsQuickCase(true);
    isQuickCaseRef.current = true;
    setPatientPreferences({ whiteningLevel: 'natural' });
    analyzePhoto();
  }, [analyzePhoto, setPatientPreferences]);

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
    } else if (step === 6) {
      setStep(5);
    }
  }, [step, navigate, isQuickCase, setAnalysisError, setIsAnalyzing]);

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyzePhoto();
  }, [analyzePhoto, setAnalysisError]);

  const handleSkipToReview = useCallback(() => {
    setAnalysisError(null);
    setIsAnalyzing(false);
    setStep(5);
    toast.info(t('toasts.wizard.manualEntry'));
  }, [setAnalysisError, setIsAnalyzing]);

  const cancelAnalysis = useCallback(() => {
    analysisAbortedRef.current = true;
    // Abort the in-flight HTTP request to prevent wasted credits
    abortAnalysis?.();
    setIsAnalyzing(false);
    setAnalysisError(null);
    if (isQuickCase) {
      setStep(1);
      setIsQuickCase(false);
      isQuickCaseRef.current = false;
    } else {
      setStep(2);
    }
    toast.info(t('toasts.wizard.analysisCanceled'));
  }, [isQuickCase, analysisAbortedRef, setIsAnalyzing, setAnalysisError, abortAnalysis]);

  return {
    step,
    setStep,
    stepDirection,
    isQuickCase,
    setIsQuickCase,
    isQuickCaseRef,
    fullFlowCreditsConfirmedRef,
    goToStep,
    goToPreferences,
    goToQuickCase,
    handlePreferencesContinue,
    handleBack,
    handleRetryAnalysis,
    handleSkipToReview,
    cancelAnalysis,
  };
}
