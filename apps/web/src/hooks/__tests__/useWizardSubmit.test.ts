import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  getToothData,
  getToothTreatment,
  normalizeTreatment,
  useWizardSubmit,
} from '../domain/wizard/useWizardSubmit';
import type { UseWizardSubmitParams } from '../domain/wizard/useWizardSubmit';
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
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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
  TIMING: { WIZARD_SUBMIT_DELAY: 0 },
}));

vi.mock('../domain/wizard/helpers', () => ({
  inferCavityClass: vi.fn(() => 'Classe I'),
  getFullRegion: vi.fn(() => 'anterior-superior'),
  getGenericProtocol: vi.fn(() => ({ summary: 'mock protocol' })),
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
    patientPreferences: { whiteningLevel: 'natural', otherGoals: '' },
    toothTreatments: {},
    setStep: vi.fn(),
    clearDraft: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
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
});
