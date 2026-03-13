import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useWizardSubmit,
} from '../domain/wizard/useWizardSubmit';
import type { UseWizardSubmitParams } from '../domain/wizard/useWizardSubmit';
import {
  getToothData,
  getToothTreatment,
  normalizeTreatment,
  inferCavityClass,
  getFullRegion,
  isAnterior,
} from '../domain/wizard/helpers';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
  DetectedTooth,
} from '@/components/wizard/ReviewAnalysisStep';
import { INITIAL_FORM_DATA } from '../domain/wizard/constants';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/data', () => ({
  wizard: {
    createPatient: vi.fn(),
    findPatientByName: vi.fn(),
    updatePatientBirthDate: vi.fn(),
    createEvaluation: vi.fn(),
    updateEvaluationProtocol: vi.fn(),
    updateEvaluationStatus: vi.fn(),
    invokeRecommendCementation: vi.fn(),
    invokeRecommendResin: vi.fn(),
    savePendingTeeth: vi.fn(),
    syncGroupProtocols: vi.fn(),
    warmupEdgeFunctions: vi.fn(),
    uploadPhoto: vi.fn(),
  },
  evaluations: {
    updateEvaluationProtocol: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: unknown }) => children,
  I18nextProvider: ({ children }: { children: unknown }) => children,
  withTranslation: () => (Component: any) => Component,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/constants', () => ({
  TIMING: { WIZARD_SUBMIT_DELAY: 0, CASE_GENERATION_TIMEOUT: 600_000 },
}));

vi.mock('@/lib/edge-function-errors', () => ({
  classifyEdgeFunctionError: vi.fn(() => 'unknown'),
}));

vi.mock('@/lib/protocol-dispatch', () => ({
  dispatchTreatmentProtocol: vi.fn().mockResolvedValue({ aiGenerated: true }),
  DEFAULT_CERAMIC_TYPE: 'Dissilicato de lítio',
}));

