import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDSDGingivoplasty } from '../useDSDGingivoplasty';
import type { UseDSDGingivoplastyParams, GingivoConfidence } from '../useDSDGingivoplasty';
import type { DSDAnalysis, DSDResult, SimulationLayer, SimulationLayerType } from '@/types/dsd';
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

function makeResult(overrides?: Partial<DSDResult>): DSDResult {
  return {
    analysis: makeAnalysis(),
    simulation_url: null,
    ...overrides,
  };
}

function createParams(overrides?: Partial<UseDSDGingivoplastyParams>): UseDSDGingivoplastyParams {
  return {
    imageBase64: 'data:image/png;base64,test',
    result: makeResult(),
    analysisResult: null,
    gingivoplastyApproved: null,
    setGingivoplastyApproved: vi.fn(),
    layerUrls: {},
    generateSingleLayer: vi.fn().mockResolvedValue(null),
    resolveLayerUrl: vi.fn().mockResolvedValue({ layer: {} as SimulationLayer, url: null }),
    setLayers: vi.fn(),
    setLayerUrls: vi.fn(),
    setActiveLayerIndex: vi.fn(),
    setFailedLayers: vi.fn(),
    setResult: vi.fn(),
    setRetryingLayer: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- getGingivoConfidence -------------------------------------------------

describe('getGingivoConfidence', () => {
  it('should return "recommended" when structured gingival_assessment has indication recommended', () => {
    const analysisResult: PhotoAnalysisResult = {
      detected: true,
      confidence: 90,
      detected_teeth: [],
      primary_tooth: null,
      vita_shade: null,
      observations: [],
      warnings: [],
      gingival_assessment: {
        indication: 'recommended',
        evidence: ['excess gum'],
        affected_teeth: ['11'],
        confidence: 90,
      },
    };

    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult })),
    );

    expect(result.current.getGingivoConfidence(makeAnalysis())).toBe('recommended');
  });

  it('should return "optional" from structured gingival_assessment', () => {
    const analysisResult: PhotoAnalysisResult = {
      detected: true,
      confidence: 90,
      detected_teeth: [],
      primary_tooth: null,
      vita_shade: null,
      observations: [],
      warnings: [],
      gingival_assessment: {
        indication: 'optional',
        evidence: ['margem gengival'],
        affected_teeth: ['11'],
        confidence: 60,
      },
    };

    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult })),
    );

    expect(result.current.getGingivoConfidence(makeAnalysis())).toBe('optional');
  });

  it('should return "none" from structured gingival_assessment', () => {
    const analysisResult: PhotoAnalysisResult = {
      detected: true,
      confidence: 90,
      detected_teeth: [],
      primary_tooth: null,
      vita_shade: null,
      observations: [],
      warnings: [],
      gingival_assessment: {
        indication: 'none',
        evidence: [],
        affected_teeth: [],
        confidence: 95,
      },
    };

    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult })),
    );

    expect(result.current.getGingivoConfidence(makeAnalysis())).toBe('none');
  });

  it('should return "recommended" for "alta" smile line (fallback path)', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    expect(result.current.getGingivoConfidence(makeAnalysis({ smile_line: 'alta' }))).toBe('recommended');
  });

  it('should return "recommended" for explicit gengivoplastia treatment indication', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({
      smile_line: 'baixa',
      suggestions: [
        {
          tooth: '11',
          current_issue: 'test',
          proposed_change: 'test',
          treatment_indication: 'gengivoplastia',
        },
      ],
    });
    expect(result.current.getGingivoConfidence(analysis)).toBe('recommended');
  });

  it('should return "recommended" for "média" smile line with strong gingival evidence', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({
      smile_line: 'média',
      suggestions: [
        {
          tooth: '11',
          current_issue: 'excesso gengival significativo',
          proposed_change: 'gengivoplastia',
        },
      ],
    });
    expect(result.current.getGingivoConfidence(analysis)).toBe('recommended');
  });

  it('should return "optional" for "média" smile line with weak gingival evidence', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({
      smile_line: 'média',
      observations: ['Margem gengival visível'],
    });
    expect(result.current.getGingivoConfidence(analysis)).toBe('optional');
  });

  it('should return "none" for "média" smile line with no gingival evidence', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({
      smile_line: 'média',
      suggestions: [
        { tooth: '11', current_issue: 'cárie', proposed_change: 'restauração' },
      ],
    });
    expect(result.current.getGingivoConfidence(analysis)).toBe('none');
  });

  it('should return "none" for "baixa" smile line without explicit indication', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({ smile_line: 'baixa' });
    expect(result.current.getGingivoConfidence(analysis)).toBe('none');
  });

  it('should detect "gingivoplasty" (English) treatment indication', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ analysisResult: null })),
    );

    const analysis = makeAnalysis({
      smile_line: 'baixa',
      suggestions: [
        {
          tooth: '11',
          current_issue: 'test',
          proposed_change: 'test',
          treatment_indication: 'gingivoplasty' as any,
        },
      ],
    });
    expect(result.current.getGingivoConfidence(analysis)).toBe('recommended');
  });
});

// ---- determineLayersNeeded ------------------------------------------------

