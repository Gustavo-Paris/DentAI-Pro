import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoAnalysis } from '../domain/wizard/usePhotoAnalysis';
import type { UsePhotoAnalysisParams } from '../domain/wizard/usePhotoAnalysis';
import type { PhotoAnalysisResult, ReviewFormData } from '@/components/wizard/ReviewAnalysisStep';
import { INITIAL_FORM_DATA } from '../domain/wizard/constants';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/data', () => ({
  wizard: {
    uploadPhoto: vi.fn().mockResolvedValue('user-1/intraoral_123.jpg'),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'pt-BR' },
    }),
  };
});

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Minimal valid base64 JPEG
const FAKE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQ';

function createMockAnalysis(overrides?: Partial<PhotoAnalysisResult>): PhotoAnalysisResult {
  return {
    detected: true,
    confidence: 0.92,
    detected_teeth: [
      {
        tooth: '11',
        cavity_class: 'Classe II',
        restoration_size: 'média',
        substrate: 'esmalte',
        treatment_indication: 'resina',
        indication_reason: 'Cárie classe II',
        tooth_region: 'anterior',
        substrate_condition: 'íntegro',
        enamel_condition: 'normal',
        depth: 'superficial',
        priority: 'alta',
        tooth_bounds: undefined,
        notes: null,
      },
    ] as PhotoAnalysisResult['detected_teeth'],
    primary_tooth: '11',
    vita_shade: 'A2',
    treatment_indication: 'resina',
    indication_reason: 'Cárie classe II',
    observations: [],
    warnings: [],
    ...overrides,
  } as PhotoAnalysisResult;
}

