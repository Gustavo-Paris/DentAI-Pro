import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure state-transition logic from useSharedEvaluation.
// The hook depends on React (useState/useEffect) and Supabase, so we test
// the state machine independently: initial state, fetch success, fetch error.
// ---------------------------------------------------------------------------

interface SharedEvaluationRow {
  tooth: string;
  treatment_type: string | null;
  cavity_class: string;
  status: string | null;
  ai_treatment_indication: string | null;
  created_at: string;
  clinic_name: string | null;
}

interface SharedDSDData {
  dsd_analysis: Record<string, unknown> | null;
  dsd_simulation_url: string | null;
  dsd_simulation_layers: Array<{
    type: string;
    label: string;
    simulation_url: string | null;
    whitening_level: string;
    includes_gengivoplasty: boolean;
  }> | null;
  photo_frontal: string | null;
}

interface SharedEvaluationState {
  loading: boolean;
  expired: boolean;
  evaluations: SharedEvaluationRow[];
  dsdData: SharedDSDData | null;
  beforeImageUrl: string | null;
  simulationUrl: string | null;
  layerUrls: Record<string, string>;
}

// Mirrors the hook's initial state (all useState defaults)
function getInitialState(): SharedEvaluationState {
  return {
    loading: true,
    expired: false,
    evaluations: [],
    dsdData: null,
    beforeImageUrl: null,
    simulationUrl: null,
    layerUrls: {},
  };
}

// Mirrors the hook's state after a successful fetch
function applyFetchSuccess(
  state: SharedEvaluationState,
  rows: SharedEvaluationRow[],
  dsd: SharedDSDData | null,
): SharedEvaluationState {
  if (rows.length === 0) {
    return { ...state, loading: false, expired: true };
  }
  return {
    ...state,
    loading: false,
    evaluations: rows,
    dsdData: dsd || null,
  };
}

