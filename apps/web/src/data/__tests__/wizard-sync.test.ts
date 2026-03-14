import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProtocolFingerprint } from '@/lib/protocol-fingerprint';
import type { FingerprintableEvaluation } from '@/lib/protocol-fingerprint';
import { groupByTreatment } from '@/pages/EvaluationDetails.helpers';
import type { EvalGroup } from '@/pages/EvaluationDetails.helpers';
import type { SessionEvaluationRow } from '../evaluations';

// ---------------------------------------------------------------------------
// Mock supabase client (required by wizard.ts import chain)
// ---------------------------------------------------------------------------

const mockUpdate = vi.fn();
const mockIn = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

let mockEvaluations: Record<string, unknown>[] = [];
let mockQueryError: Error | null = null;

vi.mock('../client', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              in: () => ({
                data: mockQueryError ? null : mockEvaluations,
                error: mockQueryError,
              }),
            };
          },
        };
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          in: (...inArgs: unknown[]) => {
            mockIn(...inArgs);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
    functions: { invoke: vi.fn() },
    storage: { from: () => ({ upload: vi.fn(), download: vi.fn() }) },
  },
}));

// Mock treatment-config (used by groupByTreatment via EvaluationDetails.helpers)
vi.mock('@/lib/treatment-config', () => ({
  getTreatmentConfig: (type: string | null | undefined) => ({
    shortLabel: type || 'Resina',
    shortLabelKey: `protocols.${type || 'resina'}`,
    icon: () => null,
    variant: 'default' as const,
  }),
  SPECIAL_TREATMENT_TYPES: [
    'gengivoplastia',
    'implante',
    'coroa',
    'endodontia',
    'encaminhamento',
    'recobrimento_radicular',
  ],
}));

// Mock lucide-react (imported by helpers)
vi.mock('lucide-react', () => ({
  CheckCircle: () => null,
}));

// Mock PageShell primitives (imported by helpers)
vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Badge: () => null,
}));

import { syncGroupProtocols } from '../wizard';

// ---------------------------------------------------------------------------
// Helpers — minimal EvaluationItem factory for groupByTreatment tests
// ---------------------------------------------------------------------------

type EvaluationItem = SessionEvaluationRow;

function makeEval(overrides: Partial<EvaluationItem> & { id: string; tooth: string }): EvaluationItem {
  return {
    created_at: '2026-01-01T00:00:00Z',
    patient_name: 'Test',
    patient_id: null,
    patient_age: 30,
    cavity_class: 'III',
    restoration_size: 'Média',
    status: 'planned',
    photo_frontal: null,
    checklist_progress: null,
    stratification_protocol: null,
    treatment_type: 'resina',
    ai_treatment_indication: null,
    ai_indication_reason: null,
    cementation_protocol: null,
    generic_protocol: null,
    tooth_color: 'A2',
    bruxism: false,
    aesthetic_level: 'estético',
    budget: 'padrão',
    longevity_expectation: 'médio',
    patient_aesthetic_goals: null,
    region: 'anterior',
    substrate: 'esmalte',
    substrate_condition: null,
    enamel_condition: null,
    depth: null,
    anamnesis: null,
    stratification_needed: true,
    recommendation_text: null,
    alternatives: null,
    protocol_layers: null,
    alerts: null,
    warnings: null,
    session_id: 'session-1',
    dsd_analysis: null,
    dsd_simulation_url: null,
    dsd_simulation_layers: null,
    resins: null,
    ideal_resin: null,
    patient_document: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockEvaluations = [];
  mockQueryError = null;
});

// =========================================================================
// 1. getProtocolFingerprint — resins: null produces "resina::no-resin"
// =========================================================================

describe('getProtocolFingerprint — orphan detection', () => {
  it('resins: null → "resina::no-resin" (the orphan key)', () => {
    const ev: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: null,
      stratification_protocol: null,
    };
    expect(getProtocolFingerprint(ev)).toBe('resina::no-resin');
  });

  it('resins: null with layers still produces "no-resin" prefix', () => {
    const ev: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: null,
      stratification_protocol: {
        layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
      },
    };
    expect(getProtocolFingerprint(ev)).toBe('resina::no-resin::Z350:A2B');
  });

  it('same resins + same layers = same fingerprint (deterministic)', () => {
    const base: FingerprintableEvaluation = {
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
      stratification_protocol: {
        layers: [
          { order: 1, resin_brand: 'Z350', shade: 'A2B' },
          { order: 2, resin_brand: 'Z350', shade: 'A2E' },
        ],
      },
    };
    // Two separate objects, same data
    const a = getProtocolFingerprint({ ...base });
    const b = getProtocolFingerprint({ ...base });
    expect(a).toBe(b);
  });

  it('different manufacturers = different fingerprints even with same resin name', () => {
    const a = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: '3M' },
    });
    const b = getProtocolFingerprint({
      treatment_type: 'resina',
      resins: { name: 'Z350', manufacturer: 'FGM' },
    });
    expect(a).not.toBe(b);
  });
});

