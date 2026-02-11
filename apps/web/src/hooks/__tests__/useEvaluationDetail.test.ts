import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useEvaluationDetail
// The hook depends on React Query, AuthContext, useParams, useNavigate, etc.
// We test the extractable helper functions independently.
// ---------------------------------------------------------------------------

// Minimal types mirroring the hook
interface StratificationProtocol {
  checklist?: string[];
}

interface CementationProtocol {
  checklist?: string[];
}

interface EvaluationItem {
  id: string;
  treatment_type: string | null;
  cavity_class: string;
  restoration_size: string;
  status: string | null;
  ai_treatment_indication: string | null;
  checklist_progress: number[] | null;
  stratification_protocol: StratificationProtocol | null;
  cementation_protocol: CementationProtocol | null;
  generic_protocol: { checklist?: string[] } | null;
  patient_name: string | null;
  patient_age: number;
  patient_id: string | null;
  tooth_color: string;
  bruxism: boolean;
  aesthetic_level: string;
  budget: string;
  longevity_expectation: string;
  patient_aesthetic_goals?: string | null;
  photo_frontal: string | null;
  created_at: string;
  tooth: string;
  dsd_analysis?: Record<string, unknown> | null;
  dsd_simulation_url?: string | null;
  dsd_simulation_layers?: Array<{ type: string; simulation_url: string | null }> | null;
  resins?: { name: string; manufacturer: string } | null;
}

// Mirror helper functions from useEvaluationDetail

const AESTHETIC_PROCEDURES = [
  'Faceta Direta',
  'Recontorno Estético',
  'Fechamento de Diastema',
  'Reparo de Restauração',
  'Lente de Contato',
];

function getChecklist(evaluation: EvaluationItem): string[] {
  const treatmentType = evaluation.treatment_type || 'resina';
  switch (treatmentType) {
    case 'porcelana':
      return (evaluation.cementation_protocol as CementationProtocol)?.checklist || [];
    case 'coroa':
    case 'implante':
    case 'endodontia':
    case 'encaminhamento':
      return evaluation.generic_protocol?.checklist || [];
    default:
      return evaluation.stratification_protocol?.checklist || [];
  }
}

function isChecklistComplete(evaluation: EvaluationItem): boolean {
  const checklist = getChecklist(evaluation);
  const progress = evaluation.checklist_progress || [];
  if (checklist.length === 0) return true;
  return progress.length >= checklist.length;
}

function getChecklistProgress(evaluation: EvaluationItem): { current: number; total: number } {
  const checklist = getChecklist(evaluation);
  const progress = evaluation.checklist_progress || [];
  return { current: progress.length, total: checklist.length };
}

function canMarkAsCompleted(evaluation: EvaluationItem): boolean {
  return evaluation.status !== 'completed';
}

function getClinicalDetails(evaluation: EvaluationItem): string {
  const treatmentType = evaluation.treatment_type || 'resina';
  const showCavityInfo = treatmentType === 'resina';

  if (showCavityInfo) {
    if (AESTHETIC_PROCEDURES.includes(evaluation.cavity_class)) {
      return evaluation.cavity_class;
    }
    const cavityLabel = evaluation.cavity_class.startsWith('Classe ')
      ? evaluation.cavity_class
      : `Classe ${evaluation.cavity_class}`;
    return `${cavityLabel} • ${evaluation.restoration_size}`;
  }

  return evaluation.ai_treatment_indication || '-';
}