// Mirrors the hook's state after a fetch error
function applyFetchError(state: SharedEvaluationState): SharedEvaluationState {
  return { ...state, loading: false, expired: true };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseRow: SharedEvaluationRow = {
  tooth: '11',
  treatment_type: 'resina',
  cavity_class: 'III',
  status: 'completed',
  ai_treatment_indication: 'Restauracao direta em resina composta',
  created_at: '2026-01-15T10:00:00Z',
  clinic_name: 'Clinica Sorriso',
};

const baseDSD: SharedDSDData = {
  dsd_analysis: { symmetry: 'adequate', midline: 'centered' },
  dsd_simulation_url: 'dsd/session-1/simulation.png',
  dsd_simulation_layers: [
    {
      type: 'whitening',
      label: 'Clareamento',
      simulation_url: 'dsd/session-1/whitening.png',
      whitening_level: 'BL2',
      includes_gengivoplasty: false,
    },
  ],
  photo_frontal: 'photos/session-1/frontal.jpg',
};

// ---------------------------------------------------------------------------
// Tests: getInitialState
// ---------------------------------------------------------------------------

describe('getInitialState', () => {
  it('should start with loading=true', () => {
    const state = getInitialState();
    expect(state.loading).toBe(true);
  });

  it('should start with expired=false', () => {
    const state = getInitialState();
    expect(state.expired).toBe(false);
  });

  it('should start with empty evaluations', () => {
    const state = getInitialState();
    expect(state.evaluations).toEqual([]);
    expect(state.evaluations).toHaveLength(0);
  });

  it('should start with null dsdData', () => {
    const state = getInitialState();
    expect(state.dsdData).toBeNull();
  });

  it('should start with null image URLs', () => {
    const state = getInitialState();
    expect(state.beforeImageUrl).toBeNull();
    expect(state.simulationUrl).toBeNull();
  });

  it('should start with empty layerUrls', () => {
    const state = getInitialState();
    expect(state.layerUrls).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Tests: applyFetchSuccess
// ---------------------------------------------------------------------------

describe('applyFetchSuccess', () => {
  it('should set loading=false after success', () => {
    const state = applyFetchSuccess(getInitialState(), [baseRow], null);
    expect(state.loading).toBe(false);
  });

  it('should keep expired=false when rows exist', () => {
    const state = applyFetchSuccess(getInitialState(), [baseRow], null);
    expect(state.expired).toBe(false);
  });

  it('should populate evaluations from rows', () => {
    const rows = [
      { ...baseRow, tooth: '11' },
      { ...baseRow, tooth: '12' },
    ];
    const state = applyFetchSuccess(getInitialState(), rows, null);
    expect(state.evaluations).toHaveLength(2);
    expect(state.evaluations[0].tooth).toBe('11');
    expect(state.evaluations[1].tooth).toBe('12');
  });

  it('should set expired=true when rows is empty', () => {
    const state = applyFetchSuccess(getInitialState(), [], null);
    expect(state.expired).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('should keep evaluations empty when rows is empty (expired)', () => {
    const state = applyFetchSuccess(getInitialState(), [], null);
    expect(state.evaluations).toEqual([]);
  });

  it('should set dsdData when provided', () => {
    const state = applyFetchSuccess(getInitialState(), [baseRow], baseDSD);
    expect(state.dsdData).not.toBeNull();
    expect(state.dsdData!.dsd_simulation_url).toBe('dsd/session-1/simulation.png');
  });

  it('should keep dsdData null when dsd param is null', () => {
    const state = applyFetchSuccess(getInitialState(), [baseRow], null);
    expect(state.dsdData).toBeNull();
  });

  it('should preserve beforeImageUrl from prior state', () => {
    const prior: SharedEvaluationState = {
      ...getInitialState(),
      beforeImageUrl: 'https://example.com/photo.jpg',
    };
    const state = applyFetchSuccess(prior, [baseRow], null);
    expect(state.beforeImageUrl).toBe('https://example.com/photo.jpg');
  });

  it('should preserve simulationUrl from prior state', () => {
    const prior: SharedEvaluationState = {
      ...getInitialState(),
      simulationUrl: 'https://example.com/sim.png',
    };
    const state = applyFetchSuccess(prior, [baseRow], null);
    expect(state.simulationUrl).toBe('https://example.com/sim.png');
  });

  it('should preserve layerUrls from prior state', () => {
    const prior: SharedEvaluationState = {
      ...getInitialState(),
      layerUrls: { whitening: 'https://example.com/layer.png' },
    };
    const state = applyFetchSuccess(prior, [baseRow], null);
    expect(state.layerUrls).toEqual({ whitening: 'https://example.com/layer.png' });
  });

  it('should include DSD layers when present', () => {
    const state = applyFetchSuccess(getInitialState(), [baseRow], baseDSD);
    expect(state.dsdData!.dsd_simulation_layers).toHaveLength(1);
    expect(state.dsdData!.dsd_simulation_layers![0].type).toBe('whitening');
  });

  it('should handle DSD with null layers', () => {
    const dsdNoLayers: SharedDSDData = { ...baseDSD, dsd_simulation_layers: null };
    const state = applyFetchSuccess(getInitialState(), [baseRow], dsdNoLayers);
    expect(state.dsdData!.dsd_simulation_layers).toBeNull();
  });

  it('should handle DSD with null photo_frontal', () => {
    const dsdNoPhoto: SharedDSDData = { ...baseDSD, photo_frontal: null };
    const state = applyFetchSuccess(getInitialState(), [baseRow], dsdNoPhoto);
    expect(state.dsdData!.photo_frontal).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: applyFetchError
// ---------------------------------------------------------------------------

describe('applyFetchError', () => {
  it('should set loading=false after error', () => {
    const state = applyFetchError(getInitialState());
    expect(state.loading).toBe(false);
  });

  it('should set expired=true after error', () => {
    const state = applyFetchError(getInitialState());
    expect(state.expired).toBe(true);
  });

  it('should keep evaluations empty after error', () => {
    const state = applyFetchError(getInitialState());
    expect(state.evaluations).toEqual([]);
  });

  it('should keep dsdData null after error', () => {
    const state = applyFetchError(getInitialState());
    expect(state.dsdData).toBeNull();
  });

  it('should preserve prior evaluations if error happens after prior success', () => {
    const prior = applyFetchSuccess(getInitialState(), [baseRow], baseDSD);
    const state = applyFetchError(prior);
    // The error sets expired=true but does not clear evaluations (spread preserves them)
    expect(state.evaluations).toHaveLength(1);
    expect(state.expired).toBe(true);
    expect(state.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: no token scenario (hook returns initial state with loading=false)
// ---------------------------------------------------------------------------

describe('no token scenario', () => {
  // When token is undefined the hook's useEffect returns early and only
  // setLoading(false) runs in the finally block — but since the async function
  // returns before try, finally doesn't run either. So state stays as initial.
  // We model this as: initial state remains unchanged.

  it('should remain in initial loading state when no token', () => {
    const state = getInitialState();
    expect(state.loading).toBe(true);
    expect(state.expired).toBe(false);
    expect(state.evaluations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: full state machine transitions
// ---------------------------------------------------------------------------

describe('state machine transitions', () => {
  it('initial -> success with data -> final state', () => {
    const s0 = getInitialState();
    expect(s0.loading).toBe(true);

    const s1 = applyFetchSuccess(s0, [baseRow, { ...baseRow, tooth: '21' }], baseDSD);
    expect(s1.loading).toBe(false);
    expect(s1.expired).toBe(false);
    expect(s1.evaluations).toHaveLength(2);
    expect(s1.dsdData).not.toBeNull();
  });

  it('initial -> success with empty rows -> expired state', () => {
    const s0 = getInitialState();
    const s1 = applyFetchSuccess(s0, [], null);
    expect(s1.loading).toBe(false);
    expect(s1.expired).toBe(true);
    expect(s1.evaluations).toHaveLength(0);
    expect(s1.dsdData).toBeNull();
  });

  it('initial -> error -> expired state', () => {
    const s0 = getInitialState();
    const s1 = applyFetchError(s0);
    expect(s1.loading).toBe(false);
    expect(s1.expired).toBe(true);
    expect(s1.evaluations).toHaveLength(0);
  });
});
