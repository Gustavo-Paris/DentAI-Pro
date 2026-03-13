import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDSDStep } from '../useDSDStep';
import type { DSDStepProps } from '../useDSDStep';
import type { DSDAnalysis, DSDResult } from '@/types/dsd';
import type { PhotoAnalysisResult } from '@/types/wizard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), log: vi.fn() },
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/data/storage', () => ({
  getSignedDSDUrl: vi.fn().mockResolvedValue('https://signed-url'),
}));

vi.mock('@/hooks/useAuthenticatedFetch', () => ({
  useAuthenticatedFetch: () => ({
    invokeFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    canUseCredits: vi.fn(() => true),
    refreshSubscription: vi.fn(),
    getCreditCost: vi.fn(() => 1),
  }),
}));

vi.mock('@/lib/constants', () => ({
  TIMING: { DSD_RETRY_DELAY: 0, WIZARD_SUBMIT_DELAY: 0 },
}));

vi.mock('@/lib/edge-function-errors', () => ({
  classifyEdgeFunctionError: vi.fn(() => 'unknown'),
}));

vi.mock('@/lib/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/compositeGingivo', () => ({
  compositeGengivoplastyLips: vi.fn().mockResolvedValue(null),
}));

// Mock sub-hooks to isolate useDSDStep logic
vi.mock('../useDSDLayerGeneration', () => ({
  useDSDLayerGeneration: vi.fn(() => ({
    layers: [],
    layerUrls: {},
    activeLayerIndex: 0,
    layersGenerating: false,
    layerGenerationProgress: 0,
    failedLayers: [],
    retryingLayer: null,
    isSimulationGenerating: false,
    simulationError: false,
    setLayers: vi.fn(),
    setLayerUrls: vi.fn(),
    setActiveLayerIndex: vi.fn(),
    setSimulationError: vi.fn(),
    setFailedLayers: vi.fn(),
    setRetryingLayer: vi.fn(),
    generateSingleLayer: vi.fn(),
    resolveLayerUrl: vi.fn(),
    generateAllLayers: vi.fn(),
    retryFailedLayer: vi.fn(),
    handleSelectLayer: vi.fn(),
  })),
}));

vi.mock('../useDSDGingivoplasty', () => ({
  useDSDGingivoplasty: vi.fn(() => ({
    gingivoplastyApproved: null,
    getGingivoConfidence: vi.fn(() => 'none'),
    determineLayersNeeded: vi.fn(() => ['restorations-only', 'whitening-restorations']),
    handleApproveGingivoplasty: vi.fn(),
    handleDiscardGingivoplasty: vi.fn(),
  })),
}));

vi.mock('../useDSDWhitening', () => ({
  useDSDWhitening: vi.fn(() => ({
    whiteningComparison: null,
    isComparingWhitening: false,
    showWhiteningComparison: false,
    generateWhiteningComparison: vi.fn(),
    setShowWhiteningComparison: vi.fn(),
    handleSelectWhiteningLevel: vi.fn(),
  })),
}));