// =========================================================================
// 2. groupByTreatment — orphan merge logic
// =========================================================================

describe('groupByTreatment — resina::no-resin orphan merge', () => {
  it('merges orphan (resins: null) into the first resina group with a protocol', () => {
    const evals: EvaluationItem[] = [
      // Tooth 11: has protocol (sync propagated)
      makeEval({
        id: 'e1',
        tooth: '11',
        resins: { name: 'Z350', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      // Tooth 12: orphan — sync hasn't propagated yet
      makeEval({
        id: 'e2',
        tooth: '12',
        resins: null,
        stratification_protocol: null,
      }),
    ];

    const groups = groupByTreatment(evals);
    // Should be 1 group, not 2
    const resinaGroups = groups.filter(g => g.treatmentType === 'resina');
    expect(resinaGroups).toHaveLength(1);
    expect(resinaGroups[0].evaluations).toHaveLength(2);
    expect(resinaGroups[0].evaluations.map(e => e.id).sort()).toEqual(['e1', 'e2']);
  });

  it('does NOT merge when there is no resina group with a protocol (all orphans)', () => {
    const evals: EvaluationItem[] = [
      makeEval({ id: 'e1', tooth: '11', resins: null }),
      makeEval({ id: 'e2', tooth: '12', resins: null }),
    ];

    const groups = groupByTreatment(evals);
    const resinaGroups = groups.filter(g => g.treatmentType === 'resina');
    // All in one group (same fingerprint "resina::no-resin")
    expect(resinaGroups).toHaveLength(1);
    expect(resinaGroups[0].evaluations).toHaveLength(2);
  });

  it('merges multiple orphans into single protocol group', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        resins: { name: 'Z350', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      makeEval({ id: 'e2', tooth: '12', resins: null }),
      makeEval({ id: 'e3', tooth: '13', resins: null }),
      makeEval({ id: 'e4', tooth: '21', resins: null }),
    ];

    const groups = groupByTreatment(evals);
    const resinaGroups = groups.filter(g => g.treatmentType === 'resina');
    expect(resinaGroups).toHaveLength(1);
    expect(resinaGroups[0].evaluations).toHaveLength(4);
  });

  it('keeps non-resina groups separate during orphan merge', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        resins: { name: 'Z350', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      makeEval({ id: 'e2', tooth: '12', resins: null }),
      makeEval({
        id: 'e3',
        tooth: 'GENGIVO',
        treatment_type: 'gengivoplastia',
        resins: null,
      }),
    ];

    const groups = groupByTreatment(evals);
    expect(groups).toHaveLength(2);

    const resinaGroups = groups.filter(g => g.treatmentType === 'resina');
    const gengivoGroups = groups.filter(g => g.treatmentType === 'gengivoplastia');
    expect(resinaGroups).toHaveLength(1);
    expect(resinaGroups[0].evaluations).toHaveLength(2);
    expect(gengivoGroups).toHaveLength(1);
    expect(gengivoGroups[0].evaluations).toHaveLength(1);
  });
});

// =========================================================================
// 3. groupByTreatment — mixed treatment types in same session
// =========================================================================

describe('groupByTreatment — mixed treatment types', () => {
  it('separates resina and gengivoplastia into distinct groups', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        treatment_type: 'resina',
        resins: { name: 'Z350', manufacturer: '3M' },
      }),
      makeEval({
        id: 'e2',
        tooth: '21',
        treatment_type: 'resina',
        resins: { name: 'Z350', manufacturer: '3M' },
      }),
      makeEval({
        id: 'e3',
        tooth: 'GENGIVO',
        treatment_type: 'gengivoplastia',
      }),
    ];

    const groups = groupByTreatment(evals);
    expect(groups).toHaveLength(2);
    expect(groups.map(g => g.treatmentType).sort()).toEqual(['gengivoplastia', 'resina']);
  });

  it('separates resina and porcelana into distinct groups', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        treatment_type: 'resina',
        resins: { name: 'Z350', manufacturer: '3M' },
      }),
      makeEval({
        id: 'e2',
        tooth: '36',
        treatment_type: 'porcelana',
        cementation_protocol: {
          cementation: { cement_type: 'Resinoso', cement_brand: 'RelyX' },
        },
      }),
    ];

    const groups = groupByTreatment(evals);
    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.treatmentType === 'resina')?.evaluations).toHaveLength(1);
    expect(groups.find(g => g.treatmentType === 'porcelana')?.evaluations).toHaveLength(1);
  });

  it('handles session with resina + porcelana + gengivoplastia', () => {
    const evals: EvaluationItem[] = [
      makeEval({ id: 'e1', tooth: '11', treatment_type: 'resina', resins: { name: 'Z350', manufacturer: '3M' } }),
      makeEval({ id: 'e2', tooth: '12', treatment_type: 'resina', resins: { name: 'Z350', manufacturer: '3M' } }),
      makeEval({ id: 'e3', tooth: '36', treatment_type: 'porcelana' }),
      makeEval({ id: 'e4', tooth: 'GENGIVO', treatment_type: 'gengivoplastia' }),
    ];

    const groups = groupByTreatment(evals);
    expect(groups).toHaveLength(3);
  });
});