// Base evaluation for convenience
const baseEval: EvaluationItem = {
  id: 'e1',
  treatment_type: 'resina',
  cavity_class: 'III',
  restoration_size: 'Média',
  status: 'pending',
  ai_treatment_indication: null,
  checklist_progress: null,
  stratification_protocol: null,
  cementation_protocol: null,
  generic_protocol: null,
  patient_name: 'João',
  patient_age: 35,
  patient_id: 'p1',
  tooth_color: 'A2',
  bruxism: false,
  aesthetic_level: 'estético',
  budget: 'padrão',
  longevity_expectation: 'médio',
  patient_aesthetic_goals: null,
  photo_frontal: null,
  created_at: '2025-01-01T10:00:00Z',
  tooth: '11',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getChecklist', () => {
  it('should return stratification checklist for resina treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: { checklist: ['Step 1', 'Step 2'] },
    };
    expect(getChecklist(eval1)).toEqual(['Step 1', 'Step 2']);
  });

  it('should return cementation checklist for porcelana treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: { checklist: ['Prep 1', 'Prep 2'] },
    };
    expect(getChecklist(eval1)).toEqual(['Prep 1', 'Prep 2']);
  });

  it('should return generic checklist for coroa treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'coroa',
      generic_protocol: { checklist: ['Crown step 1'] },
    };
    expect(getChecklist(eval1)).toEqual(['Crown step 1']);
  });

  it('should return generic checklist for implante treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'implante',
      generic_protocol: { checklist: ['Implant step 1'] },
    };
    expect(getChecklist(eval1)).toEqual(['Implant step 1']);
  });

  it('should return generic checklist for endodontia treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'endodontia',
      generic_protocol: { checklist: ['Endo step 1'] },
    };
    expect(getChecklist(eval1)).toEqual(['Endo step 1']);
  });

  it('should return generic checklist for encaminhamento treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'encaminhamento',
      generic_protocol: { checklist: ['Referral step'] },
    };
    expect(getChecklist(eval1)).toEqual(['Referral step']);
  });

  it('should default to resina (stratification) when treatment_type is null', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: null,
      stratification_protocol: { checklist: ['Default step'] },
    };
    expect(getChecklist(eval1)).toEqual(['Default step']);
  });

  it('should return empty array when protocol is null', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'resina',
      stratification_protocol: null,
    };
    expect(getChecklist(eval1)).toEqual([]);
  });

  it('should return empty array when protocol checklist is missing', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'porcelana',
      cementation_protocol: {} as CementationProtocol,
    };
    expect(getChecklist(eval1)).toEqual([]);
  });
});

describe('isChecklistComplete', () => {
  it('should return true when no checklist exists', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: null,
    };
    expect(isChecklistComplete(eval1)).toBe(true);
  });

  it('should return true when checklist is empty', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: [] },
    };
    expect(isChecklistComplete(eval1)).toBe(true);
  });

  it('should return true when all checklist items are progressed', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B', 'C'] },
      checklist_progress: [0, 1, 2],
    };
    expect(isChecklistComplete(eval1)).toBe(true);
  });

  it('should return false when not all items are progressed', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B', 'C'] },
      checklist_progress: [0, 1],
    };
    expect(isChecklistComplete(eval1)).toBe(false);
  });

  it('should return false when no progress recorded', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B'] },
      checklist_progress: null,
    };
    expect(isChecklistComplete(eval1)).toBe(false);
  });

  it('should return true when progress exceeds checklist length', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B'] },
      checklist_progress: [0, 1, 2, 3],
    };
    expect(isChecklistComplete(eval1)).toBe(true);
  });
});

describe('getChecklistProgress', () => {
  it('should return zero progress for no checklist', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: null,
      checklist_progress: null,
    };
    expect(getChecklistProgress(eval1)).toEqual({ current: 0, total: 0 });
  });

  it('should return current and total counts', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B', 'C', 'D'] },
      checklist_progress: [0, 1],
    };
    expect(getChecklistProgress(eval1)).toEqual({ current: 2, total: 4 });
  });

  it('should handle null progress as zero', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      stratification_protocol: { checklist: ['A', 'B'] },
      checklist_progress: null,
    };
    expect(getChecklistProgress(eval1)).toEqual({ current: 0, total: 2 });
  });
});

describe('canMarkAsCompleted', () => {
  it('should return true for pending status', () => {
    expect(canMarkAsCompleted({ ...baseEval, status: 'pending' })).toBe(true);
  });

  it('should return true for draft status', () => {
    expect(canMarkAsCompleted({ ...baseEval, status: 'draft' })).toBe(true);
  });

  it('should return false for completed status', () => {
    expect(canMarkAsCompleted({ ...baseEval, status: 'completed' })).toBe(false);
  });

  it('should return true for null status', () => {
    expect(canMarkAsCompleted({ ...baseEval, status: null })).toBe(true);
  });
});