function createParams(overrides?: Partial<UsePhotoAnalysisParams>): UsePhotoAnalysisParams {
  return {
    userId: 'user-1',
    imageBase64: FAKE_BASE64,
    formData: { ...INITIAL_FORM_DATA },
    setFormData: vi.fn(),
    setStep: vi.fn(),
    isQuickCaseRef: { current: false },
    canUseCredits: vi.fn().mockReturnValue(true),
    confirmCreditUse: vi.fn().mockResolvedValue(true),
    fullFlowCreditsConfirmedRef: { current: false },
    analysisAbortedRef: { current: false },
    invokeFunction: vi.fn().mockResolvedValue({
      data: { analysis: createMockAnalysis() },
      error: null,
    }),
    getCreditCost: vi.fn().mockReturnValue(1),
    refreshSubscription: vi.fn(),
    navigate: vi.fn(),
    setAnalysisResult: vi.fn(),
    patientWhiteningLevel: 'natural',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// TODO: Fix hook rendering — result.current is null due to incomplete provider wrapper
describe.skip('usePhotoAnalysis', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePhotoAnalysis(createParams()));
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.isReanalyzing).toBe(false);
      expect(result.current.analysisError).toBeNull();
      expect(result.current.uploadedPhotoPath).toBeNull();
    });

    it('should expose vitaShadeManuallySetRef as false initially', () => {
      const { result } = renderHook(() => usePhotoAnalysis(createParams()));
      expect(result.current.vitaShadeManuallySetRef.current).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // analyzePhoto
  // -------------------------------------------------------------------------

  describe('analyzePhoto', () => {
    it('should complete analysis flow successfully', async () => {
      const params = createParams({
        fullFlowCreditsConfirmedRef: { current: true },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(params.invokeFunction).toHaveBeenCalledWith(
        'analyze-dental-photo',
        expect.objectContaining({ body: { imageBase64: FAKE_BASE64, imageType: 'intraoral' } }),
      );
      expect(params.setAnalysisResult).toHaveBeenCalled();
      expect(params.refreshSubscription).toHaveBeenCalled();
      // Should advance step to 4 (non-quick case)
      const stepCalls = (params.setStep as ReturnType<typeof vi.fn>).mock.calls;
      expect(stepCalls[stepCalls.length - 1][0]).toBe(4);
    });

    it('should block when credits insufficient', async () => {
      const params = createParams({
        canUseCredits: vi.fn().mockReturnValue(false),
        fullFlowCreditsConfirmedRef: { current: false },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(params.invokeFunction).not.toHaveBeenCalled();
    });

    it('should not proceed when credit confirmation denied', async () => {
      const params = createParams({
        confirmCreditUse: vi.fn().mockResolvedValue(false),
        fullFlowCreditsConfirmedRef: { current: false },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(params.invokeFunction).not.toHaveBeenCalled();
    });

    it('should skip credit check when fullFlowCreditsConfirmed', async () => {
      const params = createParams({
        fullFlowCreditsConfirmedRef: { current: true },
        canUseCredits: vi.fn().mockReturnValue(false), // would block otherwise
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(params.invokeFunction).toHaveBeenCalled();
    });

    it('should set error on analysis failure', async () => {
      const params = createParams({
        fullFlowCreditsConfirmedRef: { current: true },
        invokeFunction: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Failed to fetch'),
        }),
      });

      // withRetry needs to propagate the throw from result.error
      const { withRetry } = await import('@/lib/retry');
      (withRetry as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (fn: () => Promise<unknown>) => fn(),
      );

      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(result.current.analysisError).not.toBeNull();
    });

    it('should not call analyze when no image', async () => {
      const params = createParams({ imageBase64: null });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(params.invokeFunction).not.toHaveBeenCalled();
    });

    it('should advance to step 5 for quick cases', async () => {
      const params = createParams({
        fullFlowCreditsConfirmedRef: { current: true },
        isQuickCaseRef: { current: true },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      const stepCalls = (params.setStep as ReturnType<typeof vi.fn>).mock.calls;
      expect(stepCalls[stepCalls.length - 1][0]).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // vitaShade protection
  // -------------------------------------------------------------------------

  describe('vitaShade protection', () => {
    it('should not override vitaShade when whitening is non-natural', async () => {
      const setFormData = vi.fn();
      const params = createParams({
        patientWhiteningLevel: 'hollywood',
        setFormData,
        fullFlowCreditsConfirmedRef: { current: true },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(setFormData).toHaveBeenCalled();
      const setterFn = setFormData.mock.calls[0][0];
      const prev = { ...INITIAL_FORM_DATA, vitaShade: 'BL1' } as ReviewFormData;
      const updated = setterFn(prev);
      expect(updated.vitaShade).toBe('BL1'); // preserved, not overridden by AI's A2
    });

    it('should update vitaShade when whitening is natural', async () => {
      const setFormData = vi.fn();
      const params = createParams({
        patientWhiteningLevel: 'natural',
        setFormData,
        fullFlowCreditsConfirmedRef: { current: true },
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.analyzePhoto();
      });

      expect(setFormData).toHaveBeenCalled();
      const setterFn = setFormData.mock.calls[0][0];
      const prev = { ...INITIAL_FORM_DATA, vitaShade: 'B3' } as ReviewFormData;
      const updated = setterFn(prev);
      expect(updated.vitaShade).toBe('A2'); // AI value applied
    });
  });

  // -------------------------------------------------------------------------
  // handleReanalyze
  // -------------------------------------------------------------------------

  describe('handleReanalyze', () => {
    it('should reanalyze successfully', async () => {
      const params = createParams();
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.handleReanalyze();
      });

      expect(params.invokeFunction).toHaveBeenCalledWith(
        'analyze-dental-photo',
        expect.objectContaining({ body: { imageBase64: FAKE_BASE64, imageType: 'intraoral' } }),
      );
      expect(params.setAnalysisResult).toHaveBeenCalled();
      expect(params.refreshSubscription).toHaveBeenCalled();
      expect(result.current.isReanalyzing).toBe(false);
    });

    it('should block reanalysis when credits insufficient', async () => {
      const params = createParams({
        canUseCredits: vi.fn().mockReturnValue(false),
      });
      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.handleReanalyze();
      });

      expect(params.invokeFunction).not.toHaveBeenCalled();
    });

    it('should handle reanalysis error', async () => {
      const params = createParams({
        invokeFunction: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Server error'),
        }),
      });

      const { withRetry } = await import('@/lib/retry');
      (withRetry as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (fn: () => Promise<unknown>) => fn(),
      );

      const { result } = renderHook(() => usePhotoAnalysis(params));

      await act(async () => {
        await result.current.handleReanalyze();
      });

      // Should recover from error and set isReanalyzing back to false
      expect(result.current.isReanalyzing).toBe(false);
    });
  });
});