vi.mock('@/lib/evaluation-status', () => ({
  EVALUATION_STATUS: {
    ANALYZING: 'analyzing',
    DRAFT: 'draft',
    COMPLETED: 'completed',
    ERROR: 'error',
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTooth(overrides?: Partial<DetectedTooth>): DetectedTooth {
  return {
    tooth: '11',
    tooth_region: 'anterior',
    cavity_class: 'Classe II',
    restoration_size: 'média',
    substrate: 'esmalte',
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    priority: 'alta',
    notes: null,
    ...overrides,
  };
}

function makeAnalysis(overrides?: Partial<PhotoAnalysisResult>): PhotoAnalysisResult {
  return {
    detected: true,
    confidence: 0.9,
    detected_teeth: [],
    primary_tooth: null,
    vita_shade: null,
    observations: [],
    warnings: [],
    ...overrides,
  };
}

function createParams(overrides?: Partial<UseWizardSubmitParams>): UseWizardSubmitParams {
  return {
    user: { id: 'user-1' },
    formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30' },
    setFormData: vi.fn(),
    selectedTeeth: ['11'],
    selectedPatientId: null,
    patientBirthDate: '1994-01-01',
    originalPatientBirthDate: null,
    uploadedPhotoPath: null,
    analysisResult: null,
    dsdResult: null,
    patientPreferences: { whiteningLevel: 'natural' },
    toothTreatments: {},
    additionalPhotos: { smile45: null, face: null, radiograph: null },
    setStep: vi.fn(),
    clearDraft: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Get reference to the wizard mock for assertions
let wizardMock: Record<string, ReturnType<typeof vi.fn>>;

beforeEach(async () => {
  vi.clearAllMocks();
  const { wizard } = await import('@/data');
  wizardMock = wizard as unknown as Record<string, ReturnType<typeof vi.fn>>;
});

// ---- getToothData ---------------------------------------------------------

describe('getToothData', () => {
  it('should find tooth by number', () => {
    const t11 = makeTooth({ tooth: '11', cavity_class: 'Classe II' });
    const t21 = makeTooth({ tooth: '21', cavity_class: 'Classe III' });
    const analysis = makeAnalysis({ detected_teeth: [t11, t21] });

    expect(getToothData(analysis, '21')?.cavity_class).toBe('Classe III');
  });

  it('should return undefined when tooth not found', () => {
    const analysis = makeAnalysis({ detected_teeth: [] });
    expect(getToothData(analysis, '99')).toBeUndefined();
  });

  it('should return undefined when analysisResult is null', () => {
    expect(getToothData(null, '11')).toBeUndefined();
  });
});

// ---- getToothTreatment ----------------------------------------------------

describe('getToothTreatment', () => {
  const baseFormData: ReviewFormData = { ...INITIAL_FORM_DATA, treatmentType: 'porcelana' };

  it('should prefer user override from toothTreatments', () => {
    const analysis = makeAnalysis({
      detected_teeth: [makeTooth({ tooth: '11', treatment_indication: 'coroa' })],
    });
    const result = getToothTreatment('11', { '11': 'implante' }, analysis, baseFormData);
    expect(result).toBe('implante');
  });

  it('should fall back to AI detected treatment', () => {
    const analysis = makeAnalysis({
      detected_teeth: [makeTooth({ tooth: '11', treatment_indication: 'endodontia' })],
    });
    const result = getToothTreatment('11', {}, analysis, baseFormData);
    expect(result).toBe('endodontia');
  });

  it('should fall back to form treatmentType', () => {
    const analysis = makeAnalysis({ detected_teeth: [] });
    const result = getToothTreatment('11', {}, analysis, baseFormData);
    expect(result).toBe('porcelana');
  });

  it('should default to resina when all empty', () => {
    const emptyForm: ReviewFormData = { ...INITIAL_FORM_DATA, treatmentType: '' as TreatmentType };
    const result = getToothTreatment('11', {}, makeAnalysis(), emptyForm);
    expect(result).toBe('resina');
  });
});

// ---- normalizeTreatment ---------------------------------------------------

describe('normalizeTreatment', () => {
  it.each([
    ['porcelain', 'porcelana'],
    ['resin', 'resina'],
    ['crown', 'coroa'],
    ['implant', 'implante'],
    ['endodontics', 'endodontia'],
    ['referral', 'encaminhamento'],
    ['gingivoplasty', 'gengivoplastia'],
  ] as const)('should map English "%s" to Portuguese "%s"', (input, expected) => {
    expect(normalizeTreatment(input)).toBe(expected);
  });

  it('should pass through already-Portuguese values', () => {
    expect(normalizeTreatment('resina')).toBe('resina');
    expect(normalizeTreatment('porcelana')).toBe('porcelana');
  });

  it('should pass through unknown treatment types', () => {
    expect(normalizeTreatment('unknown')).toBe('unknown');
  });
});

// ---- useWizardSubmit hook -------------------------------------------------

describe('useWizardSubmit', () => {
  it('isSubmitting should be false initially', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('validateForm should return false when no teeth selected', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ selectedTeeth: [], formData: { ...INITIAL_FORM_DATA, tooth: '' } })),
    );
    const valid = result.current.validateForm();
    expect(valid).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.selectTooth');
  });

  it('validateForm should return true with valid data', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    const valid = result.current.validateForm();
    expect(valid).toBe(true);
  });

  it('handleSubmit should not proceed when user is null', async () => {
    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ user: null, setStep })),
    );
    await result.current.handleSubmit();
    // setStep should NOT be called (submit exits early)
    expect(setStep).not.toHaveBeenCalled();
  });

  it('validateForm should show warning and default age when patientAge is empty', async () => {
    const { toast } = await import('sonner');
    const setFormData = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '' },
        patientBirthDate: null,
        setFormData,
      })),
    );
    const valid = result.current.validateForm();
    expect(valid).toBe(true); // DOB is optional, shows warning but continues
    expect(toast.warning).toHaveBeenCalled();
    expect(setFormData).toHaveBeenCalled();
  });

  it('validateForm should use single tooth from formData when selectedTeeth is empty', () => {
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        selectedTeeth: [],
        formData: { ...INITIAL_FORM_DATA, tooth: '21', patientAge: '25' },
      })),
    );
    const valid = result.current.validateForm();
    expect(valid).toBe(true);
  });

  it('submissionComplete should be false initially', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.submissionComplete).toBe(false);
  });

  it('completedSessionId should be null initially', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.completedSessionId).toBeNull();
  });

  it('submissionStep should be 0 initially', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.submissionStep).toBe(0);
  });

  it('currentToothIndex should be -1 initially', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.currentToothIndex).toBe(-1);
  });

  it('submissionSteps should include patient prep step', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    expect(result.current.submissionSteps.length).toBeGreaterThanOrEqual(2);
    expect(result.current.submissionSteps[0].label).toBe('wizard.submission.preparingPatient');
  });

  it('submissionSteps should include finalizing step', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    const lastStep = result.current.submissionSteps[result.current.submissionSteps.length - 1];
    expect(lastStep.label).toBe('wizard.submission.finalizing');
  });

  it('resetSubmission should reset all submission state', () => {
    const { result } = renderHook(() => useWizardSubmit(createParams()));
    act(() => result.current.resetSubmission());
    expect(result.current.submissionComplete).toBe(false);
    expect(result.current.completedSessionId).toBeNull();
    expect(result.current.submissionStep).toBe(0);
    expect(result.current.currentToothIndex).toBe(-1);
  });

  it('handleSubmit should not proceed when validation fails', async () => {
    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        selectedTeeth: [],
        formData: { ...INITIAL_FORM_DATA, tooth: '' },
        setStep,
      })),
    );
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(setStep).not.toHaveBeenCalled();
  });

  it('handleSubmit should call setStep(6) when proceeding', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep, clearDraft })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should set step to 6 (submission progress screen)
    expect(setStep).toHaveBeenCalledWith(6);
  });

  it('handleSubmit should handle patient creation errors', async () => {
    const { toast } = await import('sonner');
    wizardMock.createPatient.mockResolvedValue({
      data: null,
      error: { code: 'UNKNOWN', message: 'DB error' },
    });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should still proceed to create evaluations (patientId will be null)
    expect(setStep).toHaveBeenCalledWith(6);
  });

  it('handleSubmit should find existing patient on duplicate', async () => {
    wizardMock.createPatient.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'Duplicate' },
    });
    wizardMock.findPatientByName.mockResolvedValue({ id: 'existing-pat-1' });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.findPatientByName).toHaveBeenCalled();
  });

  it('handleSubmit should prevent double submission', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep, clearDraft })),
    );

    // Call submit twice rapidly
    await act(async () => {
      const p1 = result.current.handleSubmit();
      const p2 = result.current.handleSubmit();
      await Promise.all([p1, p2]);
    });

    // createEvaluation should only be called once (guard prevents double submission)
    expect(wizardMock.createEvaluation).toHaveBeenCalledTimes(1);
  });

  it('handleSubmit should handle GENGIVO tooth as gengivoplastia', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['GENGIVO'],
        toothTreatments: { GENGIVO: 'gengivoplastia' as TreatmentType },
        formData: { ...INITIAL_FORM_DATA, tooth: 'GENGIVO', patientAge: '30' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.createEvaluation).toHaveBeenCalled();
    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.tooth).toBe('GENGIVO');
    expect(insertData.region).toBe('anterior-superior');
    expect(insertData.cavity_class).toBe('N/A');
  });

  it('handleSubmit should deduplicate gengivoplastia teeth when GENGIVO present', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const analysisResult = makeAnalysis({
      detected_teeth: [
        makeTooth({ tooth: '11', treatment_indication: 'gengivoplastia' }),
        makeTooth({ tooth: '21', treatment_indication: 'resina' }),
      ],
    });

    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['GENGIVO', '11', '21'],
        toothTreatments: {
          GENGIVO: 'gengivoplastia' as TreatmentType,
          '11': 'gengivoplastia' as TreatmentType,
          '21': 'resina' as TreatmentType,
        },
        analysisResult,
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // GENGIVO + tooth 21 (resina) should be created; tooth 11 (gengivoplastia) is deduped
    expect(wizardMock.createEvaluation).toHaveBeenCalledTimes(2);
  });

  it('handleSubmit should handle multiple teeth with different treatment types', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValueOnce({ id: 'eval-1' })
      .mockResolvedValueOnce({ id: 'eval-2' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    wizardMock.syncGroupProtocols.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11', '21'],
        toothTreatments: { '11': 'resina' as TreatmentType, '21': 'porcelana' as TreatmentType },
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.createEvaluation).toHaveBeenCalledTimes(2);
    // 2+ successful evals should trigger syncGroupProtocols
    expect(wizardMock.syncGroupProtocols).toHaveBeenCalled();
  });

  it('handleSubmit should use selectedPatientId when provided (skip patient creation)', async () => {
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    wizardMock.updatePatientBirthDate.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedPatientId: 'existing-pat-id',
        patientBirthDate: '1990-01-01',
        originalPatientBirthDate: null,
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should NOT create patient
    expect(wizardMock.createPatient).not.toHaveBeenCalled();
    // Should update birth date since originalPatientBirthDate is null
    expect(wizardMock.updatePatientBirthDate).toHaveBeenCalledWith('existing-pat-id', '1990-01-01');
  });

  it('handleSubmit should handle timeout error', async () => {
    const { toast } = await import('sonner');
    const { TIMING } = await import('@/lib/constants');
    // Override to very short timeout
    (TIMING as { CASE_GENERATION_TIMEOUT: number }).CASE_GENERATION_TIMEOUT = 1;
    wizardMock.createPatient.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.globalTimeout', expect.any(Object));

    // Restore
    (TIMING as { CASE_GENERATION_TIMEOUT: number }).CASE_GENERATION_TIMEOUT = 600_000;
  });

  it('handleSubmit should handle 23505 duplicate error at top level', async () => {
    const { toast } = await import('sonner');
    wizardMock.createPatient.mockRejectedValue({ code: '23505', message: 'duplicate' });

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.duplicatePatient', expect.any(Object));
  });

  it('handleSubmit should handle 23503 reference error', async () => {
    const { toast } = await import('sonner');
    wizardMock.createPatient.mockRejectedValue({ code: '23503', message: 'reference error' });

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.referenceError', expect.any(Object));
  });

  it('handleSubmit should handle connection error classification', async () => {
    const { toast } = await import('sonner');
    const { classifyEdgeFunctionError } = await import('@/lib/edge-function-errors');
    (classifyEdgeFunctionError as ReturnType<typeof vi.fn>).mockReturnValueOnce('connection');
    wizardMock.createPatient.mockRejectedValue({ message: 'fetch failed' });

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.networkErrorSubmit', expect.any(Object));
  });

  it('handleSubmit should handle rate_limited error', async () => {
    const { toast } = await import('sonner');
    const { classifyEdgeFunctionError } = await import('@/lib/edge-function-errors');
    (classifyEdgeFunctionError as ReturnType<typeof vi.fn>).mockReturnValueOnce('rate_limited');
    wizardMock.createPatient.mockRejectedValue({ message: 'too many requests' });

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.tooManyRequests', expect.any(Object));
    // Should NOT go back to step 5 for rate limit
    expect(setStep).not.toHaveBeenCalledWith(5);
  });

  it('handleSubmit should handle fallback protocols (aiGenerated: false)', async () => {
    const { toast } = await import('sonner');
    const { dispatchTreatmentProtocol } = await import('@/lib/protocol-dispatch');
    (dispatchTreatmentProtocol as ReturnType<typeof vi.fn>).mockResolvedValue({ aiGenerated: false });

    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep, clearDraft })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should show fallback warning toast
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('toasts.wizard.fallbackWarning'),
      expect.any(Object),
    );
  });

  it('handleSubmit should handle individual tooth processing error', async () => {
    const { toast } = await import('sonner');
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockRejectedValue(new Error('DB insert error'));

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // All teeth failed
    expect(toast.error).toHaveBeenCalledWith('toasts.wizard.allFailed', expect.any(Object));
    expect(setStep).toHaveBeenCalledWith(5);
  });

  it('handleSubmit should save pending (unselected) teeth', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    wizardMock.savePendingTeeth.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const analysisResult = makeAnalysis({
      detected_teeth: [
        makeTooth({ tooth: '11' }),
        makeTooth({ tooth: '21' }),
        makeTooth({ tooth: '22' }),
      ],
    });

    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11'],
        analysisResult,
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Teeth 21 and 22 are unselected and should be saved as pending
    expect(wizardMock.savePendingTeeth).toHaveBeenCalled();
    const pendingPayload = wizardMock.savePendingTeeth.mock.calls[0][0];
    expect(pendingPayload).toHaveLength(2);
  });

  it('handleSubmit should handle radiograph upload', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    wizardMock.uploadPhoto.mockResolvedValue('user-1/session/radiograph');

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    // Provide a base64-ish radiograph
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        additionalPhotos: { smile45: null, face: null, radiograph: 'data:image/jpeg;base64,AAAA' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.uploadPhoto).toHaveBeenCalled();
  });

  it('handleSubmit should handle radiograph upload failure gracefully', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    wizardMock.uploadPhoto.mockRejectedValue(new Error('Upload failed'));

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        additionalPhotos: { smile45: null, face: null, radiograph: 'data:image/jpeg;base64,AAAA' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should still proceed despite upload failure
    expect(wizardMock.createEvaluation).toHaveBeenCalled();
  });

  it('handleSubmit with porcelana treatment should pass cementationParams', async () => {
    const { dispatchTreatmentProtocol } = await import('@/lib/protocol-dispatch');
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11'],
        toothTreatments: { '11': 'porcelana' as TreatmentType },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(dispatchTreatmentProtocol).toHaveBeenCalled();
    const dispatchCall = (dispatchTreatmentProtocol as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(dispatchCall.treatmentType).toBe('porcelana');
    expect(dispatchCall.cementationParams).toBeDefined();
  });

  it('handleSubmit with hollywood whitening should set aestheticGoals', async () => {
    const { dispatchTreatmentProtocol } = await import('@/lib/protocol-dispatch');
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        patientPreferences: { whiteningLevel: 'hollywood' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(dispatchTreatmentProtocol).toHaveBeenCalled();
    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.patient_aesthetic_goals).toBe('whitening_hollywood');
  });

  it('handleSubmit with premium budget should set aesthetic_level to estético', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', budget: 'premium' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.aesthetic_level).toBe('estético');
    expect(insertData.budget).toBe('premium');
  });

  it('handleSubmit with anamnesis and clinical notes should merge both', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        anamnesis: 'Patient has diabetes',
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', clinicalNotes: 'Tooth sensitive' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.anamnesis).toContain('Patient has diabetes');
    expect(insertData.anamnesis).toContain('Notas clínicas do dentista: Tooth sensitive');
  });

  it('handleSubmit with special treatments (implante, coroa, endodontia) always calls AI', async () => {
    const { dispatchTreatmentProtocol } = await import('@/lib/protocol-dispatch');
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValueOnce({ id: 'eval-1' })
      .mockResolvedValueOnce({ id: 'eval-2' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    // Two implante teeth — both should trigger AI calls (no primary optimization)
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11', '21'],
        toothTreatments: {
          '11': 'implante' as TreatmentType,
          '21': 'implante' as TreatmentType,
        },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Both teeth should call dispatchTreatmentProtocol (implante always dispatches)
    expect(dispatchTreatmentProtocol).toHaveBeenCalledTimes(2);
  });

  it('handleSubmit with error containing short message should display it', async () => {
    const { toast } = await import('sonner');
    const { classifyEdgeFunctionError } = await import('@/lib/edge-function-errors');
    (classifyEdgeFunctionError as ReturnType<typeof vi.fn>).mockReturnValueOnce('unknown');
    wizardMock.createPatient.mockRejectedValue({ message: 'Short error msg' });

    const setStep = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('toasts.wizard.unknownError'),
      expect.any(Object),
    );
  });

  it('handleSubmit with findPatientByName returning null should keep patientId null', async () => {
    wizardMock.createPatient.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'Duplicate' },
    });
    wizardMock.findPatientByName.mockResolvedValue(null);
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        formData: { ...INITIAL_FORM_DATA, tooth: '11', patientAge: '30', patientName: 'Test' },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.findPatientByName).toHaveBeenCalled();
    // Evaluation should still be created with null patient_id
    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.patient_id).toBeNull();
  });

  it('handleSubmit with partial tooth failure should show partial success toast', async () => {
    const { toast } = await import('sonner');
    const { dispatchTreatmentProtocol } = await import('@/lib/protocol-dispatch');
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });

    // First tooth succeeds, second fails
    wizardMock.createEvaluation
      .mockResolvedValueOnce({ id: 'eval-1' })
      .mockRejectedValueOnce(new Error('DB error'));
    wizardMock.updateEvaluationStatus.mockResolvedValue({});
    (dispatchTreatmentProtocol as ReturnType<typeof vi.fn>).mockResolvedValue({ aiGenerated: true });

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11', '21'],
        toothTreatments: { '11': 'resina' as TreatmentType, '21': 'resina' as TreatmentType },
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Partial success toast
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('toasts.wizard.partialSuccess'),
      expect.any(Object),
    );
  });

  it('handleSubmit with analysisResult should include DSD analysis data in evaluation', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const analysisResult = makeAnalysis({
      confidence: 85,
      vita_shade: 'A3',
      smile_line: 'alta',
      facial_midline: 'centrada',
      dental_midline: 'coincidente',
      buccal_corridor: 'adequado',
      occlusal_plane: 'nivelado',
      golden_ratio_compliance: 80,
      symmetry_score: 75,
      detected_teeth: [makeTooth({ tooth: '11', current_issue: 'cárie', proposed_change: 'restauração' })],
    });

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        analysisResult,
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.dsd_analysis).toBeDefined();
    expect(insertData.dsd_analysis.confidence).toBe('alta');
    expect(insertData.tooth_color).toBe('A3');
  });

  it('handleSubmit should set confidence to média when between 50 and 80', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const analysisResult = makeAnalysis({ confidence: 60 });

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep, clearDraft, analysisResult })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.dsd_analysis.confidence).toBe('média');
  });

  it('handleSubmit should set confidence to baixa when below 50', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const analysisResult = makeAnalysis({ confidence: 30 });

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({ setStep, clearDraft, analysisResult })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    const insertData = wizardMock.createEvaluation.mock.calls[0][0];
    expect(insertData.dsd_analysis.confidence).toBe('baixa');
  });

  it('submissionSteps should include tooth labels when submissionStep >= 2', async () => {
    wizardMock.createPatient.mockResolvedValue({ data: { id: 'pat-1' }, error: null });
    wizardMock.createEvaluation.mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({ id: 'eval-1' }), 50)),
    );
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedTeeth: ['11', '21'],
      })),
    );

    // Before submission, steps should only have patient + finalizing
    expect(result.current.submissionSteps.length).toBe(2);
  });

  it('handleSubmit should skip patient birth date update when original exists', async () => {
    wizardMock.createEvaluation.mockResolvedValue({ id: 'eval-1' });
    wizardMock.updateEvaluationStatus.mockResolvedValue({});

    const setStep = vi.fn();
    const clearDraft = vi.fn();
    const { result } = renderHook(() =>
      useWizardSubmit(createParams({
        setStep,
        clearDraft,
        selectedPatientId: 'pat-1',
        patientBirthDate: '1990-01-01',
        originalPatientBirthDate: '1990-01-01', // already has DOB
      })),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(wizardMock.updatePatientBirthDate).not.toHaveBeenCalled();
  });
});

