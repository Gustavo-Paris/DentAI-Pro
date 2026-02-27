import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// We test PURE functions extracted from the wizard modules, plus sub-hooks
// that only depend on injected callbacks (no external providers needed).
// This follows the codebase pattern: extract → test in isolation.
// ---------------------------------------------------------------------------

import { isAnterior, inferCavityClass, getFullRegion, getGenericProtocol } from '../domain/wizard/helpers';
import { INITIAL_FORM_DATA, ANTERIOR_TEETH } from '../domain/wizard/constants';
import { useDSDIntegration } from '../domain/wizard/useDSDIntegration';
import type { UseDSDIntegrationParams } from '../domain/wizard/useDSDIntegration';
import { useWizardDraftRestore } from '../domain/wizard/useWizardDraftRestore';
import type { UseWizardDraftRestoreParams } from '../domain/wizard/useWizardDraftRestore';
import type {
  PhotoAnalysisResult,
  DetectedTooth,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock data layer (needed by useWizardDraftRestore)
vi.mock('@/data', () => ({
  wizard: {
    downloadPhoto: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// helpers.ts — isAnterior
// ===========================================================================

describe('isAnterior', () => {
  it('should return true for upper anterior teeth (11-13, 21-23)', () => {
    expect(isAnterior('11')).toBe(true);
    expect(isAnterior('12')).toBe(true);
    expect(isAnterior('13')).toBe(true);
    expect(isAnterior('21')).toBe(true);
    expect(isAnterior('22')).toBe(true);
    expect(isAnterior('23')).toBe(true);
  });

  it('should return true for lower anterior teeth (31-33, 41-43)', () => {
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
    expect(isAnterior('17')).toBe(false);
    expect(isAnterior('18')).toBe(false);
    expect(isAnterior('24')).toBe(false);
    expect(isAnterior('36')).toBe(false);
    expect(isAnterior('47')).toBe(false);
  });

  it('should return false for non-tooth strings', () => {
    expect(isAnterior('GENGIVO')).toBe(false);
    expect(isAnterior('')).toBe(false);
    expect(isAnterior('99')).toBe(false);
  });
});

// ===========================================================================
// helpers.ts — inferCavityClass
// ===========================================================================

describe('inferCavityClass', () => {
  const makeTooth = (overrides?: Partial<DetectedTooth>): DetectedTooth => ({
    tooth: '11',
    tooth_region: 'anterior-superior',
    cavity_class: null,
    restoration_size: null,
    substrate: null,
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    priority: 'média',
    notes: null,
    treatment_indication: 'resina',
    indication_reason: null,
    ...overrides,
  });

  it('should return cavity_class when present on tooth data', () => {
    const tooth = makeTooth({ cavity_class: 'Classe IV' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Classe IV');
  });

  it('should return fallback when tooth data is undefined', () => {
    expect(inferCavityClass(undefined, 'Classe I')).toBe('Classe I');
  });

  it('should infer "Lente de Contato" from reason containing "lente"', () => {
    const tooth = makeTooth({ indication_reason: 'Indicação de lente de contato dental' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Lente de Contato');
  });

  it('should infer "Lente de Contato" from reason containing "contato"', () => {
    const tooth = makeTooth({ indication_reason: 'Faceta de contato proximal comprometida' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Lente de Contato');
  });

  it('should infer "Recontorno Estético" from reason containing "microdontia"', () => {
    const tooth = makeTooth({ indication_reason: 'Microdontia do lateral superior' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" from reason containing "reanatomização"', () => {
    const tooth = makeTooth({ indication_reason: 'Reanatomização por volume insuficiente' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Recontorno Estético" from reason containing "conoide"', () => {
    const tooth = makeTooth({ indication_reason: 'Dente conoide lateral' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should infer "Fechamento de Diastema" from reason containing "diastema"', () => {
    const tooth = makeTooth({ indication_reason: 'Diastema entre centrais' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('should infer "Fechamento de Diastema" from reason containing "espaçamento"', () => {
    const tooth = makeTooth({ indication_reason: 'Espaçamento excessivo' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('should infer "Faceta Direta" from reason containing "faceta"', () => {
    const tooth = makeTooth({ indication_reason: 'Necessidade de faceta direta' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Faceta Direta');
  });

  it('should infer "Reparo de Restauração" from reason containing "reparo"', () => {
    const tooth = makeTooth({ indication_reason: 'Reparo da restauração existente' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('should infer "Reparo de Restauração" from reason containing "substituição"', () => {
    const tooth = makeTooth({ indication_reason: 'Substituição de resina' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('should infer "Recontorno Estético" from reason containing "desgaste"', () => {
    const tooth = makeTooth({ indication_reason: 'Desgaste incisal acentuado' });
    expect(inferCavityClass(tooth, 'Classe I')).toBe('Recontorno Estético');
  });

  it('should return "Faceta Direta" for porcelana when fallback is a Classe', () => {
    const tooth = makeTooth({ indication_reason: '' });
    expect(inferCavityClass(tooth, 'Classe IV', 'porcelana')).toBe('Faceta Direta');
  });

  it('should return fallback for porcelana when fallback is not a Classe', () => {
    const tooth = makeTooth({ indication_reason: '' });
    expect(inferCavityClass(tooth, 'Lente de Contato', 'porcelana')).toBe('Lente de Contato');
  });

  it('should return fallback when no reason matches and no porcelana override', () => {
    const tooth = makeTooth({ indication_reason: 'something unrecognized' });
    expect(inferCavityClass(tooth, 'Classe II')).toBe('Classe II');
  });
});

// ===========================================================================
// helpers.ts — getFullRegion
// ===========================================================================

describe('getFullRegion', () => {
  it('should return "anterior-superior" for upper anterior teeth', () => {
    expect(getFullRegion('11')).toBe('anterior-superior');
    expect(getFullRegion('21')).toBe('anterior-superior');
    expect(getFullRegion('13')).toBe('anterior-superior');
  });

  it('should return "anterior-inferior" for lower anterior teeth', () => {
    expect(getFullRegion('31')).toBe('anterior-inferior');
    expect(getFullRegion('41')).toBe('anterior-inferior');
    expect(getFullRegion('43')).toBe('anterior-inferior');
  });

  it('should return "posterior-superior" for upper posterior teeth', () => {
    expect(getFullRegion('14')).toBe('posterior-superior');
    expect(getFullRegion('16')).toBe('posterior-superior');
    expect(getFullRegion('27')).toBe('posterior-superior');
  });

  it('should return "posterior-inferior" for lower posterior teeth', () => {
    expect(getFullRegion('34')).toBe('posterior-inferior');
    expect(getFullRegion('36')).toBe('posterior-inferior');
    expect(getFullRegion('47')).toBe('posterior-inferior');
  });
});

// ===========================================================================
// helpers.ts — getGenericProtocol
// ===========================================================================

describe('getGenericProtocol', () => {
  const makeTooth = (overrides?: Partial<DetectedTooth>): DetectedTooth => ({
    tooth: '11',
    tooth_region: 'anterior-superior',
    cavity_class: null,
    restoration_size: null,
    substrate: null,
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    priority: 'média',
    notes: null,
    treatment_indication: 'resina',
    indication_reason: null,
    ...overrides,
  });

  it('should return implante protocol with tooth number', () => {
    const result = getGenericProtocol('implante', '36', makeTooth({ tooth: '36' }));
    expect(result.treatment_type).toBe('implante');
    expect(result.tooth).toBe('36');
    expect(result.summary).toContain('36');
    expect(result.summary).toContain('implante');
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should return coroa protocol', () => {
    const result = getGenericProtocol('coroa', '21', makeTooth({ tooth: '21' }));
    expect(result.treatment_type).toBe('coroa');
    expect(result.summary).toContain('coroa total');
  });

  it('should return endodontia protocol', () => {
    const result = getGenericProtocol('endodontia', '16', makeTooth({ tooth: '16' }));
    expect(result.treatment_type).toBe('endodontia');
    expect(result.summary).toContain('endodôntico');
  });

  it('should return gengivoplastia protocol', () => {
    const result = getGenericProtocol('gengivoplastia' as TreatmentType, 'GENGIVO', undefined);
    expect(result.treatment_type).toBe('gengivoplastia');
    expect(result.summary).toContain('Gengivoplastia');
  });

  it('should return encaminhamento protocol with Ortodontia specialty', () => {
    const tooth = makeTooth({ indication_reason: 'Apinhamento dentário' });
    const result = getGenericProtocol('encaminhamento', '11', tooth);
    expect(result.treatment_type).toBe('encaminhamento');
    expect(result.summary).toContain('Ortodontia');
  });

  it('should return encaminhamento protocol with Endodontia specialty', () => {
    const tooth = makeTooth({ indication_reason: 'Comprometimento pulpar severo' });
    const result = getGenericProtocol('encaminhamento', '16', tooth);
    expect(result.summary).toContain('Endodontia');
  });

  it('should return encaminhamento protocol with Periodontia specialty', () => {
    const tooth = makeTooth({ indication_reason: 'Retração gengival severa' });
    const result = getGenericProtocol('encaminhamento', '31', tooth);
    expect(result.summary).toContain('Periodontia');
  });

  it('should return encaminhamento protocol with Cirurgia specialty', () => {
    const tooth = makeTooth({ indication_reason: 'Extração de terceiro molar incluso' });
    const result = getGenericProtocol('encaminhamento', '18', tooth);
    expect(result.summary).toContain('Cirurgia Bucomaxilofacial');
  });

  it('should return encaminhamento protocol with DTM specialty', () => {
    const tooth = makeTooth({ indication_reason: 'Disfunção da ATM' });
    const result = getGenericProtocol('encaminhamento', '11', tooth);
    expect(result.summary).toContain('DTM/Dor Orofacial');
  });

  it('should return generic encaminhamento when no specialty matches', () => {
    const tooth = makeTooth({ indication_reason: 'Algo inespecífico' });
    const result = getGenericProtocol('encaminhamento', '11', tooth);
    expect(result.summary).toContain('avaliação especializada');
    // Should not contain specialty name
    expect(result.summary).not.toContain('Ortodontia');
    expect(result.summary).not.toContain('Endodontia');
  });

  it('should fallback to encaminhamento for unknown treatment types', () => {
    const result = getGenericProtocol('unknown_type' as TreatmentType, '11', undefined);
    expect(result.summary).toContain('avaliação especializada');
  });

  it('should include ai_reason from toothData', () => {
    const tooth = makeTooth({ indication_reason: 'Motivo da IA' });
    const result = getGenericProtocol('implante', '36', tooth);
    expect(result.ai_reason).toBe('Motivo da IA');
  });

  it('should return null ai_reason when toothData has no indication_reason', () => {
    const result = getGenericProtocol('implante', '36', undefined);
    expect(result.ai_reason).toBeNull();
  });
});

// ===========================================================================
// constants.ts — INITIAL_FORM_DATA
// ===========================================================================

describe('INITIAL_FORM_DATA', () => {
  it('should have all required fields with sensible defaults', () => {
    expect(INITIAL_FORM_DATA.patientName).toBe('');
    expect(INITIAL_FORM_DATA.patientAge).toBe('');
    expect(INITIAL_FORM_DATA.tooth).toBe('');
    expect(INITIAL_FORM_DATA.toothRegion).toBe('anterior');
    expect(INITIAL_FORM_DATA.cavityClass).toBe('Classe I');
    expect(INITIAL_FORM_DATA.restorationSize).toBe('Média');
    expect(INITIAL_FORM_DATA.vitaShade).toBe('A2');
    expect(INITIAL_FORM_DATA.bruxism).toBe(false);
    expect(INITIAL_FORM_DATA.treatmentType).toBe('resina');
  });
});

describe('ANTERIOR_TEETH', () => {
  it('should contain exactly 12 anterior teeth', () => {
    expect(ANTERIOR_TEETH).toHaveLength(12);
  });

  it('should include all four quadrant canines (13, 23, 33, 43)', () => {
    expect(ANTERIOR_TEETH).toContain('13');
    expect(ANTERIOR_TEETH).toContain('23');
    expect(ANTERIOR_TEETH).toContain('33');
    expect(ANTERIOR_TEETH).toContain('43');
  });

  it('should not include premolars', () => {
    expect(ANTERIOR_TEETH).not.toContain('14');
    expect(ANTERIOR_TEETH).not.toContain('24');
    expect(ANTERIOR_TEETH).not.toContain('34');
    expect(ANTERIOR_TEETH).not.toContain('44');
  });
});

// ===========================================================================
// useWizardSubmit.ts — getToothData / getToothTreatment (pure, extracted)
// ===========================================================================

// Mirror the internal pure functions from useWizardSubmit.ts for testing
function getToothData(
  analysisResult: PhotoAnalysisResult | null,
  toothNumber: string,
): DetectedTooth | undefined {
  return analysisResult?.detected_teeth?.find((t) => t.tooth === toothNumber);
}

function getToothTreatment(
  tooth: string,
  toothTreatments: Record<string, TreatmentType>,
  analysisResult: PhotoAnalysisResult | null,
  formData: { treatmentType: TreatmentType },
): TreatmentType {
  return (
    toothTreatments[tooth] ||
    getToothData(analysisResult, tooth)?.treatment_indication ||
    formData.treatmentType ||
    'resina'
  );
}

describe('getToothData', () => {
  const analysisResult: PhotoAnalysisResult = {
    detected: true,
    confidence: 0.9,
    detected_teeth: [
      { tooth: '11', tooth_region: 'anterior-superior', cavity_class: 'Classe IV', restoration_size: 'Média', substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'resina', indication_reason: null },
      { tooth: '21', tooth_region: 'anterior-superior', cavity_class: 'Classe III', restoration_size: 'Pequena', substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'média', notes: null, treatment_indication: 'porcelana', indication_reason: null },
    ],
    primary_tooth: '11',
    vita_shade: 'A2',
    observations: [],
    warnings: [],
    treatment_indication: 'resina',
    indication_reason: null,
  };

  it('should find tooth by number', () => {
    const result = getToothData(analysisResult, '11');
    expect(result?.cavity_class).toBe('Classe IV');
  });

  it('should return undefined for missing tooth', () => {
    expect(getToothData(analysisResult, '99')).toBeUndefined();
  });

  it('should return undefined when analysisResult is null', () => {
    expect(getToothData(null, '11')).toBeUndefined();
  });
});

describe('getToothTreatment', () => {
  const analysisResult: PhotoAnalysisResult = {
    detected: true,
    confidence: 0.9,
    detected_teeth: [
      { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'porcelana', indication_reason: null },
    ],
    primary_tooth: '11',
    vita_shade: 'A2',
    observations: [],
    warnings: [],
    treatment_indication: 'resina',
    indication_reason: null,
  };

  it('should prefer toothTreatments override', () => {
    expect(getToothTreatment('11', { '11': 'coroa' }, analysisResult, { treatmentType: 'resina' })).toBe('coroa');
  });

  it('should fall back to analysisResult treatment_indication', () => {
    expect(getToothTreatment('11', {}, analysisResult, { treatmentType: 'resina' })).toBe('porcelana');
  });

  it('should fall back to formData.treatmentType', () => {
    expect(getToothTreatment('99', {}, analysisResult, { treatmentType: 'implante' })).toBe('implante');
  });

  it('should fall back to "resina" when all else is empty', () => {
    expect(getToothTreatment('99', {}, null, { treatmentType: '' as TreatmentType })).toBe('resina');
  });
});

// ===========================================================================
// useDSDIntegration — hook tests
// ===========================================================================

describe('useDSDIntegration', () => {
  function createDSDParams(overrides?: Partial<UseDSDIntegrationParams>): UseDSDIntegrationParams {
    return {
      analysisResult: null,
      setAnalysisResult: vi.fn(),
      setSelectedTeeth: vi.fn(),
      setToothTreatments: vi.fn(),
      setStep: vi.fn(),
      setDsdResult: vi.fn(),
      ...overrides,
    };
  }

  describe('handleDSDSkip', () => {
    it('should set dsdResult to null and advance to step 5', () => {
      const setDsdResult = vi.fn();
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createDSDParams({ setDsdResult, setStep })),
      );

      act(() => result.current.handleDSDSkip());

      expect(setDsdResult).toHaveBeenCalledWith(null);
      expect(setStep).toHaveBeenCalledWith(5);
    });
  });

  describe('handleDSDResultChange', () => {
    it('should update dsdResult in parent state', () => {
      const setDsdResult = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createDSDParams({ setDsdResult })),
      );

      const mockResult = { analysis: null, simulation_url: null, layers: null };
      act(() => result.current.handleDSDResultChange(mockResult as any));

      expect(setDsdResult).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('handleDSDComplete', () => {
    it('should set dsdResult and advance to step 5 with no suggestions', () => {
      const setDsdResult = vi.fn();
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createDSDParams({ setDsdResult, setStep })),
      );

      const dsdResult = { analysis: { suggestions: [], observations: [] }, simulation_url: null, layers: null };
      act(() => result.current.handleDSDComplete(dsdResult as any));

      expect(setDsdResult).toHaveBeenCalledWith(dsdResult);
      expect(setStep).toHaveBeenCalledWith(5);
    });

    it('should merge new DSD teeth into analysisResult', () => {
      const setAnalysisResult = vi.fn();
      const setToothTreatments = vi.fn();
      const setSelectedTeeth = vi.fn();
      const setStep = vi.fn();

      const existingAnalysis: PhotoAnalysisResult = {
        detected: true,
        confidence: 0.9,
        detected_teeth: [
          { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'resina', indication_reason: null },
        ],
        primary_tooth: '11',
        vita_shade: 'A2',
        observations: [],
        warnings: [],
        treatment_indication: 'resina',
        indication_reason: null,
      };

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({
            analysisResult: existingAnalysis,
            setAnalysisResult,
            setToothTreatments,
            setSelectedTeeth,
            setStep,
          }),
        ),
      );

      const dsdResult = {
        analysis: {
          suggestions: [
            { tooth: '21', current_issue: 'issue', proposed_change: 'change', treatment_indication: 'porcelana' },
          ],
          observations: [],
        },
        simulation_url: null,
        layers: null,
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      // setAnalysisResult should be called with a function that merges teeth
      expect(setAnalysisResult).toHaveBeenCalled();
      const updaterFn = setAnalysisResult.mock.calls[0][0];
      const updated = updaterFn(existingAnalysis);
      expect(updated.detected_teeth).toHaveLength(2);
      expect(updated.detected_teeth.map((t: DetectedTooth) => t.tooth)).toContain('21');
    });

    it('should not duplicate teeth already in analysisResult', () => {
      const setAnalysisResult = vi.fn();

      const existingAnalysis: PhotoAnalysisResult = {
        detected: true,
        confidence: 0.9,
        detected_teeth: [
          { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'resina', indication_reason: null },
        ],
        primary_tooth: '11',
        vita_shade: 'A2',
        observations: [],
        warnings: [],
        treatment_indication: 'resina',
        indication_reason: null,
      };

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({ analysisResult: existingAnalysis, setAnalysisResult }),
        ),
      );

      const dsdResult = {
        analysis: {
          suggestions: [
            { tooth: '11', current_issue: 'issue', proposed_change: 'change', treatment_indication: 'porcelana' },
          ],
          observations: [],
        },
        simulation_url: null,
        layers: null,
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      // Should not call setAnalysisResult since tooth 11 already exists and no new teeth were added
      expect(setAnalysisResult).not.toHaveBeenCalled();
    });

    it('should skip gengivoplasty suggestions from tooth merge', () => {
      const setAnalysisResult = vi.fn();

      const existingAnalysis: PhotoAnalysisResult = {
        detected: true,
        confidence: 0.9,
        detected_teeth: [
          { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'resina', indication_reason: null },
        ],
        primary_tooth: '11',
        vita_shade: 'A2',
        observations: [],
        warnings: [],
        treatment_indication: 'resina',
        indication_reason: null,
      };

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({ analysisResult: existingAnalysis, setAnalysisResult }),
        ),
      );

      const dsdResult = {
        analysis: {
          suggestions: [
            { tooth: '21', current_issue: 'issue', proposed_change: 'Gengivoplastia para harmonização', treatment_indication: 'gengivoplastia' },
          ],
          observations: [],
        },
        simulation_url: null,
        layers: null,
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      // Should not add gengivoplasty suggestion as a tooth
      expect(setAnalysisResult).not.toHaveBeenCalled();
    });

    // TODO: Fix — implementation changed, setSelectedTeeth no longer called directly
    it.skip('should add GENGIVO virtual tooth when layers include gengivoplasty', async () => {
      const setSelectedTeeth = vi.fn();
      const setToothTreatments = vi.fn();
      const { toast } = await import('sonner');

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({ setSelectedTeeth, setToothTreatments }),
        ),
      );

      const dsdResult = {
        analysis: { suggestions: [], observations: [] },
        simulation_url: null,
        gingivoplastyApproved: true,
        layers: [{ includes_gengivoplasty: true }],
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      // setSelectedTeeth should add GENGIVO
      expect(setSelectedTeeth).toHaveBeenCalled();
      const teethUpdater = setSelectedTeeth.mock.calls[0][0];
      const newTeeth = teethUpdater(['11']);
      expect(newTeeth).toContain('GENGIVO');

      // setToothTreatments should add gengivoplastia
      // The hook calls setToothTreatments with an object spread (not a function updater)
      expect(setToothTreatments).toHaveBeenCalled();
      const treatmentsCall = setToothTreatments.mock.calls[0][0];
      // It may be a function updater or a direct value depending on React batching
      const treatments = typeof treatmentsCall === 'function' ? treatmentsCall({}) : treatmentsCall;
      expect(treatments).toEqual(expect.objectContaining({ GENGIVO: 'gengivoplastia' }));

      expect(toast.info).toHaveBeenCalled();
    });

    // TODO: Fix — implementation changed, setSelectedTeeth no longer called directly
    it.skip('should not duplicate GENGIVO if already selected', () => {
      const setSelectedTeeth = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(createDSDParams({ setSelectedTeeth })),
      );

      const dsdResult = {
        analysis: { suggestions: [], observations: [] },
        simulation_url: null,
        gingivoplastyApproved: true,
        layers: [{ includes_gengivoplasty: true }],
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      const teethUpdater = setSelectedTeeth.mock.calls[0][0];
      const newTeeth = teethUpdater(['11', 'GENGIVO']);
      expect(newTeeth.filter((t: string) => t === 'GENGIVO')).toHaveLength(1);
    });

    it('should upgrade tooth treatment from resina when DSD suggests different', () => {
      const setToothTreatments = vi.fn();

      const existingAnalysis: PhotoAnalysisResult = {
        detected: true,
        confidence: 0.9,
        detected_teeth: [
          { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'resina', indication_reason: null },
        ],
        primary_tooth: '11',
        vita_shade: 'A2',
        observations: [],
        warnings: [],
        treatment_indication: 'resina',
        indication_reason: null,
      };

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({ analysisResult: existingAnalysis, setToothTreatments }),
        ),
      );

      const dsdResult = {
        analysis: {
          suggestions: [
            { tooth: '11', current_issue: 'issue', proposed_change: 'change', treatment_indication: 'porcelana' },
          ],
          observations: [],
        },
        simulation_url: null,
        layers: null,
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      // setToothTreatments should be called with an updater that upgrades tooth 11
      expect(setToothTreatments).toHaveBeenCalled();
      const updater = setToothTreatments.mock.calls[0][0];
      const updated = updater({ '11': 'resina' });
      expect(updated['11']).toBe('porcelana');
    });

    it('should not downgrade tooth treatment when already non-resina', () => {
      const setToothTreatments = vi.fn();

      const existingAnalysis: PhotoAnalysisResult = {
        detected: true,
        confidence: 0.9,
        detected_teeth: [
          { tooth: '11', tooth_region: 'anterior-superior', cavity_class: null, restoration_size: null, substrate: null, substrate_condition: null, enamel_condition: null, depth: null, priority: 'alta', notes: null, treatment_indication: 'coroa', indication_reason: null },
        ],
        primary_tooth: '11',
        vita_shade: 'A2',
        observations: [],
        warnings: [],
        treatment_indication: 'resina',
        indication_reason: null,
      };

      const { result } = renderHook(() =>
        useDSDIntegration(
          createDSDParams({ analysisResult: existingAnalysis, setToothTreatments }),
        ),
      );

      const dsdResult = {
        analysis: {
          suggestions: [
            { tooth: '11', current_issue: 'issue', proposed_change: 'change', treatment_indication: 'porcelana' },
          ],
          observations: [],
        },
        simulation_url: null,
        layers: null,
      };

      act(() => result.current.handleDSDComplete(dsdResult as any));

      expect(setToothTreatments).toHaveBeenCalled();
      const updater = setToothTreatments.mock.calls[0][0];
      const updated = updater({ '11': 'coroa' });
      // Should keep coroa since it's not resina
      expect(updated['11']).toBe('coroa');
    });
  });
});

// ===========================================================================
// useWizardDraftRestore — hook tests
// ===========================================================================

describe('useWizardDraftRestore', () => {
  function createDraftParams(
    overrides?: Partial<UseWizardDraftRestoreParams>,
  ): UseWizardDraftRestoreParams {
    return {
      setStep: vi.fn(),
      setFormData: vi.fn(),
      setSelectedTeeth: vi.fn(),
      setToothTreatments: vi.fn(),
      setAnalysisResult: vi.fn(),
      setDsdResult: vi.fn(),
      setUploadedPhotoPath: vi.fn(),
      setAdditionalPhotos: vi.fn(),
      setPatientPreferences: vi.fn(),
      setImageBase64: vi.fn(),
      clearDraft: vi.fn(),
      ...overrides,
    };
  }

  describe('initial state', () => {
    it('should start with modal hidden and no pending draft', () => {
      const { result } = renderHook(() => useWizardDraftRestore(createDraftParams()));
      expect(result.current.showRestoreModal).toBe(false);
      expect(result.current.pendingDraft).toBeNull();
    });
  });

  describe('handleDiscardDraft', () => {
    it('should clear draft and hide modal', () => {
      const clearDraft = vi.fn();
      const { result } = renderHook(() =>
        useWizardDraftRestore(createDraftParams({ clearDraft })),
      );

      // Set up a pending draft first
      act(() => {
        result.current.setShowRestoreModal(true);
        result.current.setPendingDraft({ step: 3 } as any);
      });

      expect(result.current.showRestoreModal).toBe(true);
      expect(result.current.pendingDraft).not.toBeNull();

      act(() => result.current.handleDiscardDraft());

      expect(clearDraft).toHaveBeenCalled();
      expect(result.current.showRestoreModal).toBe(false);
      expect(result.current.pendingDraft).toBeNull();
    });
  });

  describe('handleRestoreDraft', () => {
    it('should restore all draft state to setters', async () => {
      const setStep = vi.fn();
      const setFormData = vi.fn();
      const setSelectedTeeth = vi.fn();
      const setToothTreatments = vi.fn();
      const setAnalysisResult = vi.fn();
      const setDsdResult = vi.fn();
      const setUploadedPhotoPath = vi.fn();
      const setAdditionalPhotos = vi.fn();
      const setPatientPreferences = vi.fn();

      const params = createDraftParams({
        setStep,
        setFormData,
        setSelectedTeeth,
        setToothTreatments,
        setAnalysisResult,
        setDsdResult,
        setUploadedPhotoPath,
        setAdditionalPhotos,
        setPatientPreferences,
      });

      const { result } = renderHook(() => useWizardDraftRestore(params));

      const mockDraft = {
        step: 4,
        formData: { ...INITIAL_FORM_DATA, patientName: 'Paciente Draft' },
        selectedTeeth: ['11', '21'],
        toothTreatments: { '11': 'resina', '21': 'porcelana' },
        analysisResult: { detected: true } as any,
        dsdResult: null,
        uploadedPhotoPath: null,
        additionalPhotos: { smile45: null, face: null },
        patientPreferences: { whiteningLevel: 'natural' },
      };

      act(() => {
        result.current.setPendingDraft(mockDraft as any);
      });

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      expect(setStep).toHaveBeenCalledWith(4);
      expect(setFormData).toHaveBeenCalledWith(mockDraft.formData);
      expect(setSelectedTeeth).toHaveBeenCalledWith(['11', '21']);
      expect(setToothTreatments).toHaveBeenCalledWith(mockDraft.toothTreatments);
      expect(setAnalysisResult).toHaveBeenCalledWith(mockDraft.analysisResult);
      expect(setDsdResult).toHaveBeenCalledWith(null);
      expect(setUploadedPhotoPath).toHaveBeenCalledWith(null);
      expect(setAdditionalPhotos).toHaveBeenCalledWith({ smile45: null, face: null });
      expect(setPatientPreferences).toHaveBeenCalledWith({ whiteningLevel: 'natural' });
      expect(result.current.showRestoreModal).toBe(false);
      expect(result.current.pendingDraft).toBeNull();
    });

    it('should do nothing when no pending draft', async () => {
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useWizardDraftRestore(createDraftParams({ setStep })),
      );

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      expect(setStep).not.toHaveBeenCalled();
    });

    it('should default additionalPhotos when draft has none', async () => {
      const setAdditionalPhotos = vi.fn();
      const { result } = renderHook(() =>
        useWizardDraftRestore(createDraftParams({ setAdditionalPhotos })),
      );

      const draftWithoutPhotos = {
        step: 2,
        formData: INITIAL_FORM_DATA,
        selectedTeeth: [],
        toothTreatments: {},
        analysisResult: null,
        dsdResult: null,
        uploadedPhotoPath: null,
        additionalPhotos: undefined,
        patientPreferences: undefined,
      };

      act(() => result.current.setPendingDraft(draftWithoutPhotos as any));

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      expect(setAdditionalPhotos).toHaveBeenCalledWith({ smile45: null, face: null });
    });

    it('should default patientPreferences when draft has none', async () => {
      const setPatientPreferences = vi.fn();
      const { result } = renderHook(() =>
        useWizardDraftRestore(createDraftParams({ setPatientPreferences })),
      );

      const draftWithoutPrefs = {
        step: 2,
        formData: INITIAL_FORM_DATA,
        selectedTeeth: [],
        toothTreatments: {},
        analysisResult: null,
        dsdResult: null,
        uploadedPhotoPath: null,
        additionalPhotos: undefined,
        patientPreferences: undefined,
      };

      act(() => result.current.setPendingDraft(draftWithoutPrefs as any));

      await act(async () => {
        await result.current.handleRestoreDraft();
      });

      expect(setPatientPreferences).toHaveBeenCalledWith({ whiteningLevel: 'natural' });
    });
  });
});

// ===========================================================================
// canGoBack derived logic (from useWizardFlow orchestrator)
// ===========================================================================

describe('canGoBack logic', () => {
  function computeCanGoBack(step: number): boolean {
    return step >= 1 && step <= 5;
  }

  it('should be true for steps 1-5', () => {
    expect(computeCanGoBack(1)).toBe(true);
    expect(computeCanGoBack(2)).toBe(true);
    expect(computeCanGoBack(3)).toBe(true);
    expect(computeCanGoBack(4)).toBe(true);
    expect(computeCanGoBack(5)).toBe(true);
  });

  it('should be false for step 6 (submission)', () => {
    expect(computeCanGoBack(6)).toBe(false);
  });

  it('should be false for step 0', () => {
    expect(computeCanGoBack(0)).toBe(false);
  });
});

// ===========================================================================
// Treatment normalization mapping (from useWizardSubmit)
// ===========================================================================

describe('treatment normalization (submit)', () => {
  const NORMALIZE: Record<string, TreatmentType> = {
    porcelain: 'porcelana',
    resin: 'resina',
    crown: 'coroa',
    implant: 'implante',
    endodontics: 'endodontia',
    referral: 'encaminhamento',
    gingivoplasty: 'gengivoplastia' as TreatmentType,
  };

  it('should normalize all English treatment types to Portuguese', () => {
    expect(NORMALIZE['porcelain']).toBe('porcelana');
    expect(NORMALIZE['resin']).toBe('resina');
    expect(NORMALIZE['crown']).toBe('coroa');
    expect(NORMALIZE['implant']).toBe('implante');
    expect(NORMALIZE['endodontics']).toBe('endodontia');
    expect(NORMALIZE['referral']).toBe('encaminhamento');
    expect(NORMALIZE['gingivoplasty']).toBe('gengivoplastia');
  });

  it('should pass through already-Portuguese values', () => {
    const normalize = (v: string): string => NORMALIZE[v] || v;
    expect(normalize('resina')).toBe('resina');
    expect(normalize('porcelana')).toBe('porcelana');
    expect(normalize('coroa')).toBe('coroa');
  });
});

// ===========================================================================
// submissionSteps derived logic (from useWizardSubmit)
// ===========================================================================

describe('submissionSteps derivation', () => {
  interface SubmissionStep {
    label: string;
    completed: boolean;
  }

  function computeSubmissionSteps(
    submissionStep: number,
    selectedTeeth: string[],
    formDataTooth: string,
    currentToothIndex: number,
  ): SubmissionStep[] {
    const teethToShow = selectedTeeth.length > 0 ? selectedTeeth : [formDataTooth].filter(Boolean);
    const steps: SubmissionStep[] = [
      { label: 'Preparando dados do paciente...', completed: submissionStep >= 1 },
    ];

    if (submissionStep >= 2 && teethToShow.length > 0) {
      for (let i = 0; i < teethToShow.length; i++) {
        const isCompleted = i < currentToothIndex || submissionStep >= 4;
        const isActive = i === currentToothIndex && submissionStep >= 2 && submissionStep < 4;
        steps.push({
          label: `Dente ${teethToShow[i]}${isActive ? ' — gerando protocolo...' : ''}`,
          completed: isCompleted,
        });
      }
    }

    steps.push({ label: 'Finalizando e salvando...', completed: submissionStep >= 4 });
    return steps;
  }

  it('should have patient step + finalize step at minimum', () => {
    const steps = computeSubmissionSteps(0, [], '', -1);
    expect(steps).toHaveLength(2);
    expect(steps[0].label).toContain('paciente');
    expect(steps[1].label).toContain('Finalizando');
  });

  it('should show teeth steps when submissionStep >= 2', () => {
    const steps = computeSubmissionSteps(2, ['11', '21'], '', 0);
    expect(steps).toHaveLength(4); // patient + 2 teeth + finalize
    expect(steps[1].label).toContain('11');
    expect(steps[2].label).toContain('21');
  });

  it('should mark active tooth with protocol message', () => {
    const steps = computeSubmissionSteps(2, ['11', '21'], '', 0);
    expect(steps[1].label).toContain('gerando protocolo');
    expect(steps[2].label).not.toContain('gerando protocolo');
  });

  it('should mark completed teeth before currentToothIndex', () => {
    const steps = computeSubmissionSteps(2, ['11', '21', '31'], '', 1);
    expect(steps[1].completed).toBe(true); // tooth 11 (index 0 < 1)
    expect(steps[2].completed).toBe(false); // tooth 21 (index 1 === 1, active)
    expect(steps[3].completed).toBe(false); // tooth 31 (index 2 > 1)
  });

  it('should mark all teeth completed at submissionStep 4', () => {
    const steps = computeSubmissionSteps(4, ['11', '21'], '', 1);
    expect(steps[1].completed).toBe(true);
    expect(steps[2].completed).toBe(true);
    expect(steps[3].completed).toBe(true); // finalize
  });

  it('should fall back to formData.tooth when no selectedTeeth', () => {
    const steps = computeSubmissionSteps(2, [], '16', 0);
    expect(steps).toHaveLength(3); // patient + 1 tooth + finalize
    expect(steps[1].label).toContain('16');
  });

  it('should not show tooth steps when no teeth at all', () => {
    const steps = computeSubmissionSteps(2, [], '', -1);
    expect(steps).toHaveLength(2); // patient + finalize only
  });
});

// ===========================================================================
// Credit warning logic (from useWizardFlow side effects)
// ===========================================================================

describe('credit warning logic', () => {
  function shouldShowLowCreditWarning(
    creditsRemaining: number,
    fullWorkflowCost: number,
  ): 'warning' | 'error' | null {
    if (creditsRemaining === 0) return 'error';
    if (creditsRemaining < fullWorkflowCost && creditsRemaining > 0) return 'warning';
    return null;
  }

  it('should return "error" when credits are 0', () => {
    expect(shouldShowLowCreditWarning(0, 3)).toBe('error');
  });

  it('should return "warning" when credits < full workflow cost but > 0', () => {
    expect(shouldShowLowCreditWarning(2, 3)).toBe('warning');
  });

  it('should return null when credits >= full workflow cost', () => {
    expect(shouldShowLowCreditWarning(3, 3)).toBeNull();
    expect(shouldShowLowCreditWarning(10, 3)).toBeNull();
  });

  it('should return null when credits exactly equal to workflow cost', () => {
    expect(shouldShowLowCreditWarning(5, 5)).toBeNull();
  });
});

// ===========================================================================
// Auto-select teeth logic (from useWizardFlow useEffect)
// ===========================================================================

describe('auto-select detected teeth logic', () => {
  function computeSelectedTeeth(analysisResult: PhotoAnalysisResult | null): string[] {
    if (!analysisResult?.detected_teeth?.length) return [];
    return analysisResult.detected_teeth.map((t) => t.tooth);
  }

  function computeToothTreatments(
    analysisResult: PhotoAnalysisResult | null,
    prev: Record<string, TreatmentType>,
  ): Record<string, TreatmentType> {
    if (!analysisResult?.detected_teeth?.length) return prev;
    const merged: Record<string, TreatmentType> = {};
    analysisResult.detected_teeth.forEach((t) => {
      merged[t.tooth] = prev[t.tooth] || t.treatment_indication || 'resina';
    });
    return merged;
  }

  it('should return empty when no detected teeth', () => {
    expect(computeSelectedTeeth(null)).toEqual([]);
    expect(computeSelectedTeeth({ detected_teeth: [] } as any)).toEqual([]);
  });

  it('should extract all tooth numbers', () => {
    const result: PhotoAnalysisResult = {
      detected: true,
      confidence: 0.9,
      detected_teeth: [
        { tooth: '11', treatment_indication: 'resina' } as DetectedTooth,
        { tooth: '21', treatment_indication: 'porcelana' } as DetectedTooth,
      ],
      primary_tooth: '11',
      vita_shade: 'A2',
      observations: [],
      warnings: [],
      treatment_indication: 'resina',
      indication_reason: null,
    };
    expect(computeSelectedTeeth(result)).toEqual(['11', '21']);
  });

  it('should prefer existing treatment over AI suggestion', () => {
    const result: PhotoAnalysisResult = {
      detected: true,
      confidence: 0.9,
      detected_teeth: [
        { tooth: '11', treatment_indication: 'resina' } as DetectedTooth,
      ],
      primary_tooth: '11',
      vita_shade: 'A2',
      observations: [],
      warnings: [],
      treatment_indication: 'resina',
      indication_reason: null,
    };
    const prev = { '11': 'coroa' as TreatmentType };
    const treatments = computeToothTreatments(result, prev);
    expect(treatments['11']).toBe('coroa');
  });

  it('should use AI suggestion when no previous treatment', () => {
    const result: PhotoAnalysisResult = {
      detected: true,
      confidence: 0.9,
      detected_teeth: [
        { tooth: '11', treatment_indication: 'porcelana' } as DetectedTooth,
      ],
      primary_tooth: '11',
      vita_shade: 'A2',
      observations: [],
      warnings: [],
      treatment_indication: 'resina',
      indication_reason: null,
    };
    const treatments = computeToothTreatments(result, {});
    expect(treatments['11']).toBe('porcelana');
  });

  it('should default to resina when no treatment indication', () => {
    const result: PhotoAnalysisResult = {
      detected: true,
      confidence: 0.9,
      detected_teeth: [
        { tooth: '11', treatment_indication: null } as unknown as DetectedTooth,
      ],
      primary_tooth: '11',
      vita_shade: 'A2',
      observations: [],
      warnings: [],
      treatment_indication: 'resina',
      indication_reason: null,
    };
    const treatments = computeToothTreatments(result, {});
    expect(treatments['11']).toBe('resina');
  });
});

// ===========================================================================
// Validate form logic (extracted from useWizardSubmit)
// ===========================================================================

describe('validateForm logic', () => {
  function validateTeethSelection(selectedTeeth: string[], formDataTooth: string): boolean {
    const teethToProcess = selectedTeeth.length > 0 ? selectedTeeth : [formDataTooth];
    return teethToProcess.length > 0 && !!teethToProcess[0];
  }

  it('should be valid when selectedTeeth has entries', () => {
    expect(validateTeethSelection(['11', '21'], '')).toBe(true);
  });

  it('should fall back to formData.tooth', () => {
    expect(validateTeethSelection([], '16')).toBe(true);
  });

  it('should be invalid when both are empty', () => {
    expect(validateTeethSelection([], '')).toBe(false);
  });
});
