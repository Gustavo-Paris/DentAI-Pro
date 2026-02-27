import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardNavigation } from '../wizard/useWizardNavigation';
import type { UseWizardNavigationParams } from '../wizard/useWizardNavigation';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// =============================================================================
// Helpers
// =============================================================================

function createParams(
  overrides?: Partial<UseWizardNavigationParams>,
): UseWizardNavigationParams {
  return {
    analyzePhoto: vi.fn(),
    setAnalysisError: vi.fn(),
    setIsAnalyzing: vi.fn(),
    analysisAbortedRef: { current: false },
    getCreditCost: vi.fn((op: string) => (op === 'case_analysis' ? 1 : 2)),
    creditsRemaining: 10,
    navigate: vi.fn(),
    confirmCreditUse: vi.fn().mockResolvedValue(true),
    setPatientPreferences: vi.fn(),
    abortAnalysis: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWizardNavigation', () => {
  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    it('should start at step 1', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));
      expect(result.current.step).toBe(1);
    });

    it('should start with forward direction', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));
      expect(result.current.stepDirection).toBe('forward');
    });

    it('should start in non-quick-case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));
      expect(result.current.isQuickCase).toBe(false);
    });

    it('should expose isQuickCaseRef with initial false', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));
      expect(result.current.isQuickCaseRef.current).toBe(false);
    });

    it('should expose fullFlowCreditsConfirmedRef with initial false', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));
      expect(result.current.fullFlowCreditsConfirmedRef.current).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Step progression — cannot skip steps
  // ---------------------------------------------------------------------------

  describe('step progression enforcement', () => {
    it('should not allow jumping forward past current step', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.goToStep(2));
      expect(result.current.step).toBe(1);

      act(() => result.current.goToStep(5));
      expect(result.current.step).toBe(1);
    });

    it('should not allow jumping to current step (no-op)', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(1);
    });

    it('should not allow going to step 0 or negative', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.goToStep(0));
      expect(result.current.step).toBe(1);

      act(() => result.current.goToStep(-1));
      expect(result.current.step).toBe(1);
    });

    it('should allow going back to any completed step from step 5', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));

      act(() => result.current.goToStep(4));
      expect(result.current.step).toBe(4);
    });

    it('should allow going to step 1 from step 5', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(1);
    });

    it('should allow step 6 to go only to step 5', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(6));

      // Can go to step 5
      act(() => result.current.goToStep(5));
      expect(result.current.step).toBe(5);
    });

    it('should NOT allow step 6 to go to step 1 directly', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(6));
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(6);
    });

    it('should NOT allow step 6 to go to step 4', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(6));
      act(() => result.current.goToStep(4));
      expect(result.current.step).toBe(6);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3 redirect (auto-processing step)
  // ---------------------------------------------------------------------------

  describe('step 3 redirect behavior', () => {
    it('should redirect goToStep(3) to step 2 in normal flow', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.goToStep(3));
      expect(result.current.step).toBe(2);
    });

    it('should redirect goToStep(3) to step 1 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.goToStep(3));
      expect(result.current.step).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Quick case step skipping
  // ---------------------------------------------------------------------------

  describe('quick case mode step restrictions', () => {
    it('should skip step 2 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.goToStep(2));
      expect(result.current.step).toBe(5);
    });

    it('should skip step 4 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.goToStep(4));
      expect(result.current.step).toBe(5);
    });

    it('should allow step 1 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Step direction tracking
  // ---------------------------------------------------------------------------

  describe('step direction tracking', () => {
    it('should track forward direction when advancing', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(3));
      expect(result.current.stepDirection).toBe('forward');
    });

    it('should track backward direction when going back', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setStep(2));
      expect(result.current.stepDirection).toBe('backward');
    });

    it('should update direction on every step change', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(4));
      expect(result.current.stepDirection).toBe('forward');

      act(() => result.current.setStep(2));
      expect(result.current.stepDirection).toBe('backward');

      act(() => result.current.setStep(5));
      expect(result.current.stepDirection).toBe('forward');
    });
  });

  // ---------------------------------------------------------------------------
  // Step validation before proceeding (goToPreferences)
  // ---------------------------------------------------------------------------

  describe('goToPreferences — step validation with credits', () => {
    it('should advance to step 2 when credits confirmed', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ confirmCreditUse })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(2);
      expect(result.current.isQuickCase).toBe(false);
    });

    it('should NOT advance when credit confirmation denied', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ confirmCreditUse })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(1);
    });

    it('should show error toast when no credits', async () => {
      const { toast } = await import('sonner');
      const confirmCreditUse = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({ creditsRemaining: 0, confirmCreditUse }),
        ),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(1);
      expect(toast.error).toHaveBeenCalled();
      // Should NOT even call confirmCreditUse — short-circuits
      expect(confirmCreditUse).not.toHaveBeenCalled();
    });

    it('should show error when credits are less than full cost', async () => {
      const { toast } = await import('sonner');
      const getCreditCost = vi.fn((op: string) => (op === 'case_analysis' ? 5 : 6));
      const confirmCreditUse = vi.fn();

      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({
            getCreditCost,
            creditsRemaining: 10, // less than 5 + 6 = 11
            confirmCreditUse,
          }),
        ),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(1);
      expect(toast.error).toHaveBeenCalled();
      expect(confirmCreditUse).not.toHaveBeenCalled();
    });

    it('should pass combined cost to confirmCreditUse', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(true);
      const getCreditCost = vi.fn((op: string) => (op === 'case_analysis' ? 3 : 7));

      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({
            confirmCreditUse,
            getCreditCost,
            creditsRemaining: 10, // equals 3 + 7 = 10
          }),
        ),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(confirmCreditUse).toHaveBeenCalledWith(
        'full_analysis',
        expect.any(String),
        10, // 3 + 7
      );
    });

    it('should set fullFlowCreditsConfirmedRef on success', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ confirmCreditUse })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.fullFlowCreditsConfirmedRef.current).toBe(true);
    });

    it('should track analytics event on insufficient credits', async () => {
      const { trackEvent } = await import('@/lib/analytics');

      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ creditsRemaining: 0 })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(trackEvent).toHaveBeenCalledWith('insufficient_credits', {
        operation_type: 'full_analysis',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // goToQuickCase
  // ---------------------------------------------------------------------------

  describe('goToQuickCase', () => {
    it('should set quick case mode', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      act(() => result.current.goToQuickCase());
      expect(result.current.isQuickCase).toBe(true);
    });

    it('should sync isQuickCaseRef', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      act(() => result.current.goToQuickCase());
      expect(result.current.isQuickCaseRef.current).toBe(true);
    });

    it('should reset preferences to natural whitening', () => {
      const setPatientPreferences = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ setPatientPreferences })),
      );

      act(() => result.current.goToQuickCase());
      expect(setPatientPreferences).toHaveBeenCalledWith({
        whiteningLevel: 'natural',
      });
    });

    it('should trigger analyzePhoto immediately', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      act(() => result.current.goToQuickCase());
      expect(analyzePhoto).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // handlePreferencesContinue
  // ---------------------------------------------------------------------------

  describe('handlePreferencesContinue', () => {
    it('should call analyzePhoto', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      act(() => result.current.handlePreferencesContinue());
      expect(analyzePhoto).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Back navigation
  // ---------------------------------------------------------------------------

  describe('handleBack', () => {
    it('should navigate to /dashboard from step 1', () => {
      const navigate = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ navigate })),
      );

      act(() => result.current.handleBack());
      expect(navigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should go from step 2 to step 1', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(2));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(1);
    });

    it('should clear fullFlowCreditsConfirmedRef when going back from step 2', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      // Simulate having confirmed credits
      result.current.fullFlowCreditsConfirmedRef.current = true;
      act(() => result.current.setStep(2));
      act(() => result.current.handleBack());
      expect(result.current.fullFlowCreditsConfirmedRef.current).toBe(false);
    });

    it('should go from step 3 to step 2 in normal flow', () => {
      const setAnalysisError = vi.fn();
      const setIsAnalyzing = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ setAnalysisError, setIsAnalyzing })),
      );

      act(() => result.current.setStep(3));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(2);
      expect(setAnalysisError).toHaveBeenCalledWith(null);
      expect(setIsAnalyzing).toHaveBeenCalledWith(false);
    });

    it('should go from step 3 to step 1 in quick case and exit quick case', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(3));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(1);
      expect(result.current.isQuickCase).toBe(false);
      expect(result.current.isQuickCaseRef.current).toBe(false);
    });

    it('should go from step 4 to step 2', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(4));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(2);
    });

    it('should go from step 5 to step 4 in normal flow', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(4);
    });

    it('should go from step 5 to step 3 in quick case', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(5));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(3);
    });

    it('should go from step 6 to step 5', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(6));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // Step completion tracking
  // ---------------------------------------------------------------------------

  describe('step completion tracking', () => {
    it('should allow returning to step 2 after reaching step 4', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(4));
      act(() => result.current.goToStep(2));
      expect(result.current.step).toBe(2);
    });

    it('should allow returning to step 1 after reaching step 4', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(4));
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // handleRetryAnalysis
  // ---------------------------------------------------------------------------

  describe('handleRetryAnalysis', () => {
    it('should clear analysis error and trigger analyzePhoto', () => {
      const analyzePhoto = vi.fn();
      const setAnalysisError = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto, setAnalysisError })),
      );

      act(() => result.current.handleRetryAnalysis());
      expect(setAnalysisError).toHaveBeenCalledWith(null);
      expect(analyzePhoto).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // handleSkipToReview
  // ---------------------------------------------------------------------------

  describe('handleSkipToReview', () => {
    it('should clear analysis state and jump to step 5', () => {
      const setAnalysisError = vi.fn();
      const setIsAnalyzing = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ setAnalysisError, setIsAnalyzing })),
      );

      act(() => result.current.handleSkipToReview());
      expect(result.current.step).toBe(5);
      expect(setAnalysisError).toHaveBeenCalledWith(null);
      expect(setIsAnalyzing).toHaveBeenCalledWith(false);
    });

    it('should show info toast about manual entry', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.handleSkipToReview());
      expect(toast.info).toHaveBeenCalledWith('toasts.wizard.manualEntry');
    });
  });

  // ---------------------------------------------------------------------------
  // cancelAnalysis
  // ---------------------------------------------------------------------------

  describe('cancelAnalysis', () => {
    it('should set analysisAbortedRef to true', () => {
      const analysisAbortedRef = { current: false };
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analysisAbortedRef })),
      );

      act(() => result.current.cancelAnalysis());
      expect(analysisAbortedRef.current).toBe(true);
    });

    it('should call abortAnalysis to cancel in-flight HTTP request', () => {
      const abortAnalysis = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ abortAnalysis })),
      );

      act(() => result.current.cancelAnalysis());
      expect(abortAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should clear analysis error and isAnalyzing state', () => {
      const setIsAnalyzing = vi.fn();
      const setAnalysisError = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ setIsAnalyzing, setAnalysisError })),
      );

      act(() => result.current.setStep(3));
      act(() => result.current.cancelAnalysis());
      expect(setIsAnalyzing).toHaveBeenCalledWith(false);
      expect(setAnalysisError).toHaveBeenCalledWith(null);
    });

    it('should go to step 2 in normal flow', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(3));
      act(() => result.current.cancelAnalysis());
      expect(result.current.step).toBe(2);
    });

    it('should go to step 1 and exit quick case on cancel', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(3));
      act(() => result.current.cancelAnalysis());
      expect(result.current.step).toBe(1);
      expect(result.current.isQuickCase).toBe(false);
      expect(result.current.isQuickCaseRef.current).toBe(false);
    });

    it('should show info toast about analysis canceled', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.cancelAnalysis());
      expect(toast.info).toHaveBeenCalledWith('toasts.wizard.analysisCanceled');
    });

    it('should handle missing abortAnalysis gracefully', () => {
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ abortAnalysis: undefined })),
      );

      // Should not throw
      act(() => result.current.cancelAnalysis());
      expect(result.current.step).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Full workflow: step-by-step progression
  // ---------------------------------------------------------------------------

  describe('full workflow progression', () => {
    it('should support a complete normal flow: 1 -> 2 -> (analyze) -> 5 -> 6', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(true);
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({ confirmCreditUse, analyzePhoto }),
        ),
      );

      // Start at step 1
      expect(result.current.step).toBe(1);

      // Go to preferences (step 2)
      await act(async () => {
        await result.current.goToPreferences();
      });
      expect(result.current.step).toBe(2);
      expect(result.current.isQuickCase).toBe(false);

      // Continue from preferences triggers analysis
      act(() => result.current.handlePreferencesContinue());
      expect(analyzePhoto).toHaveBeenCalled();

      // Simulate analysis completing — jump to step 5
      act(() => result.current.setStep(5));
      expect(result.current.step).toBe(5);

      // Submit (step 6)
      act(() => result.current.setStep(6));
      expect(result.current.step).toBe(6);
    });

    it('should support quick case flow: 1 -> (analyze) -> 5 -> 6', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      expect(result.current.step).toBe(1);

      // Quick case triggers analysis immediately
      act(() => result.current.goToQuickCase());
      expect(result.current.isQuickCase).toBe(true);
      expect(analyzePhoto).toHaveBeenCalled();

      // Simulate analysis completing — jump to step 5
      act(() => result.current.setStep(5));
      expect(result.current.step).toBe(5);

      // Submit (step 6)
      act(() => result.current.setStep(6));
      expect(result.current.step).toBe(6);
    });
  });
});
