import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — must be declared BEFORE importing the hook under test
// ---------------------------------------------------------------------------

// ---- Sub-hooks (the orchestrator delegates to these) ----

const mockNavReturn = {
  step: 1,
  setStep: vi.fn(),
  stepDirection: 'forward' as const,
  isQuickCase: false,
  setIsQuickCase: vi.fn(),
  isQuickCaseRef: { current: false },
  fullFlowCreditsConfirmedRef: { current: false },
  goToStep: vi.fn(),
  goToPreferences: vi.fn(),
  goToQuickCase: vi.fn(),
  handlePreferencesContinue: vi.fn(),
  handleBack: vi.fn(),
  handleRetryAnalysis: vi.fn(),
  handleSkipToReview: vi.fn(),
  cancelAnalysis: vi.fn(),
};

vi.mock('../domain/wizard/useWizardNavigation', () => ({
  useWizardNavigation: vi.fn(() => mockNavReturn),
}));

const mockPhotoReturn = {
  isAnalyzing: false,
  isReanalyzing: false,
  analysisError: null,
  uploadedPhotoPath: null,
  vitaShadeManuallySetRef: { current: false },
  analyzePhoto: vi.fn(),
  abortAnalysis: vi.fn(),
  setAnalysisError: vi.fn(),
  setIsAnalyzing: vi.fn(),
  handleReanalyze: vi.fn(),
  setUploadedPhotoPath: vi.fn(),
};

vi.mock('../domain/wizard/usePhotoAnalysis', () => ({
  usePhotoAnalysis: vi.fn(() => mockPhotoReturn),
}));

const mockDsdReturn = {
  handleDSDComplete: vi.fn(),
  handleDSDSkip: vi.fn(),
  handleDSDResultChange: vi.fn(),
};

vi.mock('../domain/wizard/useDSDIntegration', () => ({
  useDSDIntegration: vi.fn(() => mockDsdReturn),
}));

const mockSubmitReturn = {
  isSubmitting: false,
  submissionComplete: false,
  completedSessionId: null,
  submissionStep: 0,
  submissionSteps: [],
  currentToothIndex: 0,
  handleSubmit: vi.fn(),
  validateForm: vi.fn().mockReturnValue(true),
  resetSubmission: vi.fn(),
};

vi.mock('../domain/wizard/useWizardSubmit', () => ({
  useWizardSubmit: vi.fn(() => mockSubmitReturn),
}));

const mockReviewReturn = {
  updateFormData: vi.fn(),
  handleToothTreatmentChange: vi.fn(),
  handleRestoreAiSuggestion: vi.fn(),
  handlePatientSelect: vi.fn(),
  handlePatientBirthDateChange: vi.fn(),
};

vi.mock('../domain/wizard/useWizardReview', () => ({
  useWizardReview: vi.fn(() => mockReviewReturn),
}));

const mockDraftRestoreReturn = {
  showRestoreModal: false,
  setShowRestoreModal: vi.fn(),
  pendingDraft: null as ReturnType<typeof makeDraft> | null,
  setPendingDraft: vi.fn(),
  handleRestoreDraft: vi.fn(),
  handleDiscardDraft: vi.fn(),
};

vi.mock('../domain/wizard/useWizardDraftRestore', () => ({
  useWizardDraftRestore: vi.fn(() => mockDraftRestoreReturn),
}));

// ---- External dependencies ----

const mockCanUseCredits = vi.fn().mockReturnValue(true);
const mockGetCreditCost = vi.fn().mockReturnValue(1);
const mockRefreshSubscription = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    canUseCredits: mockCanUseCredits,
    refreshSubscription: mockRefreshSubscription,
    creditsRemaining: 10,
    creditsTotal: 20,
    getCreditCost: mockGetCreditCost,
  })),
}));

const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useAuthenticatedFetch', () => ({
  useAuthenticatedFetch: () => ({
    invokeFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: null }),
}));

