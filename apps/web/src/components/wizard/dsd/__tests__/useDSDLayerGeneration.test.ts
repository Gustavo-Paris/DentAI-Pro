import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDSDLayerGeneration } from '../useDSDLayerGeneration';
import type { UseDSDLayerGenerationParams } from '../useDSDLayerGeneration';
import type { DSDAnalysis, DSDResult, SimulationLayer } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

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

vi.mock('@/lib/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/compositeGingivo', () => ({
  compositeGengivoplastyLips: vi.fn().mockResolvedValue('data:image/png;base64,composited'),
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

function createParams(overrides?: Partial<UseDSDLayerGenerationParams>): UseDSDLayerGenerationParams {
  return {
    imageBase64: 'data:image/png;base64,test',
    patientPreferences: { whiteningLevel: 'natural' },
    gingivoplastyApproved: null,
    initialResult: null,
    invokeFunction: vi.fn().mockResolvedValue({
      data: { simulation_url: 'path/to/sim', analysis: makeAnalysis() },
      error: null,
    }),
    setSimulationImageUrl: vi.fn(),
    setResult: vi.fn(),
    onAutoApproveGingivoplasty: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- getLayerLabel (exported from @/types/dsd) ----------------------------

describe('getLayerLabel', () => {
  it('should return translated label when t is provided', () => {
    const t = (key: string) => `translated:${key}`;
    expect(getLayerLabel('restorations-only', t)).toBe('translated:dsd.layers.restorationsOnly');
    expect(getLayerLabel('whitening-restorations', t)).toBe('translated:dsd.layers.whiteningRestorations');
    expect(getLayerLabel('complete-treatment', t)).toBe('translated:dsd.layers.completeTreatment');
    expect(getLayerLabel('face-mockup', t)).toBe('translated:dsd.layers.faceMockup');
  });

  it('should return default PT-BR label when t is not provided', () => {
    expect(getLayerLabel('restorations-only')).toBe('Apenas Restaurações');
    expect(getLayerLabel('whitening-restorations')).toBe('Restaurações + Clareamento');
    expect(getLayerLabel('complete-treatment')).toBe('Tratamento Completo');
    expect(getLayerLabel('face-mockup')).toBe('Simulação no Rosto');
  });
});

// ---- Initial state --------------------------------------------------------

describe('useDSDLayerGeneration initial state', () => {
  it('should start with empty layers', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    expect(result.current.layers).toEqual([]);
    expect(result.current.layerUrls).toEqual({});
    expect(result.current.activeLayerIndex).toBe(0);
    expect(result.current.layersGenerating).toBe(false);
    expect(result.current.layerGenerationProgress).toBe(0);
    expect(result.current.failedLayers).toEqual([]);
    expect(result.current.retryingLayer).toBeNull();
    expect(result.current.isSimulationGenerating).toBe(false);
    expect(result.current.simulationError).toBe(false);
  });

  it('should rehydrate layers from initialResult', () => {
    const existingLayers: SimulationLayer[] = [
      {
        type: 'restorations-only',
        label: 'L1',
        simulation_url: 'path/l1',
        whitening_level: 'natural',
        includes_gengivoplasty: false,
      },
    ];
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({
        initialResult: {
          analysis: makeAnalysis(),
          simulation_url: 'path/sim',
          layers: existingLayers,
        },
      })),
    );

    expect(result.current.layers).toEqual(existingLayers);
  });
});

// ---- resolveLayerUrl ------------------------------------------------------

describe('resolveLayerUrl', () => {
  it('should return null url when layer has no simulation_url', async () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    const layer: SimulationLayer = {
      type: 'restorations-only',
      label: 'L1',
      simulation_url: null,
      whitening_level: 'natural',
      includes_gengivoplasty: false,
    };

    const resolved = await result.current.resolveLayerUrl(layer);
    expect(resolved.url).toBeNull();
  });

  it('should return data URL directly', async () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    const layer: SimulationLayer = {
      type: 'restorations-only',
      label: 'L1',
      simulation_url: 'data:image/png;base64,abc',
      whitening_level: 'natural',
      includes_gengivoplasty: false,
    };

    const resolved = await result.current.resolveLayerUrl(layer);
    expect(resolved.url).toBe('data:image/png;base64,abc');
  });

  it('should return http URL directly', async () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    const layer: SimulationLayer = {
      type: 'restorations-only',
      label: 'L1',
      simulation_url: 'https://example.com/image.png',
      whitening_level: 'natural',
      includes_gengivoplasty: false,
    };

    const resolved = await result.current.resolveLayerUrl(layer);
    expect(resolved.url).toBe('https://example.com/image.png');
  });

  it('should call getSignedDSDUrl for storage paths', async () => {
    const { getSignedDSDUrl } = await import('@/data/storage');
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    const layer: SimulationLayer = {
      type: 'restorations-only',
      label: 'L1',
      simulation_url: 'user-id/session/sim.png',
      whitening_level: 'natural',
      includes_gengivoplasty: false,
    };

    const resolved = await result.current.resolveLayerUrl(layer);
    expect(getSignedDSDUrl).toHaveBeenCalledWith('user-id/session/sim.png');
    expect(resolved.url).toBe('https://signed-url');
  });
});