// =========================================================================
// 4. syncGroupProtocols — groups by treatment_type only (not cavity_class)
// =========================================================================

describe('syncGroupProtocols', () => {
  it('groups by treatment_type only — cavity_class differences do not split groups', async () => {
    // This was a production bug: grouping by treatment_type::cavity_class caused
    // protocol group splitting.
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'resina',
        cavity_class: 'III',
        stratification_protocol: { layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }] },
        recommended_resin_id: 'resin-1',
        recommendation_text: 'Z350 recommended',
        alternatives: [],
        is_from_inventory: false,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: false,
        protocol_layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        alerts: [],
        warnings: [],
        cementation_protocol: null,
      },
      {
        id: 'e2',
        treatment_type: 'resina',
        cavity_class: 'IV', // Different cavity class
        stratification_protocol: null, // No protocol yet (needs sync)
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
        cementation_protocol: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2']);

    // Should sync e2 from e1 — both are "resina" regardless of cavity_class
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const syncData = mockUpdate.mock.calls[0][0];
    expect(syncData.recommended_resin_id).toBe('resin-1');
    expect(syncData.recommendation_text).toBe('Z350 recommended');

    // Target should be e2 only
    expect(mockIn).toHaveBeenCalledWith('id', ['e2']);
  });

  it('syncs porcelana group using cementation_protocol source', async () => {
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'porcelana',
        cavity_class: null,
        stratification_protocol: null,
        cementation_protocol: { cement_type: 'Resinoso', cement_brand: 'RelyX' },
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
      {
        id: 'e2',
        treatment_type: 'porcelana',
        cavity_class: null,
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2']);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const syncData = mockUpdate.mock.calls[0][0];
    expect(syncData.cementation_protocol).toEqual({
      cement_type: 'Resinoso',
      cement_brand: 'RelyX',
    });
    expect(mockIn).toHaveBeenCalledWith('id', ['e2']);
  });

  it('skips sync when only 1 evaluation in session', async () => {
    await syncGroupProtocols('session-1', ['e1']);
    // Should return early, no DB calls
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('skips sync when no source has a protocol (all null)', async () => {
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'resina',
        cavity_class: 'III',
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
      {
        id: 'e2',
        treatment_type: 'resina',
        cavity_class: 'III',
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2']);

    // No source found → no update calls
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does not cross-sync between resina and porcelana groups', async () => {
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'resina',
        cavity_class: 'III',
        stratification_protocol: { layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }] },
        cementation_protocol: null,
        recommended_resin_id: 'resin-1',
        recommendation_text: 'Z350',
        alternatives: [],
        is_from_inventory: false,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: false,
        protocol_layers: [],
        alerts: [],
        warnings: [],
      },
      {
        id: 'e2',
        treatment_type: 'porcelana',
        cavity_class: null,
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2']);

    // Resina group has only 1 member → skip. Porcelana has only 1 → skip.
    // No cross-sync should happen.
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does not sync generic treatment types (gengivoplastia, implante, etc.)', async () => {
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'gengivoplastia',
        cavity_class: null,
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
      {
        id: 'e2',
        treatment_type: 'gengivoplastia',
        cavity_class: null,
        stratification_protocol: null,
        cementation_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2']);

    // Generic treatments fall through the if/else — no sync
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles re-sync after add-more-teeth (existing + new evals)', async () => {
    // Simulates: session already had e1+e2 synced, now e3 was added.
    // syncGroupProtocols is called with all 3 IDs.
    mockEvaluations = [
      {
        id: 'e1',
        treatment_type: 'resina',
        cavity_class: 'III',
        stratification_protocol: { layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }] },
        recommended_resin_id: 'resin-1',
        recommendation_text: 'Z350',
        alternatives: [],
        is_from_inventory: false,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: false,
        protocol_layers: [],
        alerts: [],
        warnings: [],
        cementation_protocol: null,
      },
      {
        id: 'e2',
        treatment_type: 'resina',
        cavity_class: 'III',
        // Already synced from e1
        stratification_protocol: { layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }] },
        recommended_resin_id: 'resin-1',
        recommendation_text: 'Z350',
        alternatives: [],
        is_from_inventory: false,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: false,
        protocol_layers: [],
        alerts: [],
        warnings: [],
        cementation_protocol: null,
      },
      {
        id: 'e3',
        treatment_type: 'resina',
        cavity_class: 'IV',
        // New tooth — no protocol yet
        stratification_protocol: null,
        recommended_resin_id: null,
        recommendation_text: null,
        alternatives: null,
        is_from_inventory: null,
        ideal_resin_id: null,
        ideal_reason: null,
        has_inventory_at_creation: null,
        protocol_layers: null,
        alerts: null,
        warnings: null,
        cementation_protocol: null,
      },
    ];

    await syncGroupProtocols('session-1', ['e1', 'e2', 'e3']);

    // Source is e1 (first with protocol). Targets are e2 and e3.
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockIn).toHaveBeenCalledWith('id', ['e2', 'e3']);
  });

  it('tolerates DB query error without throwing', async () => {
    mockQueryError = new Error('connection lost');

    // Should not throw — syncGroupProtocols returns early on error with zero counts
    const result = await syncGroupProtocols('session-1', ['e1', 'e2']);
    expect(result).toEqual({ total: 0, synced: 0, failed: 0 });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// =========================================================================
// 5. groupByTreatment — "resina::no-resin" key specifically
// =========================================================================

describe('groupByTreatment — "resina::no-resin" key edge cases', () => {
  it('"resina::no-resin" is the exact key for resins: null, no layers', () => {
    const ev = makeEval({ id: 'e1', tooth: '11', resins: null });
    expect(getProtocolFingerprint(ev)).toBe('resina::no-resin');
  });

  it('bare "resina" key (treatment_type undefined) also merges as orphan', () => {
    // The merge logic checks for k === 'resina::no-resin' || k === 'resina'
    // but getProtocolFingerprint always produces at least 'resina::no-resin' for null resins.
    // This test verifies the fingerprint for null treatment_type + null resins.
    const ev = makeEval({ id: 'e1', tooth: '11', treatment_type: null, resins: null });
    // Default treatment_type is 'resina', resins null → 'resina::no-resin'
    expect(getProtocolFingerprint(ev)).toBe('resina::no-resin');
  });

  it('orphan merge preserves evaluation order (protocol group first)', () => {
    const evals: EvaluationItem[] = [
      makeEval({ id: 'orphan-1', tooth: '12', resins: null }),
      makeEval({
        id: 'primary',
        tooth: '11',
        resins: { name: 'Z350', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      makeEval({ id: 'orphan-2', tooth: '21', resins: null }),
    ];

    const groups = groupByTreatment(evals);
    const resinaGroup = groups.find(g => g.treatmentType === 'resina');
    expect(resinaGroup).toBeDefined();
    // Protocol group evals come first, orphans appended
    expect(resinaGroup!.evaluations[0].id).toBe('primary');
    expect(resinaGroup!.evaluations.map(e => e.id)).toEqual(['primary', 'orphan-1', 'orphan-2']);
  });

  it('two different resina fingerprints (different resins) stay as separate groups', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        resins: { name: 'Z350', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      makeEval({
        id: 'e2',
        tooth: '36',
        resins: { name: 'Charisma', manufacturer: 'Kulzer' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Charisma', shade: 'A3' }],
        },
      }),
    ];

    const groups = groupByTreatment(evals);
    const resinaGroups = groups.filter(g => g.treatmentType === 'resina');
    // Both have protocols with different resins → 2 separate groups
    expect(resinaGroups).toHaveLength(2);
  });

  it('resinName on group comes from first evaluation with resins', () => {
    const evals: EvaluationItem[] = [
      makeEval({
        id: 'e1',
        tooth: '11',
        resins: { name: 'Filtek Z350 XT', manufacturer: '3M' },
        stratification_protocol: {
          layers: [{ order: 1, resin_brand: 'Z350', shade: 'A2B' }],
        },
      }),
      makeEval({ id: 'e2', tooth: '12', resins: null }),
    ];

    const groups = groupByTreatment(evals);
    const resinaGroup = groups.find(g => g.treatmentType === 'resina');
    expect(resinaGroup?.resinName).toBe('Filtek Z350 XT');
  });
});