describe('getClinicalDetails', () => {
  it('should show cavity class and restoration size for resina treatment', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'resina',
      cavity_class: 'III',
      restoration_size: 'Média',
    };
    expect(getClinicalDetails(eval1)).toBe('Classe III • Média');
  });

  it('should not prefix "Classe" when already present', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'resina',
      cavity_class: 'Classe II',
      restoration_size: 'Grande',
    };
    expect(getClinicalDetails(eval1)).toBe('Classe II • Grande');
  });

  it('should return aesthetic procedure name directly', () => {
    for (const proc of AESTHETIC_PROCEDURES) {
      const eval1: EvaluationItem = {
        ...baseEval,
        treatment_type: 'resina',
        cavity_class: proc,
      };
      expect(getClinicalDetails(eval1)).toBe(proc);
    }
  });

  it('should return ai_treatment_indication for non-resina treatments', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'porcelana',
      ai_treatment_indication: 'Coroa total metalocerâmica',
    };
    expect(getClinicalDetails(eval1)).toBe('Coroa total metalocerâmica');
  });

  it('should return dash when ai_treatment_indication is null for non-resina', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: 'coroa',
      ai_treatment_indication: null,
    };
    expect(getClinicalDetails(eval1)).toBe('-');
  });

  it('should default to resina when treatment_type is null', () => {
    const eval1: EvaluationItem = {
      ...baseEval,
      treatment_type: null,
      cavity_class: 'IV',
      restoration_size: 'Pequena',
    };
    expect(getClinicalDetails(eval1)).toBe('Classe IV • Pequena');
  });
});

describe('patientDataForModal computation', () => {
  function computePatientData(evals: EvaluationItem[]) {
    if (evals.length === 0) return null;
    const first = evals[0];
    return {
      name: first.patient_name,
      age: first.patient_age || 30,
      id: first.patient_id,
      vitaShade: first.tooth_color || 'A2',
      bruxism: first.bruxism || false,
      aestheticLevel: first.aesthetic_level || 'estético',
      budget: first.budget || 'padrão',
      longevityExpectation: first.longevity_expectation || 'médio',
      photoPath: first.photo_frontal,
      aestheticGoals: first.patient_aesthetic_goals ?? null,
    };
  }

  it('should return null for empty evaluations', () => {
    expect(computePatientData([])).toBeNull();
  });

  it('should extract patient data from first evaluation', () => {
    const result = computePatientData([baseEval]);
    expect(result).toEqual({
      name: 'João',
      age: 35,
      id: 'p1',
      vitaShade: 'A2',
      bruxism: false,
      aestheticLevel: 'estético',
      budget: 'padrão',
      longevityExpectation: 'médio',
      photoPath: null,
      aestheticGoals: null,
    });
  });

  it('should default age to 30 when zero/falsy', () => {
    const eval1: EvaluationItem = { ...baseEval, patient_age: 0 };
    const result = computePatientData([eval1]);
    expect(result!.age).toBe(30);
  });

  it('should default tooth_color to A2 when empty', () => {
    const eval1: EvaluationItem = { ...baseEval, tooth_color: '' };
    const result = computePatientData([eval1]);
    expect(result!.vitaShade).toBe('A2');
  });
});

describe('completedCount computation', () => {
  it('should count completed evaluations', () => {
    const evals: EvaluationItem[] = [
      { ...baseEval, id: 'e1', status: 'completed' },
      { ...baseEval, id: 'e2', status: 'pending' },
      { ...baseEval, id: 'e3', status: 'completed' },
      { ...baseEval, id: 'e4', status: null },
    ];
    const completedCount = evals.filter((e) => e.status === 'completed').length;
    expect(completedCount).toBe(2);
  });

  it('should return 0 when none completed', () => {
    const evals: EvaluationItem[] = [
      { ...baseEval, id: 'e1', status: 'pending' },
      { ...baseEval, id: 'e2', status: 'draft' },
    ];
    const completedCount = evals.filter((e) => e.status === 'completed').length;
    expect(completedCount).toBe(0);
  });
});