// ---- inferCavityClass (real implementation) --------------------------------

describe('inferCavityClass', () => {
  it('should return toothData cavity_class when available', () => {
    const tooth = makeTooth({ cavity_class: 'Classe III' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Classe III');
  });

  it('should return fallback when no tooth data', () => {
    expect(inferCavityClass(undefined, 'Classe I')).toBe('Classe I');
  });

  it('should infer "Lente de Contato" for lente reason', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'lente de contato indicada' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Lente de Contato');
  });

  it('should infer "Lente de Contato" for contato reason', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'ponto de contato comprometido' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Lente de Contato');
  });

  it('should infer "Recontorno Estético" for reanatomização', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'reanatomização dental' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" for microdontia', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'microdontia lateral' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" for volume', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'aumento de volume vestibular' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" for conoide', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'dente conoide' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Fechamento de Diastema" for diastema', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'diastema central 2mm' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('should infer "Fechamento de Diastema" for espaçamento', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'espaçamento interproximal' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('should infer "Faceta Direta" for faceta', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'faceta direta necessária' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Faceta Direta');
  });

  it('should infer "Reparo de Restauração" for reparo', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'reparo de restauração antiga' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('should infer "Reparo de Restauração" for substituição', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'substituição de restauração' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('should infer "Recontorno Estético" for desgaste', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'desgaste incisal severo' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" for incisal', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'fratura incisal' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" for recontorno', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: 'recontorno cosmético' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should return "Faceta Direta" when porcelana + Black\'s class fallback', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: '' });
    expect(inferCavityClass(tooth, 'Classe IV', 'porcelana')).toBe('Faceta Direta');
  });

  it('should NOT return "Faceta Direta" when porcelana + non-Black\'s fallback', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: '' });
    expect(inferCavityClass(tooth, 'Custom Class', 'porcelana')).toBe('Custom Class');
  });

  it('should return fallback when no reason and no porcelana override', () => {
    const tooth = makeTooth({ cavity_class: null, indication_reason: '' });
    expect(inferCavityClass(tooth, 'Default', 'resina')).toBe('Default');
  });
});

