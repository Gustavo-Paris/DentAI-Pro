import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardNavigation } from '../domain/wizard/useWizardNavigation';
import type { UseWizardNavigationParams } from '../domain/wizard/useWizardNavigation';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParams(overrides?: Partial<UseWizardNavigationParams>): UseWizardNavigationParams {
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWizardNavigation', () => {
  describe('initial state', () => {
    it('should start at step 1 with forward direction', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      expect(result.current.step).toBe(1);
      expect(result.current.stepDirection).toBe('forward');
      expect(result.current.isQuickCase).toBe(false);
    });
  });

  describe('goToStep', () => {
    it('should not allow jumping forward to steps not yet reached', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.goToStep(3));
      expect(result.current.step).toBe(1);
    });

    it('should not allow going below step 1', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.goToStep(0));
      expect(result.current.step).toBe(1);
    });

    it('should allow jumping back to completed steps', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      // Advance to step 5 via setStep
      act(() => result.current.setStep(5));
      // Now we can go back to step 1
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(1);
    });

    it('should redirect step 3 to step 2 (auto-processing step)', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.goToStep(3));
      expect(result.current.step).toBe(2);
    });

    it('should redirect step 3 to step 1 for quick case', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.goToStep(3));
      expect(result.current.step).toBe(1);
    });

    it('should skip steps 2 and 4 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setIsQuickCase(true));

      act(() => result.current.goToStep(2));
      // Should stay at 5 since step 2 is skipped
      expect(result.current.step).toBe(5);

      act(() => result.current.goToStep(4));
      // Should stay at 5 since step 4 is skipped
      expect(result.current.step).toBe(5);
    });

    it('should not allow navigation from step 6 (submission)', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(6));
      act(() => result.current.goToStep(1));
      expect(result.current.step).toBe(6);
    });
  });

  describe('stepDirection tracking', () => {
    it('should detect forward direction', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(3));
      expect(result.current.stepDirection).toBe('forward');
    });

    it('should detect backward direction', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.setStep(2));
      expect(result.current.stepDirection).toBe('backward');
    });
  });

  describe('goToPreferences', () => {
    it('should go to step 2 when credits confirmed', async () => {
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

    it('should not advance when credit confirmation is denied', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ confirmCreditUse })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(1);
    });

    it('should show error when insufficient credits', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ creditsRemaining: 0 })),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      expect(result.current.step).toBe(1);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should check full cost (analysis + DSD) for credit requirement', async () => {
      const confirmCreditUse = vi.fn().mockResolvedValue(true);
      const getCreditCost = vi.fn((op: string) => (op === 'case_analysis' ? 1 : 2));

      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({ confirmCreditUse, getCreditCost, creditsRemaining: 3 }),
        ),
      );

      await act(async () => {
        await result.current.goToPreferences();
      });

      // Full cost = 1 + 2 = 3, credits = 3, should pass
      expect(confirmCreditUse).toHaveBeenCalledWith('full_analysis', expect.any(String), 3);
      expect(result.current.step).toBe(2);
    });
  });

  describe('goToQuickCase', () => {
    it('should set quick case mode and call analyzePhoto', () => {
      const analyzePhoto = vi.fn();
      const setPatientPreferences = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto, setPatientPreferences })),
      );

      act(() => result.current.goToQuickCase());

      expect(result.current.isQuickCase).toBe(true);
      expect(setPatientPreferences).toHaveBeenCalledWith({ whiteningLevel: 'natural' });
      expect(analyzePhoto).toHaveBeenCalled();
    });
  });

  describe('handlePreferencesContinue', () => {
    it('should call analyzePhoto', () => {
      const analyzePhoto = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto })),
      );

      act(() => result.current.handlePreferencesContinue());
      expect(analyzePhoto).toHaveBeenCalled();
    });
  });

  describe('handleBack', () => {
    it('should navigate to dashboard from step 1', () => {
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

    it('should go from step 3 to step 2 (normal flow)', () => {
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

    it('should go from step 3 to step 1 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(3));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(1);
      expect(result.current.isQuickCase).toBe(false);
    });

    it('should go from step 4 to step 2', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(4));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(2);
    });

    it('should go from step 5 to step 4 (normal flow)', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setStep(5));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(4);
    });

    it('should go from step 5 to step 3 in quick case mode', () => {
      const { result } = renderHook(() => useWizardNavigation(createParams()));

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(5));
      act(() => result.current.handleBack());
      expect(result.current.step).toBe(3);
    });
  });

  describe('handleRetryAnalysis', () => {
    it('should clear error and re-analyze', () => {
      const analyzePhoto = vi.fn();
      const setAnalysisError = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analyzePhoto, setAnalysisError })),
      );

      act(() => result.current.handleRetryAnalysis());
      expect(setAnalysisError).toHaveBeenCalledWith(null);
      expect(analyzePhoto).toHaveBeenCalled();
    });
  });

  describe('handleSkipToReview', () => {
    it('should clear state and go to step 5', () => {
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
  });

  describe('cancelAnalysis', () => {
    it('should set aborted ref, clear state, and go back to step 2', () => {
      const analysisAbortedRef = { current: false };
      const setIsAnalyzing = vi.fn();
      const setAnalysisError = vi.fn();
      const { result } = renderHook(() =>
        useWizardNavigation(
          createParams({ analysisAbortedRef, setIsAnalyzing, setAnalysisError }),
        ),
      );

      act(() => result.current.setStep(3));
      act(() => result.current.cancelAnalysis());

      expect(analysisAbortedRef.current).toBe(true);
      expect(setIsAnalyzing).toHaveBeenCalledWith(false);
      expect(setAnalysisError).toHaveBeenCalledWith(null);
      expect(result.current.step).toBe(2);
    });

    it('should go to step 1 and exit quick case on cancel', () => {
      const analysisAbortedRef = { current: false };
      const { result } = renderHook(() =>
        useWizardNavigation(createParams({ analysisAbortedRef })),
      );

      act(() => result.current.setIsQuickCase(true));
      act(() => result.current.setStep(3));
      act(() => result.current.cancelAnalysis());

      expect(result.current.step).toBe(1);
      expect(result.current.isQuickCase).toBe(false);
    });
  });
});