vi.mock('../useDSDFaceMockup', () => ({
  useDSDFaceMockup: vi.fn(() => ({
    isFaceMockupGenerating: false,
    faceMockupError: null,
    hasFacePhoto: false,
    generateFaceMockup: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAnalysis(overrides?: Partial<DSDAnalysis>): DSDAnalysis {
  return {
    facial_midline: 'centrada',
    dental_midline: 'alinhada',
    smile_line: 'média',
    buccal_corridor: 'adequado',
    occlusal_plane: 'nivelado',
    golden_ratio_compliance: 80,
    symmetry_score: 85,
    suggestions: [],
    observations: [],
    confidence: 'alta',
    ...overrides,
  };
}

function makeAnalysisResult(overrides?: Partial<PhotoAnalysisResult>): PhotoAnalysisResult {
  return {
    detected: true,
    confidence: 90,
    detected_teeth: [
      {
        tooth: '11',
        tooth_region: 'anterior',
        cavity_class: null,
        restoration_size: null,
        substrate: null,
        substrate_condition: null,
        enamel_condition: null,
        depth: null,
        priority: 'alta',
        notes: null,
        treatment_indication: 'resina',
        indication_reason: 'cárie',
        current_issue: 'Cárie no dente 11',
        proposed_change: 'Restauração em resina composta',
      },
    ],
    primary_tooth: '11',
    vita_shade: 'A2',
    observations: ['Observação de teste'],
    warnings: [],
    ...overrides,
  };
}

function createProps(overrides?: Partial<DSDStepProps>): DSDStepProps {
  return {
    imageBase64: 'data:image/png;base64,test',
    onComplete: vi.fn(),
    onSkip: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Initial state --------------------------------------------------------

describe('useDSDStep initial state', () => {
  it('should start with default state', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
    expect(result.current.simulationImageUrl).toBeNull();
    expect(result.current.isRegeneratingSimulation).toBe(false);
    expect(result.current.isCompositing).toBe(false);
    expect(result.current.dsdConfirmed).toBe(false);
    expect(result.current.showAnnotations).toBe(false);
    expect(result.current.midlineOffset).toBe(0);
    expect(result.current.isMidlineAdjusted).toBe(false);
  });

  it('should initialize with initialResult when provided', () => {
    const initialResult: DSDResult = {
      analysis: makeAnalysis(),
      simulation_url: 'path/to/sim',
    };
    const { result } = renderHook(() =>
      useDSDStep(createProps({ initialResult })),
    );

    expect(result.current.result).toEqual(initialResult);
    expect(result.current.dsdConfirmed).toBe(true);
  });

  it('should pass through imageBase64 and onSkip', () => {
    const onSkip = vi.fn();
    const { result } = renderHook(() =>
      useDSDStep(createProps({ imageBase64: 'test-base64', onSkip })),
    );

    expect(result.current.imageBase64).toBe('test-base64');
    expect(result.current.onSkip).toBe(onSkip);
  });
});

// ---- analysisSteps --------------------------------------------------------

describe('analysisSteps', () => {
  it('should return 4 analysis steps', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    expect(result.current.analysisSteps).toHaveLength(4);
  });

  it('should have labels and durations for each step', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    for (const step of result.current.analysisSteps) {
      expect(step.label).toBeTruthy();
      expect(step.duration).toBeGreaterThan(0);
    }
  });
});

// ---- toothBounds ----------------------------------------------------------

describe('toothBounds', () => {
  it('should return empty array when no detected teeth', () => {
    const { result } = renderHook(() =>
      useDSDStep(createProps({ detectedTeeth: [] })),
    );
    expect(result.current.toothBounds).toEqual([]);
  });

  it('should filter out teeth without bounds', () => {
    const { result } = renderHook(() =>
      useDSDStep(createProps({
        detectedTeeth: [
          { tooth: '11' },
          { tooth: '21', tooth_bounds: { x: 40, y: 30, width: 10, height: 20 } },
        ],
      })),
    );
    expect(result.current.toothBounds).toHaveLength(1);
    expect(result.current.toothBounds[0].tooth).toBe('21');
  });

  it('should filter out invalid bounds', () => {
    const { result } = renderHook(() =>
      useDSDStep(createProps({
        detectedTeeth: [
          { tooth: '11', tooth_bounds: { x: -1, y: 30, width: 10, height: 20 } },
          { tooth: '21', tooth_bounds: { x: 40, y: 30, width: 0, height: 20 } },
          { tooth: '22', tooth_bounds: { x: 40, y: 30, width: 10, height: 20 } },
        ],
      })),
    );
    expect(result.current.toothBounds).toHaveLength(1);
    expect(result.current.toothBounds[0].tooth).toBe('22');
  });

  it('should enforce symmetric consistency for contralateral pairs with large differences', () => {
    const { result } = renderHook(() =>
      useDSDStep(createProps({
        detectedTeeth: [
          { tooth: '11', tooth_bounds: { x: 50, y: 20, width: 10, height: 30 } },
          { tooth: '21', tooth_bounds: { x: 40, y: 30, width: 10, height: 30 } },
        ],
      })),
    );
    // Y differs by 10 (>5), so they should be averaged
    expect(result.current.toothBounds).toHaveLength(2);
    const t11 = result.current.toothBounds.find(b => b.tooth === '11');
    const t21 = result.current.toothBounds.find(b => b.tooth === '21');
    expect(t11!.y).toBe(25); // averaged (20+30)/2
    expect(t21!.y).toBe(25);
  });

  it('should NOT average contralateral pairs with small differences', () => {
    const { result } = renderHook(() =>
      useDSDStep(createProps({
        detectedTeeth: [
          { tooth: '11', tooth_bounds: { x: 50, y: 30, width: 10, height: 20 } },
          { tooth: '21', tooth_bounds: { x: 40, y: 32, width: 10, height: 21 } },
        ],
      })),
    );
    const t11 = result.current.toothBounds.find(b => b.tooth === '11');
    const t21 = result.current.toothBounds.find(b => b.tooth === '21');
    expect(t11!.y).toBe(30);
    expect(t21!.y).toBe(32);
  });
});

// ---- toggleProportionLayer ------------------------------------------------

describe('toggleProportionLayer', () => {
  it('should add a layer', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    expect(result.current.visibleProportionLayers.size).toBe(0);

    act(() => result.current.toggleProportionLayer('golden-ratio'));
    expect(result.current.visibleProportionLayers.has('golden-ratio')).toBe(true);
  });

  it('should remove a layer on second toggle', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));

    act(() => result.current.toggleProportionLayer('golden-ratio'));
    expect(result.current.visibleProportionLayers.has('golden-ratio')).toBe(true);

    act(() => result.current.toggleProportionLayer('golden-ratio'));
    expect(result.current.visibleProportionLayers.has('golden-ratio')).toBe(false);
  });
});

// ---- midline adjustment ---------------------------------------------------

describe('midline adjustment', () => {
  it('should default to 0 offset', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    expect(result.current.midlineOffset).toBe(0);
    expect(result.current.isMidlineAdjusted).toBe(false);
  });

  it('should update midlineOffset', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));

    act(() => result.current.setMidlineOffset(5));
    expect(result.current.midlineOffset).toBe(5);
    expect(result.current.isMidlineAdjusted).toBe(true);
  });

  it('should reset midline to 0', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));

    act(() => result.current.setMidlineOffset(5));
    act(() => result.current.resetMidline());
    expect(result.current.midlineOffset).toBe(0);
    expect(result.current.isMidlineAdjusted).toBe(false);
  });
});