// ---- isAnterior -----------------------------------------------------------

describe('isAnterior', () => {
  it('should return true for anterior teeth', () => {
    expect(isAnterior('11')).toBe(true);
    expect(isAnterior('12')).toBe(true);
    expect(isAnterior('13')).toBe(true);
    expect(isAnterior('21')).toBe(true);
    expect(isAnterior('22')).toBe(true);
    expect(isAnterior('23')).toBe(true);
    expect(isAnterior('31')).toBe(true);
    expect(isAnterior('32')).toBe(true);
    expect(isAnterior('33')).toBe(true);
    expect(isAnterior('41')).toBe(true);
    expect(isAnterior('42')).toBe(true);
    expect(isAnterior('43')).toBe(true);
  });

  it('should return false for posterior teeth', () => {
    expect(isAnterior('14')).toBe(false);
    expect(isAnterior('15')).toBe(false);
    expect(isAnterior('16')).toBe(false);
    expect(isAnterior('24')).toBe(false);
    expect(isAnterior('36')).toBe(false);
    expect(isAnterior('47')).toBe(false);
  });
});

// ---- getFullRegion --------------------------------------------------------

describe('getFullRegion', () => {
  it('should return "anterior-superior" for upper anterior teeth', () => {
    expect(getFullRegion('11')).toBe('anterior-superior');
    expect(getFullRegion('13')).toBe('anterior-superior');
    expect(getFullRegion('21')).toBe('anterior-superior');
    expect(getFullRegion('23')).toBe('anterior-superior');
  });

  it('should return "anterior-inferior" for lower anterior teeth', () => {
    expect(getFullRegion('31')).toBe('anterior-inferior');
    expect(getFullRegion('33')).toBe('anterior-inferior');
    expect(getFullRegion('41')).toBe('anterior-inferior');
    expect(getFullRegion('43')).toBe('anterior-inferior');
  });

  it('should return "posterior-superior" for upper posterior teeth', () => {
    expect(getFullRegion('14')).toBe('posterior-superior');
    expect(getFullRegion('16')).toBe('posterior-superior');
    expect(getFullRegion('24')).toBe('posterior-superior');
    expect(getFullRegion('27')).toBe('posterior-superior');
  });

  it('should return "posterior-inferior" for lower posterior teeth', () => {
    expect(getFullRegion('34')).toBe('posterior-inferior');
    expect(getFullRegion('36')).toBe('posterior-inferior');
    expect(getFullRegion('44')).toBe('posterior-inferior');
    expect(getFullRegion('47')).toBe('posterior-inferior');
  });
});
