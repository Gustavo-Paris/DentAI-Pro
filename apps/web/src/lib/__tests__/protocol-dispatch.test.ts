import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dispatchTreatmentProtocol,
  evaluationClients,
  DEFAULT_CERAMIC_TYPE,
  type ProtocolDispatchClients,
  type DispatchTreatmentProtocolParams,
  type ResinDispatchParams,
  type CementationDispatchParams,
} from '../protocol-dispatch';
import type { TreatmentType } from '@/lib/treatment-config';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/generic-protocol', () => ({
  getGenericProtocol: vi.fn((_type: string, tooth: string) => ({
    treatment_type: _type,
    tooth,
    ai_reason: null,
    summary: `Generic ${_type} for ${tooth}`,
    checklist: ['step 1'],
    alerts: [],
    recommendations: [],
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/data', () => ({
  evaluations: {
    invokeEdgeFunction: vi.fn().mockResolvedValue(undefined),
    updateEvaluation: vi.fn().mockResolvedValue(undefined),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockClients(): ProtocolDispatchClients {
  return {
    invokeResin: vi.fn().mockResolvedValue(undefined),
    invokeCementation: vi.fn().mockResolvedValue(undefined),
    saveGenericProtocol: vi.fn().mockResolvedValue(undefined),
  };
}

const BASE_RESIN_PARAMS: Omit<ResinDispatchParams, 'evaluationId'> = {
  userId: 'user-1',
  patientAge: '35',
  tooth: '11',
  region: 'anterior',
  cavityClass: 'Classe II',
  restorationSize: 'média',
  substrate: 'esmalte',
  bruxism: false,
  aestheticLevel: 'alto',
  toothColor: 'A2',
  stratificationNeeded: true,
  budget: 'premium',
  longevityExpectation: 'longa',
};

const BASE_CEMENTATION_PARAMS: Omit<CementationDispatchParams, 'evaluationId'> = {
  teeth: ['11', '21'],
  shade: 'A2',
  ceramicType: DEFAULT_CERAMIC_TYPE,
  substrate: 'esmalte',
  substrateCondition: 'íntegro',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dispatchTreatmentProtocol', () => {
  // -----------------------------------------------------------------------
  // Resina branch
  // -----------------------------------------------------------------------
  describe('resina', () => {
    it('should call invokeResin with correct params', async () => {
      const clients = createMockClients();
      await dispatchTreatmentProtocol(
        {
          treatmentType: 'resina',
          evaluationId: 'eval-1',
          tooth: '11',
          resinParams: BASE_RESIN_PARAMS,
        },
        clients,
      );

      expect(clients.invokeResin).toHaveBeenCalledWith({
        evaluationId: 'eval-1',
        ...BASE_RESIN_PARAMS,
      });
      expect(clients.invokeCementation).not.toHaveBeenCalled();
      expect(clients.saveGenericProtocol).not.toHaveBeenCalled();
    });

    it('should throw when resinParams missing', async () => {
      const clients = createMockClients();
      await expect(
        dispatchTreatmentProtocol(
          { treatmentType: 'resina', evaluationId: 'eval-1', tooth: '11' },
          clients,
        ),
      ).rejects.toThrow('resinParams required');
    });

    it('should propagate invokeResin errors', async () => {
      const clients = createMockClients();
      (clients.invokeResin as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('edge fn fail'));

      await expect(
        dispatchTreatmentProtocol(
          { treatmentType: 'resina', evaluationId: 'eval-1', tooth: '11', resinParams: BASE_RESIN_PARAMS },
          clients,
        ),
      ).rejects.toThrow('edge fn fail');
    });
  });

  // -----------------------------------------------------------------------
  // Porcelana branch
  // -----------------------------------------------------------------------
  describe('porcelana', () => {
    it('should call invokeCementation with correct params', async () => {
      const clients = createMockClients();
      await dispatchTreatmentProtocol(
        {
          treatmentType: 'porcelana',
          evaluationId: 'eval-2',
          tooth: '21',
          cementationParams: BASE_CEMENTATION_PARAMS,
        },
        clients,
      );

      expect(clients.invokeCementation).toHaveBeenCalledWith({
        evaluationId: 'eval-2',
        ...BASE_CEMENTATION_PARAMS,
      });
      expect(clients.invokeResin).not.toHaveBeenCalled();
      expect(clients.saveGenericProtocol).not.toHaveBeenCalled();
    });

    it('should throw when cementationParams missing', async () => {
      const clients = createMockClients();
      await expect(
        dispatchTreatmentProtocol(
          { treatmentType: 'porcelana', evaluationId: 'eval-2', tooth: '21' },
          clients,
        ),
      ).rejects.toThrow('cementationParams required');
    });

    it('should propagate invokeCementation errors', async () => {
      const clients = createMockClients();
      (clients.invokeCementation as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('cementation fail'));

      await expect(
        dispatchTreatmentProtocol(
          { treatmentType: 'porcelana', evaluationId: 'eval-2', tooth: '21', cementationParams: BASE_CEMENTATION_PARAMS },
          clients,
        ),
      ).rejects.toThrow('cementation fail');
    });
  });

  // -----------------------------------------------------------------------
  // Generic treatment types
  // -----------------------------------------------------------------------
  describe.each([
    'implante',
    'coroa',
    'endodontia',
    'encaminhamento',
    'gengivoplastia',
    'recobrimento_radicular',
  ] as TreatmentType[])('%s (generic)', (treatmentType) => {
    it('should save a generic protocol', async () => {
      const clients = createMockClients();
      await dispatchTreatmentProtocol(
        { treatmentType, evaluationId: 'eval-3', tooth: '14' },
        clients,
      );

      expect(clients.saveGenericProtocol).toHaveBeenCalledWith('eval-3', expect.objectContaining({
        treatment_type: treatmentType,
        tooth: '14',
      }));
      expect(clients.invokeResin).not.toHaveBeenCalled();
      expect(clients.invokeCementation).not.toHaveBeenCalled();
    });

    it('should pass genericToothData to getGenericProtocol', async () => {
      const { getGenericProtocol } = await import('@/lib/generic-protocol');
      const clients = createMockClients();

      await dispatchTreatmentProtocol(
        {
          treatmentType,
          evaluationId: 'eval-3',
          tooth: '14',
          genericToothData: { indication_reason: 'cárie profunda' },
        },
        clients,
      );

      expect(getGenericProtocol).toHaveBeenCalledWith(treatmentType, '14', { indication_reason: 'cárie profunda' });
    });

    it('should call enrichGenericProtocol when provided', async () => {
      const clients = createMockClients();
      const enrich = vi.fn();

      await dispatchTreatmentProtocol(
        {
          treatmentType,
          evaluationId: 'eval-3',
          tooth: '14',
          enrichGenericProtocol: enrich,
        },
        clients,
      );

      expect(enrich).toHaveBeenCalledWith(expect.objectContaining({
        treatment_type: treatmentType,
        tooth: '14',
      }));
    });
  });

  // -----------------------------------------------------------------------
  // Default fallback
  // -----------------------------------------------------------------------
  describe('default fallback', () => {
    it('should generate a generic protocol for unrecognized types', async () => {
      const clients = createMockClients();
      await dispatchTreatmentProtocol(
        { treatmentType: 'faceta_resina' as TreatmentType, evaluationId: 'eval-4', tooth: '11' },
        clients,
      );

      expect(clients.saveGenericProtocol).toHaveBeenCalledWith('eval-4', expect.objectContaining({
        treatment_type: 'faceta_resina',
        tooth: '11',
      }));
    });

    it('should log a warning for unrecognized types', async () => {
      const { logger } = await import('@/lib/logger');
      const clients = createMockClients();

      await dispatchTreatmentProtocol(
        { treatmentType: 'unknown_type' as TreatmentType, evaluationId: 'eval-5', tooth: '22' },
        clients,
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unrecognized treatment type "unknown_type"'),
      );
    });

    it('should call enrichGenericProtocol in default branch', async () => {
      const clients = createMockClients();
      const enrich = vi.fn();

      await dispatchTreatmentProtocol(
        {
          treatmentType: 'faceta_resina' as TreatmentType,
          evaluationId: 'eval-4',
          tooth: '11',
          enrichGenericProtocol: enrich,
        },
        clients,
      );

      expect(enrich).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// evaluationClients
// ---------------------------------------------------------------------------

describe('evaluationClients', () => {
  it('should have all three adapter methods', () => {
    expect(evaluationClients).toHaveProperty('invokeResin');
    expect(evaluationClients).toHaveProperty('invokeCementation');
    expect(evaluationClients).toHaveProperty('saveGenericProtocol');
  });

  it('invokeResin should call evaluations.invokeEdgeFunction', async () => {
    const { evaluations } = await import('@/data');
    await evaluationClients.invokeResin({ evaluationId: 'e1' } as ResinDispatchParams);
    expect(evaluations.invokeEdgeFunction).toHaveBeenCalledWith('recommend-resin', expect.any(Object));
  });

  it('invokeCementation should call evaluations.invokeEdgeFunction', async () => {
    const { evaluations } = await import('@/data');
    await evaluationClients.invokeCementation({ evaluationId: 'e2' } as CementationDispatchParams);
    expect(evaluations.invokeEdgeFunction).toHaveBeenCalledWith('recommend-cementation', expect.any(Object));
  });

  it('saveGenericProtocol should call evaluations.updateEvaluation', async () => {
    const { evaluations } = await import('@/data');
    const protocol = {
      treatment_type: 'implante',
      tooth: '11',
      ai_reason: null,
      summary: 'test',
      checklist: [],
      alerts: [],
      recommendations: [],
    };

    await evaluationClients.saveGenericProtocol('e3', protocol);
    expect(evaluations.updateEvaluation).toHaveBeenCalledWith('e3', {
      generic_protocol: protocol,
      recommendation_text: 'test',
    });
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('DEFAULT_CERAMIC_TYPE', () => {
  it('should be Dissilicato de lítio', () => {
    expect(DEFAULT_CERAMIC_TYPE).toBe('Dissilicato de lítio');
  });
});