// ---- confirmDSD -----------------------------------------------------------

describe('confirmDSD', () => {
  it('should set dsdConfirmed to true', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    expect(result.current.dsdConfirmed).toBe(false);

    act(() => result.current.confirmDSD());
    expect(result.current.dsdConfirmed).toBe(true);
  });
});

// ---- handleContinue -------------------------------------------------------

describe('handleContinue', () => {
  it('should call onComplete with null result', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useDSDStep(createProps({ onComplete })),
    );

    act(() => result.current.handleContinue());
    expect(onComplete).toHaveBeenCalledWith(null);
  });

  it('should call onComplete with result including gingivoplastyApproved', () => {
    const onComplete = vi.fn();
    const initialResult: DSDResult = {
      analysis: makeAnalysis(),
      simulation_url: 'test',
    };
    const { result } = renderHook(() =>
      useDSDStep(createProps({ onComplete, initialResult })),
    );

    act(() => result.current.handleContinue());
    expect(onComplete).toHaveBeenCalled();
    const calledWith = onComplete.mock.calls[0][0];
    expect(calledWith).toHaveProperty('analysis');
  });
});

// ---- setShowAnnotations ---------------------------------------------------

describe('setShowAnnotations', () => {
  it('should toggle show annotations', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));
    expect(result.current.showAnnotations).toBe(false);

    act(() => result.current.setShowAnnotations(true));
    expect(result.current.showAnnotations).toBe(true);
  });
});

// ---- seeding from analysisResult ------------------------------------------

describe('seeding from analysisResult', () => {
  it('should seed result from unified analysis when no initialResult', async () => {
    const analysisResult = makeAnalysisResult();

    const { result } = renderHook(() =>
      useDSDStep(createProps({ analysisResult })),
    );

    // useEffect runs asynchronously, wait for next tick
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.analysis.smile_line).toBe('média');
    expect(result.current.result!.analysis.suggestions).toHaveLength(1);
  });

  it('should NOT seed when initialResult is already provided', async () => {
    const initialResult: DSDResult = {
      analysis: makeAnalysis({ smile_line: 'alta' }),
      simulation_url: 'existing',
    };

    const { result } = renderHook(() =>
      useDSDStep(createProps({
        initialResult,
        analysisResult: makeAnalysisResult(),
      })),
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    // Should keep the initial result, not override with analysis
    expect(result.current.result!.analysis.smile_line).toBe('alta');
  });
});

// ---- Return shape ---------------------------------------------------------

