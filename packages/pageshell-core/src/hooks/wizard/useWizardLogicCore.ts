/**
 * useWizardLogic - Headless Wizard/Stepper Logic Hook
 *
 * Encapsulates multi-step wizard state management: navigation, validation,
 * keyboard shortcuts, and resumable progress.
 *
 * @module hooks/wizard
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_EXPIRY_DAYS, loadProgress, saveProgress, clearStoredProgress } from './storage';
import { useWizardKeyboardNav } from './useWizardKeyboardNav';
import type { UseWizardLogicOptions, UseWizardLogicReturn } from './types';

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWizardLogic<TData = unknown>(
  options: UseWizardLogicOptions<TData>
): UseWizardLogicReturn {
  const {
    totalSteps,
    initialStep = 1,
    onNext,
    onBack,
    onComplete,
    onSkip,
    onJumpToStep,
    validateStep,
    allowJumpToStep = false,
    canSkip: canSkipProp = false,
    enableKeyboardNav = false,
    scrollToTop = false,
    resumable,
  } = options;

  // State
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const prevStepRef = useRef(currentStep);
  const hasResumedRef = useRef(false);

  // Computed
  const isFinalStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const canGoNext = !isNavigating && !isValidating;
  const canGoBack = currentStep > 1 && !isNavigating;
  const canSkip = canSkipProp && !isFinalStep && !isNavigating;
  const progressPercent = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  // Load progress on mount
  useEffect(() => {
    if (!resumable?.enabled || hasResumedRef.current) return;
    hasResumedRef.current = true;

    const expiryDays = resumable.expiryDays ?? DEFAULT_EXPIRY_DAYS;
    const stored = loadProgress<TData>(resumable.storageKey, expiryDays);

    if (stored && stored.step > 1) {
      if (stored.data && resumable.setData) {
        resumable.setData(stored.data);
      }
      if (resumable.onResume) {
        resumable.onResume(stored.step, stored.data || ({} as Partial<TData>));
      }
      setCurrentStep(stored.step);
    }
  }, [resumable]);

  // Save progress on step change
  useEffect(() => {
    if (!resumable?.enabled) return;

    const data = resumable.getData ? resumable.getData() : undefined;
    saveProgress(resumable.storageKey, currentStep, data);
  }, [currentStep, resumable]);

  // Scroll to top on step change
  useEffect(() => {
    if (scrollToTop && prevStepRef.current !== currentStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevStepRef.current = currentStep;
  }, [currentStep, scrollToTop]);

  // Validation
  const runValidation = useCallback(async (): Promise<boolean> => {
    if (!validateStep) return true;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateStep(currentStep);

      if (typeof result === 'boolean') {
        if (!result) {
          setValidationError('Validation failed');
          return false;
        }
        return true;
      }

      if (!result.valid) {
        setValidationError(result.error || 'Validation failed');
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      setValidationError(message);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validateStep, currentStep]);

  // Navigation
  const goNext = useCallback(async () => {
    if (isNavigating || isValidating) return;

    const isValid = await runValidation();
    if (!isValid) return;

    setIsNavigating(true);
    try {
      if (isFinalStep) {
        if (onComplete) {
          await onComplete();
        }
        if (resumable?.enabled) {
          clearStoredProgress(resumable.storageKey);
        }
      } else {
        if (onNext) {
          await onNext();
        }
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    } finally {
      setIsNavigating(false);
    }
  }, [isNavigating, isValidating, runValidation, isFinalStep, onComplete, onNext, resumable, totalSteps]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;

    setValidationError(null);
    if (onBack) {
      onBack();
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [canGoBack, onBack]);

  const skip = useCallback(() => {
    if (!canSkip) return;

    setValidationError(null);
    if (onSkip) {
      onSkip();
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [canSkip, onSkip, totalSteps]);

  const jumpToStep = useCallback(
    (targetStep: number) => {
      if (!allowJumpToStep || targetStep >= currentStep) return;
      if (targetStep < 1 || targetStep > totalSteps) return;

      setValidationError(null);
      if (onJumpToStep) {
        onJumpToStep(targetStep);
      }
      setCurrentStep(targetStep);
    },
    [allowJumpToStep, currentStep, totalSteps, onJumpToStep]
  );

  const setStep = useCallback(
    (step: number) => {
      if (step < 1 || step > totalSteps) return;
      setValidationError(null);
      setCurrentStep(step);
    },
    [totalSteps]
  );

  // Keyboard Navigation (using shared hook)
  useWizardKeyboardNav({
    onNext: goNext,
    onPrevious: goBack,
    canGoNext,
    canGoPrevious: canGoBack,
    enabled: enableKeyboardNav,
  });

  // Actions
  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const clearProgress = useCallback(() => {
    if (resumable?.enabled) {
      clearStoredProgress(resumable.storageKey);
    }
    setCurrentStep(1);
  }, [resumable]);

  return {
    // State
    currentStep,
    totalSteps,
    isFinalStep,
    isFirstStep,
    validationError,
    isValidating,
    isNavigating,

    // Navigation
    goNext,
    goBack,
    skip,
    jumpToStep,
    setStep,

    // Computed
    canGoNext,
    canGoBack,
    canSkip,
    progressPercent,

    // Actions
    clearValidationError,
    clearProgress,
  };
}
