import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDSDIntegration } from '../domain/wizard/useDSDIntegration';
import type { UseDSDIntegrationParams } from '../domain/wizard/useDSDIntegration';
import type { PhotoAnalysisResult, TreatmentType } from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAnalysisResult(
  overrides?: Partial<PhotoAnalysisResult>,
): PhotoAnalysisResult {
  return {
    detected: true,
    confidence: 0.95,
    detected_teeth: [
      {
        tooth: '11',
        tooth_region: 'anterior-superior',
        cavity_class: 'Classe III',
        restoration_size: 'Média',
        substrate: 'Esmalte e Dentina',
        substrate_condition: 'Saudável',
        enamel_condition: 'Íntegro',
        depth: 'Média',
        priority: 'alta',
        notes: null,
        treatment_indication: 'resina',
        indication_reason: 'Cavidade',
      },
    ],
    primary_tooth: '11',
    vita_shade: 'A2',
    observations: ['Observation 1'],
    warnings: [],
    ...overrides,
  };
}

function makeDSDResult(overrides?: Partial<DSDResult>): DSDResult {
  return {
    analysis: {
      facial_midline: 'centrada',
      dental_midline: 'alinhada',
      smile_line: 'média',
      buccal_corridor: 'adequado',
      occlusal_plane: 'nivelado',
      golden_ratio_compliance: 85,
      symmetry_score: 90,
      suggestions: [],
      observations: ['Sorriso harmonioso'],
      confidence: 'alta',
    },
    simulation_url: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParams(
  overrides?: Partial<UseDSDIntegrationParams>,
): UseDSDIntegrationParams {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDSDIntegration', () => {
  describe('handleDSDComplete', () => {
    it('should set DSD result and advance to step 5', () => {
      const setDsdResult = vi.fn();
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setDsdResult, setStep })),
      );

      const dsdResult = makeDSDResult();
      act(() => result.current.handleDSDComplete(dsdResult));

      expect(setDsdResult).toHaveBeenCalledWith(dsdResult);
      expect(setStep).toHaveBeenCalledWith(5);
    });

    it('should merge DSD teeth into analysis result', () => {
      const analysisResult = makeAnalysisResult();
      const setAnalysisResult = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setAnalysisResult }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '21',
              current_issue: 'Diastema',
              proposed_change: 'Fechamento com resina',
              treatment_indication: 'resina',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // setAnalysisResult should have been called to add tooth 21
      expect(setAnalysisResult).toHaveBeenCalled();
      const setterFn = setAnalysisResult.mock.calls[0][0];
      const updated = setterFn(analysisResult);
      expect(updated.detected_teeth).toHaveLength(2);
      // Teeth should be sorted numerically
      expect(updated.detected_teeth[0].tooth).toBe('11');
      expect(updated.detected_teeth[1].tooth).toBe('21');
    });

    it('should not duplicate teeth already in analysis', () => {
      const analysisResult = makeAnalysisResult();
      const setAnalysisResult = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setAnalysisResult }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '11', // Already exists in analysis
              current_issue: 'Issue',
              proposed_change: 'Change',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // setAnalysisResult should NOT have been called since no new teeth to add
      expect(setAnalysisResult).not.toHaveBeenCalled();
    });

    it('should override treatment types from DSD when not resina', () => {
      const analysisResult = makeAnalysisResult();
      const setToothTreatments = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setToothTreatments }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '11',
              current_issue: 'Desgaste',
              proposed_change: 'Faceta',
              treatment_indication: 'porcelana',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // setToothTreatments should be called (tooth 11 was resina, DSD says porcelana)
      expect(setToothTreatments).toHaveBeenCalled();
      const setterFn = setToothTreatments.mock.calls[0][0];
      const updated = setterFn({ '11': 'resina' });
      expect(updated['11']).toBe('porcelana');
    });

    it('should not override treatment when DSD suggests resina', () => {
      const analysisResult = makeAnalysisResult();
      const setToothTreatments = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setToothTreatments }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '11',
              current_issue: 'Cavidade',
              proposed_change: 'Restaurar',
              treatment_indication: 'resina',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // setToothTreatments IS called but should not change the value
      expect(setToothTreatments).toHaveBeenCalled();
      const setterFn = setToothTreatments.mock.calls[0][0];
      const updated = setterFn({ '11': 'porcelana' });
      // Existing non-resina treatment should be kept
      expect(updated['11']).toBe('porcelana');
    });

    it('should auto-add gengivoplasty from DSD layers', async () => {
      const { toast } = await import('sonner');
      const setSelectedTeeth = vi.fn();
      const setToothTreatments = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ setSelectedTeeth, setToothTreatments }),
        ),
      );

      const dsdResult = makeDSDResult({
        layers: [
          {
            type: 'complete-treatment',
            label: 'Tratamento completo',
            simulation_url: null,
            whitening_level: 'natural',
            includes_gengivoplasty: true,
          },
        ],
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // Should add GENGIVO tooth
      expect(setSelectedTeeth).toHaveBeenCalled();
      const teethSetterFn = setSelectedTeeth.mock.calls[0][0];
      const updatedTeeth = teethSetterFn(['11', '12']);
      expect(updatedTeeth).toContain('GENGIVO');

      // Should set gengivoplasty treatment
      expect(setToothTreatments).toHaveBeenCalled();
      const treatmentSetterFn = setToothTreatments.mock.calls[0][0];
      const updatedTreatments = treatmentSetterFn({});
      expect(updatedTreatments['GENGIVO']).toBe('gengivoplastia');

      expect(toast.info).toHaveBeenCalledWith(
        'toasts.wizard.gingivoplastyAdded',
      );
    });

    it('should auto-add gengivoplasty from DSD suggestions', async () => {
      const { toast } = await import('sonner');
      const setSelectedTeeth = vi.fn();
      const setToothTreatments = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ setSelectedTeeth, setToothTreatments }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '11',
              current_issue: 'Excesso gengival',
              proposed_change: 'Gengivoplastia para harmonização',
              treatment_indication: 'gengivoplastia',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      expect(setSelectedTeeth).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalled();
    });

    it('should not duplicate GENGIVO if already in selected teeth', () => {
      const setSelectedTeeth = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setSelectedTeeth })),
      );

      const dsdResult = makeDSDResult({
        layers: [
          {
            type: 'complete-treatment',
            label: 'Completo',
            simulation_url: null,
            whitening_level: 'natural',
            includes_gengivoplasty: true,
          },
        ],
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      const teethSetterFn = setSelectedTeeth.mock.calls[0][0];
      const updatedTeeth = teethSetterFn(['11', 'GENGIVO']);
      // Should not add duplicate
      const gengivoCount = updatedTeeth.filter((t: string) => t === 'GENGIVO').length;
      expect(gengivoCount).toBe(1);
    });

    it('should skip gengivoplasty suggestions when merging DSD teeth', () => {
      const analysisResult = makeAnalysisResult();
      const setAnalysisResult = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setAnalysisResult }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '21',
              current_issue: 'Excesso gengival',
              proposed_change: 'Gengivoplastia bilateral',
              treatment_indication: 'gengivoplastia',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      // Should NOT add tooth 21 as a clinical tooth (it's a gengival procedure)
      expect(setAnalysisResult).not.toHaveBeenCalled();
    });

    it('should sort DSD teeth numerically when merging', () => {
      const analysisResult = makeAnalysisResult({
        detected_teeth: [
          {
            tooth: '21',
            tooth_region: 'anterior-superior',
            cavity_class: null,
            restoration_size: null,
            substrate: null,
            substrate_condition: null,
            enamel_condition: null,
            depth: null,
            priority: 'alta',
            notes: null,
            treatment_indication: 'resina',
            indication_reason: null,
          },
        ],
      });
      const setAnalysisResult = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setAnalysisResult }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '11',
              current_issue: 'Issue',
              proposed_change: 'Change',
              treatment_indication: 'porcelana',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      expect(setAnalysisResult).toHaveBeenCalled();
      const setterFn = setAnalysisResult.mock.calls[0][0];
      const updated = setterFn(analysisResult);
      // 11 should come before 21
      expect(updated.detected_teeth[0].tooth).toBe('11');
      expect(updated.detected_teeth[1].tooth).toBe('21');
    });

    it('should set correct tooth_region based on tooth number', () => {
      const analysisResult = makeAnalysisResult();
      const setAnalysisResult = vi.fn();

      const { result } = renderHook(() =>
        useDSDIntegration(
          createParams({ analysisResult, setAnalysisResult }),
        ),
      );

      const dsdResult = makeDSDResult({
        analysis: {
          ...makeDSDResult().analysis,
          suggestions: [
            {
              tooth: '36', // Lower posterior
              current_issue: 'Cárie',
              proposed_change: 'Restauração',
              treatment_indication: 'resina',
            },
          ],
        },
      });

      act(() => result.current.handleDSDComplete(dsdResult));

      expect(setAnalysisResult).toHaveBeenCalled();
      const setterFn = setAnalysisResult.mock.calls[0][0];
      const updated = setterFn(analysisResult);
      const tooth36 = updated.detected_teeth.find(
        (t: { tooth: string }) => t.tooth === '36',
      );
      expect(tooth36?.tooth_region).toBe('posterior-inferior');
    });

    it('should handle null DSD result', () => {
      const setDsdResult = vi.fn();
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setDsdResult, setStep })),
      );

      act(() => result.current.handleDSDComplete(null));

      expect(setDsdResult).toHaveBeenCalledWith(null);
      expect(setStep).toHaveBeenCalledWith(5);
    });
  });

  describe('handleDSDSkip', () => {
    it('should set DSD result to null and advance to step 5', () => {
      const setDsdResult = vi.fn();
      const setStep = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setDsdResult, setStep })),
      );

      act(() => result.current.handleDSDSkip());

      expect(setDsdResult).toHaveBeenCalledWith(null);
      expect(setStep).toHaveBeenCalledWith(5);
    });
  });

  describe('handleDSDResultChange', () => {
    it('should update DSD result for auto-save', () => {
      const setDsdResult = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setDsdResult })),
      );

      const dsdResult = makeDSDResult();
      act(() => result.current.handleDSDResultChange(dsdResult));

      expect(setDsdResult).toHaveBeenCalledWith(dsdResult);
    });

    it('should handle null result', () => {
      const setDsdResult = vi.fn();
      const { result } = renderHook(() =>
        useDSDIntegration(createParams({ setDsdResult })),
      );

      act(() => result.current.handleDSDResultChange(null));

      expect(setDsdResult).toHaveBeenCalledWith(null);
    });
  });
});