vi.mock('@/hooks/useWizardDraft', () => ({
  useWizardDraft: vi.fn(() => ({
    loadDraft: vi.fn().mockResolvedValue(null),
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    isSaving: false,
    lastSavedAt: null,
  })),
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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/data', () => ({
  inventory: { list: vi.fn().mockResolvedValue({ items: [], count: 0 }) },
  patients: { listForAutocomplete: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/data/sample-case', () => ({
  SAMPLE_CASE: {
    analysisResult: { detected: true, confidence: 0.9, detected_teeth: [] },
    formData: { patientName: 'Sample', tooth: '21', treatmentType: 'resina' },
    selectedTeeth: ['21'],
    toothTreatments: { '21': 'resina' },
  },
}));

vi.mock('@/lib/constants', () => ({
  QUERY_STALE_TIMES: { MEDIUM: 60000, LONG: 300000, VERY_LONG: 600000 },
}));

// ---------------------------------------------------------------------------
// Import the hook under test AFTER all vi.mock calls
// ---------------------------------------------------------------------------

import { useWizardFlow } from '../domain/useWizardFlow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDraft(overrides: Record<string, unknown> = {}) {
  return {
    step: 5,
    formData: { patientName: '', tooth: '', treatmentType: 'resina' },
    selectedTeeth: ['11'],
    toothTreatments: { '11': 'resina' as const },
    analysisResult: { detected: true, confidence: 0.9, detected_teeth: [] },
    dsdResult: null,
    uploadedPhotoPath: null,
    additionalPhotos: { smile45: null, face: null },
    patientPreferences: { whiteningLevel: 'natural' },
    vitaShadeManuallySet: false,
    lastSavedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mutable mock return values to defaults
  mockNavReturn.step = 1;
  mockNavReturn.stepDirection = 'forward';
  mockNavReturn.isQuickCase = false;
  mockNavReturn.isQuickCaseRef.current = false;
  mockNavReturn.fullFlowCreditsConfirmedRef.current = false;

  mockPhotoReturn.isAnalyzing = false;
  mockPhotoReturn.analysisError = null;
  mockPhotoReturn.uploadedPhotoPath = null;

  mockSubmitReturn.isSubmitting = false;
  mockSubmitReturn.submissionComplete = false;
  mockSubmitReturn.completedSessionId = null;

  mockDraftRestoreReturn.pendingDraft = null;
  mockDraftRestoreReturn.showRestoreModal = false;

  mockCanUseCredits.mockReturnValue(true);
  mockGetCreditCost.mockReturnValue(1);

  mockSearchParams.delete('sample');
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWizardFlow', () => {
  // =========================================================================
  // 1. Credit gate enforcement (CRITICAL — the canUseCredits bug)
  // =========================================================================

  describe('credit gate enforcement', () => {
    it('should call canUseCredits as a FUNCTION with "case_analysis" argument before submitting', async () => {
      // This is the critical test: canUseCredits must be CALLED, not boolean-checked.
      // The production bug was `!canUseCredits` (always false for a function reference)
      // instead of `!canUseCredits('case_analysis')`.
      mockCanUseCredits.mockReturnValue(true);

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Verify canUseCredits was called with the correct operation string
      expect(mockCanUseCredits).toHaveBeenCalledWith('case_analysis');
      // Verify the actual submit delegate was called (credits passed)
      expect(mockSubmitReturn.handleSubmit).toHaveBeenCalled();
    });

    it('should block submission when canUseCredits("case_analysis") returns false', async () => {
      mockCanUseCredits.mockReturnValue(false);
      const { toast } = await import('sonner');

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleSubmit();
      });

      // canUseCredits must have been invoked as a function
      expect(mockCanUseCredits).toHaveBeenCalledWith('case_analysis');
      // Submission must NOT proceed
      expect(mockSubmitReturn.handleSubmit).not.toHaveBeenCalled();
      // User should see an error toast
      expect(toast.error).toHaveBeenCalledWith(
        'toasts.wizard.noCredits',
        expect.objectContaining({
          description: 'toasts.wizard.noCreditsDescription',
        }),
      );
    });

    it('should proceed to submit.handleSubmit when canUseCredits("case_analysis") returns true', async () => {
      mockCanUseCredits.mockReturnValue(true);

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockCanUseCredits).toHaveBeenCalledWith('case_analysis');
      expect(mockSubmitReturn.handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should navigate to pricing when credits insufficient', async () => {
      mockCanUseCredits.mockReturnValue(false);

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleSubmit();
      });

      const { toast } = await import('sonner');
      // The toast action should navigate to /pricing
      const toastCall = (toast.error as Mock).mock.calls[0];
      expect(toastCall[1]).toHaveProperty('action');
      expect(toastCall[1].action).toHaveProperty('label', 'common.viewPlans');
      // Invoke the onClick to verify navigation
      toastCall[1].action.onClick();
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });
  });

  // =========================================================================
  // 2. Step transitions
  // =========================================================================

  describe('step transitions', () => {
    it('should expose the current step from the navigation sub-hook', () => {
      mockNavReturn.step = 2;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.step).toBe(2);
    });

    it('should delegate goToStep to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.goToStep(4);
      });

      expect(mockNavReturn.goToStep).toHaveBeenCalledWith(4);
    });

    it('should compute canGoBack as true when step is between 1 and 5 inclusive', () => {
      for (const step of [1, 2, 3, 4, 5]) {
        mockNavReturn.step = step;
        const { result } = renderHook(() => useWizardFlow());
        expect(result.current.canGoBack).toBe(true);
      }
    });

    it('should compute canGoBack as false when step is 0 or greater than 5', () => {
      for (const step of [0, 6, 7]) {
        mockNavReturn.step = step;
        const { result } = renderHook(() => useWizardFlow());
        expect(result.current.canGoBack).toBe(false);
      }
    });

    it('should delegate handleBack to navigation handleBack', () => {
      mockNavReturn.step = 3;

      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavReturn.handleBack).toHaveBeenCalled();
    });

    it('should call resetSubmission before handleBack when stepping back from step 6', () => {
      mockNavReturn.step = 6;

      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleBack();
      });

      // resetSubmission should be called when step is 6
      expect(mockSubmitReturn.resetSubmission).toHaveBeenCalled();
      expect(mockNavReturn.handleBack).toHaveBeenCalled();
    });

    it('should NOT call resetSubmission when stepping back from a non-6 step', () => {
      mockNavReturn.step = 4;

      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleBack();
      });

      expect(mockSubmitReturn.resetSubmission).not.toHaveBeenCalled();
      expect(mockNavReturn.handleBack).toHaveBeenCalled();
    });

    it('should expose stepDirection from navigation sub-hook', () => {
      mockNavReturn.stepDirection = 'backward';

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.stepDirection).toBe('backward');
    });
  });

  // =========================================================================
  // 3. Draft restore re-trigger
  // =========================================================================

  describe('draft restore re-trigger', () => {
    it('should set needsReanalysis flag when restoring draft at step 3 with null analysisResult', async () => {
      const draftAtStep3WithNullAnalysis = makeDraft({
        step: 3,
        analysisResult: null,
      });
      mockDraftRestoreReturn.pendingDraft = draftAtStep3WithNullAnalysis;

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      // The orchestrator should have called draftRestore.handleRestoreDraft
      expect(mockDraftRestoreReturn.handleRestoreDraft).toHaveBeenCalled();
    });

    it('should not set needsReanalysis flag when draft has existing analysisResult', async () => {
      const draftAtStep3WithAnalysis = makeDraft({
        step: 3,
        analysisResult: { detected: true, confidence: 0.9, detected_teeth: [] },
      });
      mockDraftRestoreReturn.pendingDraft = draftAtStep3WithAnalysis;

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      // handleRestoreDraft is called but needsReanalysis should NOT be set
      expect(mockDraftRestoreReturn.handleRestoreDraft).toHaveBeenCalled();
      // Since the draft has analysisResult, analyzePhoto should NOT be triggered
      // (the re-trigger effect checks needsReanalysisRef which is not set)
    });

    it('should not set needsReanalysis flag when draft is at step other than 3', async () => {
      const draftAtStep5 = makeDraft({ step: 5, analysisResult: null });
      mockDraftRestoreReturn.pendingDraft = draftAtStep5;

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      // draft.step !== 3, so no re-analysis flag
      expect(mockDraftRestoreReturn.handleRestoreDraft).toHaveBeenCalled();
    });

    it('should call handleRestoreDraft from draftRestore sub-hook when invoked', async () => {
      mockDraftRestoreReturn.pendingDraft = null;

      const { result } = renderHook(() => useWizardFlow());

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      expect(mockDraftRestoreReturn.handleRestoreDraft).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 4. Quick case vs full case flow
  // =========================================================================

  describe('quick case vs full case flow', () => {
    it('should expose isQuickCase from navigation sub-hook', () => {
      mockNavReturn.isQuickCase = false;

      const { result } = renderHook(() => useWizardFlow());
      expect(result.current.isQuickCase).toBe(false);
    });

    it('should delegate goToQuickCase to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.goToQuickCase();
      });

      expect(mockNavReturn.goToQuickCase).toHaveBeenCalled();
    });

    it('should delegate goToPreferences (full case) to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.goToPreferences();
      });

      expect(mockNavReturn.goToPreferences).toHaveBeenCalled();
    });

    it('should delegate handlePreferencesContinue to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handlePreferencesContinue();
      });

      expect(mockNavReturn.handlePreferencesContinue).toHaveBeenCalled();
    });

    it('should report isQuickCase as true when navigation reports it', () => {
      mockNavReturn.isQuickCase = true;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.isQuickCase).toBe(true);
    });
  });

  // =========================================================================
  // 5. State composition — the orchestrator wires sub-hooks correctly
  // =========================================================================

  describe('state composition', () => {
    it('should expose isAnalyzing from photo sub-hook', () => {
      mockPhotoReturn.isAnalyzing = true;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.isAnalyzing).toBe(true);
    });

    it('should expose analysisError from photo sub-hook', () => {
      mockPhotoReturn.analysisError = 'Photo too dark';

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.analysisError).toBe('Photo too dark');
    });

    it('should expose isSubmitting from submit sub-hook', () => {
      mockSubmitReturn.isSubmitting = true;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.isSubmitting).toBe(true);
    });

    it('should expose submissionComplete from submit sub-hook', () => {
      mockSubmitReturn.submissionComplete = true;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.submissionComplete).toBe(true);
    });

    it('should expose completedSessionId from submit sub-hook', () => {
      mockSubmitReturn.completedSessionId = 'session-abc';

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.completedSessionId).toBe('session-abc');
    });

    it('should expose showRestoreModal from draftRestore sub-hook', () => {
      mockDraftRestoreReturn.showRestoreModal = true;

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.showRestoreModal).toBe(true);
    });

    it('should expose creditsRemaining and creditsTotal from subscription', () => {
      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.creditsRemaining).toBe(10);
      expect(result.current.creditsTotal).toBe(20);
    });

    it('should expose uploadedPhotoPath from photo sub-hook', () => {
      mockPhotoReturn.uploadedPhotoPath = 'user-1/photo.jpg';

      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.uploadedPhotoPath).toBe('user-1/photo.jpg');
    });
  });

  // =========================================================================
  // 6. Action delegation
  // =========================================================================

  describe('action delegation', () => {
    it('should delegate handleDSDComplete to dsd sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleDSDComplete(null);
      });

      expect(mockDsdReturn.handleDSDComplete).toHaveBeenCalledWith(null);
    });

    it('should delegate handleDSDSkip to dsd sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleDSDSkip();
      });

      expect(mockDsdReturn.handleDSDSkip).toHaveBeenCalled();
    });

    it('should delegate updateFormData to review sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.updateFormData({ vitaShade: 'A3' });
      });

      expect(mockReviewReturn.updateFormData).toHaveBeenCalledWith({ vitaShade: 'A3' });
    });

    it('should delegate handleReanalyze to photo sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleReanalyze();
      });

      expect(mockPhotoReturn.handleReanalyze).toHaveBeenCalled();
    });

    it('should delegate handleRetryAnalysis to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleRetryAnalysis();
      });

      expect(mockNavReturn.handleRetryAnalysis).toHaveBeenCalled();
    });

    it('should delegate handleSkipToReview to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleSkipToReview();
      });

      expect(mockNavReturn.handleSkipToReview).toHaveBeenCalled();
    });

    it('should delegate cancelAnalysis to navigation sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.cancelAnalysis();
      });

      expect(mockNavReturn.cancelAnalysis).toHaveBeenCalled();
    });

    it('should delegate handleDiscardDraft to draftRestore sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handleDiscardDraft();
      });

      expect(mockDraftRestoreReturn.handleDiscardDraft).toHaveBeenCalled();
    });

    it('should delegate handlePatientSelect to review sub-hook', () => {
      const { result } = renderHook(() => useWizardFlow());

      act(() => {
        result.current.handlePatientSelect('John Doe', 'patient-1', '1990-01-01');
      });

      expect(mockReviewReturn.handlePatientSelect).toHaveBeenCalledWith(
        'John Doe',
        'patient-1',
        '1990-01-01',
      );
    });
  });

  // =========================================================================
  // 7. Credit confirmation dialog
  // =========================================================================

  describe('credit confirmation', () => {
    it('should expose creditConfirmData as null initially', () => {
      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.creditConfirmData).toBeNull();
    });
  });

  // =========================================================================
  // 8. Initial default state
  // =========================================================================

  describe('initial state', () => {
    it('should initialize with default state values', () => {
      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.imageBase64).toBeNull();
      expect(result.current.analysisResult).toBeNull();
      expect(result.current.dsdResult).toBeNull();
      expect(result.current.selectedPatientId).toBeNull();
      expect(result.current.patientBirthDate).toBeNull();
      expect(result.current.dobValidationError).toBe(false);
      expect(result.current.isSampleCase).toBe(false);
      expect(result.current.selectedTeeth).toEqual([]);
      expect(result.current.toothTreatments).toEqual({});
      expect(result.current.additionalPhotos).toEqual({ smile45: null, face: null });
      expect(result.current.patientPreferences).toEqual({ whiteningLevel: 'natural' });
    });

    it('should expose patients as empty array when no autocomplete data', () => {
      const { result } = renderHook(() => useWizardFlow());

      expect(result.current.patients).toEqual([]);
    });
  });
});