// ---- handleSelectLayer ----------------------------------------------------

describe('handleSelectLayer', () => {
  it('should update activeLayerIndex', () => {
    const setSimulationImageUrl = vi.fn();
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ setSimulationImageUrl })),
    );

    act(() => result.current.handleSelectLayer(1, 'whitening-restorations'));
    expect(result.current.activeLayerIndex).toBe(1);
  });

  it('should update simulationImageUrl from layerUrls', () => {
    const setSimulationImageUrl = vi.fn();
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ setSimulationImageUrl })),
    );

    // Manually set layerUrls
    act(() => {
      result.current.setLayerUrls({ 'whitening-restorations': 'https://l2-url' });
    });

    act(() => result.current.handleSelectLayer(1, 'whitening-restorations'));
    expect(setSimulationImageUrl).toHaveBeenCalledWith('https://l2-url');
  });
});

// ---- setters exposed ------------------------------------------------------

describe('exposed setters', () => {
  it('should expose setLayers', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    const mockLayer: SimulationLayer = {
      type: 'restorations-only',
      label: 'L1',
      simulation_url: null,
      whitening_level: 'natural',
      includes_gengivoplasty: false,
    };

    act(() => result.current.setLayers([mockLayer]));
    expect(result.current.layers).toEqual([mockLayer]);
  });

  it('should expose setLayerUrls', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    act(() => result.current.setLayerUrls({ 'restorations-only': 'url1' }));
    expect(result.current.layerUrls).toEqual({ 'restorations-only': 'url1' });
  });

  it('should expose setActiveLayerIndex', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    act(() => result.current.setActiveLayerIndex(2));
    expect(result.current.activeLayerIndex).toBe(2);
  });

  it('should expose setSimulationError', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    act(() => result.current.setSimulationError(true));
    expect(result.current.simulationError).toBe(true);
  });

  it('should expose setFailedLayers', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    act(() => result.current.setFailedLayers(['complete-treatment']));
    expect(result.current.failedLayers).toEqual(['complete-treatment']);
  });

  it('should expose setRetryingLayer', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    act(() => result.current.setRetryingLayer('whitening-restorations'));
    expect(result.current.retryingLayer).toBe('whitening-restorations');
  });
});

// ---- generateSingleLayer --------------------------------------------------