describe('determineLayersNeeded', () => {
  it('should include complete-treatment when gingivoplastyApproved is true', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ gingivoplastyApproved: true })),
    );

    const layers = result.current.determineLayersNeeded(makeAnalysis());
    expect(layers).toContain('complete-treatment');
    expect(layers).toContain('restorations-only');
    expect(layers).toContain('whitening-restorations');
  });

  it('should include complete-treatment when undecided + recommended confidence', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        gingivoplastyApproved: null,
        analysisResult: null,
      })),
    );

    const analysis = makeAnalysis({ smile_line: 'alta' });
    const layers = result.current.determineLayersNeeded(analysis);
    expect(layers).toContain('complete-treatment');
  });

  it('should NOT include complete-treatment when gingivoplastyApproved is false', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ gingivoplastyApproved: false })),
    );

    const layers = result.current.determineLayersNeeded(makeAnalysis({ smile_line: 'alta' }));
    expect(layers).not.toContain('complete-treatment');
  });

  it('should NOT include complete-treatment when undecided + no confidence', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        gingivoplastyApproved: null,
        analysisResult: null,
      })),
    );

    const analysis = makeAnalysis({ smile_line: 'baixa' });
    const layers = result.current.determineLayersNeeded(analysis);
    expect(layers).not.toContain('complete-treatment');
  });

  it('should always include base layers', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ gingivoplastyApproved: false })),
    );

    const layers = result.current.determineLayersNeeded(makeAnalysis());
    expect(layers).toEqual(['restorations-only', 'whitening-restorations']);
  });
});

// ---- handleDiscardGingivoplasty -------------------------------------------

describe('handleDiscardGingivoplasty', () => {
  it('should set gingivoplastyApproved to false', () => {
    const setGingivoplastyApproved = vi.fn();
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ setGingivoplastyApproved })),
    );

    act(() => result.current.handleDiscardGingivoplasty());
    expect(setGingivoplastyApproved).toHaveBeenCalledWith(false);
  });
});

// ---- handleApproveGingivoplasty -------------------------------------------

describe('handleApproveGingivoplasty', () => {
  it('should set gingivoplastyApproved to true', async () => {
    const setGingivoplastyApproved = vi.fn();
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ setGingivoplastyApproved })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(setGingivoplastyApproved).toHaveBeenCalledWith(true);
  });

  it('should exit early when no analysis', async () => {
    const generateSingleLayer = vi.fn();
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        result: null,
        generateSingleLayer,
      })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(generateSingleLayer).not.toHaveBeenCalled();
  });

  it('should exit early when no imageBase64', async () => {
    const generateSingleLayer = vi.fn();
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        imageBase64: null,
        generateSingleLayer,
      })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(generateSingleLayer).not.toHaveBeenCalled();
  });

  it('should show error toast when generateSingleLayer returns null', async () => {
    const { toast } = await import('sonner');
    const generateSingleLayer = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({ generateSingleLayer })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should add layer on success', async () => {
    const { toast } = await import('sonner');
    const mockLayer: SimulationLayer = {
      type: 'complete-treatment',
      label: 'Tratamento Completo',
      simulation_url: 'path/to/sim',
      whitening_level: 'natural',
      includes_gengivoplasty: true,
    };
    const generateSingleLayer = vi.fn().mockResolvedValue(mockLayer);
    const resolveLayerUrl = vi.fn().mockResolvedValue({ layer: mockLayer, url: 'https://signed-url' });
    const setLayers = vi.fn();
    const setLayerUrls = vi.fn();
    const setResult = vi.fn();
    const setRetryingLayer = vi.fn();

    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        generateSingleLayer,
        resolveLayerUrl,
        setLayers,
        setLayerUrls,
        setResult,
        setRetryingLayer,
      })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(setRetryingLayer).toHaveBeenCalledWith('complete-treatment');
    expect(generateSingleLayer).toHaveBeenCalledWith(
      expect.any(Object),
      'complete-treatment',
      undefined,
      undefined,
    );
    expect(setLayers).toHaveBeenCalled();
    expect(setLayerUrls).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(setRetryingLayer).toHaveBeenLastCalledWith(null);
  });

  it('should add failed layer on error', async () => {
    const { toast } = await import('sonner');
    const generateSingleLayer = vi.fn().mockRejectedValue(new Error('Generation failed'));
    const setFailedLayers = vi.fn();
    const setRetryingLayer = vi.fn();

    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams({
        generateSingleLayer,
        setFailedLayers,
        setRetryingLayer,
      })),
    );

    await act(async () => {
      await result.current.handleApproveGingivoplasty();
    });

    expect(setFailedLayers).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    expect(setRetryingLayer).toHaveBeenLastCalledWith(null);
  });
});

// ---- Return shape ---------------------------------------------------------

describe('useDSDGingivoplasty return shape', () => {
  it('should expose all expected properties', () => {
    const { result } = renderHook(() =>
      useDSDGingivoplasty(createParams()),
    );

    expect(result.current).toHaveProperty('gingivoplastyApproved');
    expect(result.current).toHaveProperty('getGingivoConfidence');
    expect(result.current).toHaveProperty('determineLayersNeeded');
    expect(result.current).toHaveProperty('handleApproveGingivoplasty');
    expect(result.current).toHaveProperty('handleDiscardGingivoplasty');
    expect(typeof result.current.getGingivoConfidence).toBe('function');
    expect(typeof result.current.determineLayersNeeded).toBe('function');
    expect(typeof result.current.handleApproveGingivoplasty).toBe('function');
    expect(typeof result.current.handleDiscardGingivoplasty).toBe('function');
  });
});
