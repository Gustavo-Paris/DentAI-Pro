/**
 * Shared treatment protocol dispatch.
 *
 * Eliminates the 4x switch(treatmentType) duplication across:
 *   1. useWizardSubmit — wizard initial submit
 *   2. useEvaluationDetail.handleSubmitTeeth — add-more-teeth
 *   3. useEvaluationDetail.handleRetryEvaluation — retry failed evaluation
 *   4. useEvaluationDetail.handleRegenerateWithBudget — regenerate with new budget
 *
 * Each call site passes its own data-client adapters so the dispatch logic
 * stays agnostic of whether the caller uses wizard.ts or evaluations.ts.
 */

import type { TreatmentType } from '@/lib/treatment-config';
import { getGenericProtocol } from '@/hooks/domain/wizard/helpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default ceramic type used across all porcelana dispatches. */
export const DEFAULT_CERAMIC_TYPE = 'Dissilicato de lítio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for the resin (resina) edge function call. */
export interface ResinDispatchParams {
  evaluationId: string;
  userId: string;
  patientAge: string;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  bruxism: boolean;
  aestheticLevel: string;
  toothColor: string;
  stratificationNeeded: boolean;
  budget: string;
  longevityExpectation: string;
  aestheticGoals?: string;
  dsdContext?: {
    currentIssue: string;
    proposedChange: string;
    observations: string[];
    smileLine?: string;
    faceShape?: string;
    symmetryScore?: number;
    smileArc?: string;
  };
}

/** Parameters for the cementation (porcelana) edge function call. */
export interface CementationDispatchParams {
  evaluationId: string;
  teeth: string[];
  shade: string;
  ceramicType: string;
  substrate: string;
  substrateCondition: string;
  aestheticGoals?: string;
  dsdContext?: {
    currentIssue: string;
    proposedChange: string;
    observations: string[];
  };
}

/** Generic protocol result shape (matches getGenericProtocol output). */
export interface GenericProtocolResult {
  summary: string;
  checklist: string[];
  alerts: string[];
  recommendations: string[];
  treatment_type: string;
  tooth: string;
  ai_reason: string | null;
}

/** Minimal tooth data needed by getGenericProtocol. */
export interface GenericToothData {
  indication_reason?: string | null;
}

/**
 * Data-client adapters injected by each call site.
 *
 * This keeps the dispatch function decoupled from the specific data layer
 * (wizard.ts vs evaluations.ts) used at each call site.
 */
export interface ProtocolDispatchClients {
  /** Invoke the recommend-resin edge function. */
  invokeResin: (params: ResinDispatchParams) => Promise<void>;
  /** Invoke the recommend-cementation edge function. */
  invokeCementation: (params: CementationDispatchParams) => Promise<void>;
  /** Save a generic protocol to the evaluation record. */
  saveGenericProtocol: (evaluationId: string, protocol: GenericProtocolResult) => Promise<void>;
}

/** All parameters needed for a single dispatch call. */
export interface DispatchTreatmentProtocolParams {
  treatmentType: TreatmentType;
  evaluationId: string;
  /** Resin-specific params. Required when treatmentType === 'resina'. */
  resinParams?: Omit<ResinDispatchParams, 'evaluationId'>;
  /** Cementation-specific params. Required when treatmentType === 'porcelana'. */
  cementationParams?: Omit<CementationDispatchParams, 'evaluationId'>;
  /** Tooth data for generic protocols. */
  genericToothData?: GenericToothData;
  /** Tooth number (used by generic protocols). */
  tooth: string;
  /** Optional enrichment callback for the generic protocol (e.g. DSD gengivoplasty details). */
  enrichGenericProtocol?: (protocol: GenericProtocolResult) => void;
}

// ---------------------------------------------------------------------------
// Dispatch function
// ---------------------------------------------------------------------------

/**
 * Dispatch a treatment protocol generation based on the treatment type.
 *
 * - resina: calls invokeResin with the full payload
 * - porcelana: calls invokeCementation
 * - generic types (implante, coroa, endodontia, encaminhamento, gengivoplastia,
 *   recobrimento_radicular): builds a generic protocol via getGenericProtocol
 *   and saves it via saveGenericProtocol
 *
 * @throws if the underlying edge function or DB update fails
 */
export async function dispatchTreatmentProtocol(
  params: DispatchTreatmentProtocolParams,
  clients: ProtocolDispatchClients,
): Promise<void> {
  const { treatmentType, evaluationId, tooth } = params;

  switch (treatmentType) {
    case 'resina': {
      if (!params.resinParams) {
        throw new Error('resinParams required for resina treatment type');
      }
      await clients.invokeResin({
        evaluationId,
        ...params.resinParams,
      });
      break;
    }

    case 'porcelana': {
      if (!params.cementationParams) {
        throw new Error('cementationParams required for porcelana treatment type');
      }
      await clients.invokeCementation({
        evaluationId,
        ...params.cementationParams,
      });
      break;
    }

    case 'implante':
    case 'coroa':
    case 'endodontia':
    case 'encaminhamento':
    case 'gengivoplastia':
    case 'recobrimento_radicular': {
      const genericProtocol = getGenericProtocol(treatmentType, tooth, params.genericToothData);
      // Allow the caller to enrich the protocol (e.g. with DSD gengivoplasty details)
      if (params.enrichGenericProtocol) {
        params.enrichGenericProtocol(genericProtocol);
      }
      await clients.saveGenericProtocol(evaluationId, genericProtocol);
      break;
    }
  }
}