describe('generateSingleLayer', () => {
  it('should return null when no image', async () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ imageBase64: null })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'restorations-only');
    expect(layer).toBeNull();
  });

  it('should return a SimulationLayer on success', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: { simulation_url: 'path/to/sim', analysis: makeAnalysis() },
      error: null,
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'restorations-only');
    expect(layer).not.toBeNull();
    expect(layer!.type).toBe('restorations-only');
    expect(layer!.simulation_url).toBe('path/to/sim');
    expect(layer!.includes_gengivoplasty).toBe(false);
  });

  it('should set includes_gengivoplasty true for complete-treatment', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: { simulation_url: 'path/to/sim' },
      error: null,
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'complete-treatment');
    expect(layer).not.toBeNull();
    expect(layer!.includes_gengivoplasty).toBe(true);
  });

  it('should return null when simulation returns no URL', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: { simulation_url: null },
      error: null,
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'restorations-only');
    expect(layer).toBeNull();
  });

  it('should return null on error', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Server error'),
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'restorations-only');
    expect(layer).toBeNull();
  });

  it('should include model_used when returned by server', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: { simulation_url: 'path/to/sim', model_used: 'gemini-3.1-flash-image-preview' },
      error: null,
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    const layer = await result.current.generateSingleLayer(makeAnalysis(), 'restorations-only');
    expect(layer!.model_used).toBe('gemini-3.1-flash-image-preview');
  });

  it('should use override base image when provided', async () => {
    const invokeFunction = vi.fn().mockResolvedValue({
      data: { simulation_url: 'path/to/sim' },
      error: null,
    });

    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    await result.current.generateSingleLayer(makeAnalysis(), 'whitening-restorations', 'data:image/png;base64,override');
    expect(invokeFunction).toHaveBeenCalledWith('generate-dsd', expect.objectContaining({
      body: expect.objectContaining({
        imageBase64: 'data:image/png;base64,override',
        inputAlreadyProcessed: true,
      }),
    }));
  });
});

// ---- generateAllLayers (basic) ------------------------------------------

describe('generateAllLayers', () => {
  it('should not proceed without imageBase64', async () => {
    const invokeFunction = vi.fn();
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ imageBase64: null, invokeFunction })),
    );

    await act(async () => {
      await result.current.generateAllLayers(makeAnalysis());
    });

    expect(invokeFunction).not.toHaveBeenCalled();
  });

  it('should not proceed without analysis', async () => {
    const invokeFunction = vi.fn();
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ invokeFunction })),
    );

    await act(async () => {
      await result.current.generateAllLayers(undefined);
    });

    expect(invokeFunction).not.toHaveBeenCalled();
  });
});

// ---- retryFailedLayer ----------------------------------------------------

describe('retryFailedLayer', () => {
  it('should not proceed without imageBase64', async () => {
    const generateSingleLayerMock = vi.fn();
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams({ imageBase64: null })),
    );

    await act(async () => {
      await result.current.retryFailedLayer('restorations-only', makeAnalysis());
    });

    // Should not have generated anything
    expect(result.current.retryingLayer).toBeNull();
  });

  it('should not proceed without analysis', async () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    await act(async () => {
      await result.current.retryFailedLayer('restorations-only', null);
    });

    expect(result.current.retryingLayer).toBeNull();
  });
});

// ---- Return shape ---------------------------------------------------------

describe('useDSDLayerGeneration return shape', () => {
  it('should expose all expected properties and methods', () => {
    const { result } = renderHook(() =>
      useDSDLayerGeneration(createParams()),
    );

    // State
    expect(result.current).toHaveProperty('layers');
    expect(result.current).toHaveProperty('layerUrls');
    expect(result.current).toHaveProperty('activeLayerIndex');
    expect(result.current).toHaveProperty('layersGenerating');
    expect(result.current).toHaveProperty('layerGenerationProgress');
    expect(result.current).toHaveProperty('failedLayers');
    expect(result.current).toHaveProperty('retryingLayer');
    expect(result.current).toHaveProperty('isSimulationGenerating');
    expect(result.current).toHaveProperty('simulationError');

    // Setters
    expect(typeof result.current.setLayers).toBe('function');
    expect(typeof result.current.setLayerUrls).toBe('function');
    expect(typeof result.current.setActiveLayerIndex).toBe('function');
    expect(typeof result.current.setSimulationError).toBe('function');
    expect(typeof result.current.setFailedLayers).toBe('function');
    expect(typeof result.current.setRetryingLayer).toBe('function');

    // Actions
    expect(typeof result.current.generateSingleLayer).toBe('function');
    expect(typeof result.current.resolveLayerUrl).toBe('function');
    expect(typeof result.current.generateAllLayers).toBe('function');
    expect(typeof result.current.retryFailedLayer).toBe('function');
    expect(typeof result.current.handleSelectLayer).toBe('function');
  });
});
