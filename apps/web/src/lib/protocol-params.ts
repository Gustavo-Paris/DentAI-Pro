import { getFullRegion } from '@/hooks/domain/wizard/helpers';
import { DEFAULT_CERAMIC_TYPE } from '@/lib/protocol-dispatch';
import type { ResinDispatchParams, CementationDispatchParams } from '@/lib/protocol-dispatch';

// ---------------------------------------------------------------------------
// ResinParams builder
// ---------------------------------------------------------------------------

export interface ResinParamsInput {
  userId: string;
  patientAge: string;
  tooth: string;
  region?: string;
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  bruxism: boolean;
  aestheticLevel: string;
  toothColor: string;
  budget: string;
  longevityExpectation: string;
  substrateCondition?: string | null;
  enamelCondition?: string | null;
  depth?: string | null;
  aestheticGoals?: string;
  dsdContext?: ResinDispatchParams['dsdContext'];
  anamnesis?: string | null;
}

export function buildResinParams(input: ResinParamsInput): Omit<ResinDispatchParams, 'evaluationId' | 'operationId'> {
  return {
    userId: input.userId,
    patientAge: input.patientAge,
    tooth: input.tooth,
    region: input.region || getFullRegion(input.tooth),
    cavityClass: input.cavityClass,
    restorationSize: input.restorationSize,
    substrate: input.substrate,
    bruxism: input.bruxism,
    aestheticLevel: input.aestheticLevel,
    toothColor: input.toothColor,
    stratificationNeeded: true,
    budget: input.budget,
    longevityExpectation: input.longevityExpectation,
    substrateCondition: input.substrateCondition ?? undefined,
    enamelCondition: input.enamelCondition ?? undefined,
    depth: input.depth ?? undefined,
    aestheticGoals: input.aestheticGoals,
    dsdContext: input.dsdContext,
    anamnesis: input.anamnesis ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// CementationParams builder
// ---------------------------------------------------------------------------

export interface CementationParamsInput {
  tooth: string;
  shade: string;
  substrate: string;
  substrateCondition?: string;
  aestheticGoals?: string;
  anamnesis?: string | null;
  dsdContext?: CementationDispatchParams['dsdContext'];
}

export function buildCementationParams(input: CementationParamsInput): Omit<CementationDispatchParams, 'evaluationId' | 'operationId'> {
  return {
    teeth: [input.tooth],
    shade: input.shade,
    ceramicType: DEFAULT_CERAMIC_TYPE,
    substrate: input.substrate,
    substrateCondition: input.substrateCondition || 'Saudável',
    aestheticGoals: input.aestheticGoals,
    anamnesis: input.anamnesis ?? undefined,
    dsdContext: input.dsdContext,
  };
}