describe('useDSDStep return shape', () => {
  it('should expose all expected state and actions', () => {
    const { result } = renderHook(() => useDSDStep(createProps()));

    // State
    expect(result.current).toHaveProperty('isAnalyzing');
    expect(result.current).toHaveProperty('currentStep');
    expect(result.current).toHaveProperty('result');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('errorCode');
    expect(result.current).toHaveProperty('simulationImageUrl');
    expect(result.current).toHaveProperty('isRegeneratingSimulation');
    expect(result.current).toHaveProperty('isCompositing');
    expect(result.current).toHaveProperty('isSimulationGenerating');
    expect(result.current).toHaveProperty('simulationError');
    expect(result.current).toHaveProperty('layers');
    expect(result.current).toHaveProperty('layerUrls');
    expect(result.current).toHaveProperty('activeLayerIndex');
    expect(result.current).toHaveProperty('layersGenerating');
    expect(result.current).toHaveProperty('layerGenerationProgress');
    expect(result.current).toHaveProperty('failedLayers');
    expect(result.current).toHaveProperty('retryingLayer');
    expect(result.current).toHaveProperty('whiteningComparison');
    expect(result.current).toHaveProperty('isComparingWhitening');
    expect(result.current).toHaveProperty('showWhiteningComparison');
    expect(result.current).toHaveProperty('gingivoplastyApproved');
    expect(result.current).toHaveProperty('dsdConfirmed');
    expect(result.current).toHaveProperty('showAnnotations');
    expect(result.current).toHaveProperty('toothBounds');
    expect(result.current).toHaveProperty('visibleProportionLayers');
    expect(result.current).toHaveProperty('midlineOffset');
    expect(result.current).toHaveProperty('isMidlineAdjusted');
    expect(result.current).toHaveProperty('analysisSteps');

    // Actions
    expect(typeof result.current.handleRetry).toBe('function');
    expect(typeof result.current.handleRegenerateSimulation).toBe('function');
    expect(typeof result.current.handleContinue).toBe('function');
    expect(typeof result.current.toggleProportionLayer).toBe('function');
    expect(typeof result.current.setMidlineOffset).toBe('function');
    expect(typeof result.current.resetMidline).toBe('function');
    expect(typeof result.current.setShowAnnotations).toBe('function');
    expect(typeof result.current.confirmDSD).toBe('function');

    // Props pass-through
    expect(result.current).toHaveProperty('imageBase64');
    expect(result.current).toHaveProperty('onSkip');
    expect(result.current).toHaveProperty('patientPreferences');
  });
});

// ---- convertToLegacyDSD (tested indirectly via seeding) -------------------

describe('convertToLegacyDSD (via analysisResult seeding)', () => {
  it('should map detected_teeth to suggestions', async () => {
    const analysisResult = makeAnalysisResult({
      detected_teeth: [
        {
          tooth: '11',
          tooth_region: 'anterior',
          cavity_class: null,
          restoration_size: null,
          substrate: null,
          substrate_condition: null,
          enamel_condition: null,
          depth: null,
          priority: 'alta',
          notes: null,
          treatment_indication: 'gengivoplastia',
          indication_reason: 'excesso gengival',
          current_issue: 'Gengiva excessiva',
          proposed_change: 'Gengivoplastia no dente 11',
        },
      ],
    });

    const { result } = renderHook(() =>
      useDSDStep(createProps({ analysisResult })),
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    const suggestions = result.current.result!.analysis.suggestions;
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].tooth).toBe('11');
    expect(suggestions[0].current_issue).toBe('Gengiva excessiva');
    expect(suggestions[0].proposed_change).toBe('Gengivoplastia no dente 11');
    expect(suggestions[0].treatment_indication).toBe('gengivoplastia');
  });

  it('should use defaults for missing DSD fields', async () => {
    const analysisResult = makeAnalysisResult({
      facial_midline: undefined,
      dental_midline: undefined,
      smile_line: undefined,
    });

    const { result } = renderHook(() =>
      useDSDStep(createProps({ analysisResult })),
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.result!.analysis.facial_midline).toBe('centrada');
    expect(result.current.result!.analysis.dental_midline).toBe('alinhada');
    expect(result.current.result!.analysis.smile_line).toBe('média');
  });

  it('should pass through visagism fields', async () => {
    const analysisResult = makeAnalysisResult({
      face_shape: 'oval',
      perceived_temperament: 'sanguíneo',
      recommended_tooth_shape: 'oval',
      visagism_notes: 'Notes here',
      lip_thickness: 'médio',
      overbite_suspicion: 'não',
      smile_arc: 'consonante',
    });

    const { result } = renderHook(() =>
      useDSDStep(createProps({ analysisResult })),
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    const analysis = result.current.result!.analysis;
    expect(analysis.face_shape).toBe('oval');
    expect(analysis.perceived_temperament).toBe('sanguíneo');
    expect(analysis.recommended_tooth_shape).toBe('oval');
    expect(analysis.visagism_notes).toBe('Notes here');
    expect(analysis.lip_thickness).toBe('médio');
    expect(analysis.overbite_suspicion).toBe('não');
    expect(analysis.smile_arc).toBe('consonante');
  });

  it('should generate fallback text for tooth without current_issue', async () => {
    const analysisResult = makeAnalysisResult({
      detected_teeth: [
        {
          tooth: '21',
          tooth_region: 'anterior',
          cavity_class: null,
          restoration_size: null,
          substrate: null,
          substrate_condition: null,
          enamel_condition: null,
          depth: null,
          priority: 'alta',
          notes: null,
          treatment_indication: 'resina',
        },
      ],
    });

    const { result } = renderHook(() =>
      useDSDStep(createProps({ analysisResult })),
    );

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    const suggestion = result.current.result!.analysis.suggestions[0];
    expect(suggestion.current_issue).toContain('Achado clínico no dente 21');
    expect(suggestion.proposed_change).toContain('Restauração em resina composta');
  });
});
