import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useOnboardingProgress
// The hook depends on React Query + AuthContext, so we test the step
// computation, completion percentage, and nextStep logic independently.
// ---------------------------------------------------------------------------

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

interface OnboardingData {
  caseCount: number;
  patientCount: number;
  inventoryCount: number;
}

// Mirrors the useMemo computation in useOnboardingProgress
function computeSteps(data: OnboardingData | null | undefined): OnboardingStep[] {
  return [
    {
      id: 'first-case',
      label: 'Primeira avaliação',
      description: 'Crie sua primeira avaliação com IA',
      href: '/new-case',
      completed: (data?.caseCount ?? 0) > 0,
    },
    {
      id: 'inventory',
      label: 'Cadastrar inventário',
      description: 'Adicione resinas para recomendações personalizadas',
      href: '/inventory',
      completed: (data?.inventoryCount ?? 0) > 0,
    },
    {
      id: 'patient',
      label: 'Cadastrar paciente',
      description: 'Organize seus pacientes e históricos',
      href: '/patients',
      completed: (data?.patientCount ?? 0) > 0,
    },
  ];
}

function computeProgress(steps: OnboardingStep[]) {
  const completedCount = steps.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;
  const nextStep = steps.find(s => !s.completed) ?? null;
  return { completedCount, completionPercentage, allComplete, nextStep };
}

describe('computeSteps', () => {
  it('should return 3 steps', () => {
    const steps = computeSteps(null);
    expect(steps).toHaveLength(3);
  });

  it('should have correct step ids', () => {
    const steps = computeSteps(null);
    expect(steps.map(s => s.id)).toEqual(['first-case', 'inventory', 'patient']);
  });

  it('should have correct hrefs', () => {
    const steps = computeSteps(null);
    expect(steps[0].href).toBe('/new-case');
    expect(steps[1].href).toBe('/inventory');
    expect(steps[2].href).toBe('/patients');
  });

  it('should mark all steps as incomplete when data is null', () => {
    const steps = computeSteps(null);
    steps.forEach(s => expect(s.completed).toBe(false));
  });

  it('should mark all steps as incomplete when data is undefined', () => {
    const steps = computeSteps(undefined);
    steps.forEach(s => expect(s.completed).toBe(false));
  });

  it('should mark all steps as incomplete when all counts are zero', () => {
    const steps = computeSteps({ caseCount: 0, patientCount: 0, inventoryCount: 0 });
    steps.forEach(s => expect(s.completed).toBe(false));
  });

  it('should mark first-case as complete when caseCount > 0', () => {
    const steps = computeSteps({ caseCount: 1, patientCount: 0, inventoryCount: 0 });
    expect(steps[0].completed).toBe(true);
    expect(steps[1].completed).toBe(false);
    expect(steps[2].completed).toBe(false);
  });

  it('should mark inventory as complete when inventoryCount > 0', () => {
    const steps = computeSteps({ caseCount: 0, patientCount: 0, inventoryCount: 5 });
    expect(steps[0].completed).toBe(false);
    expect(steps[1].completed).toBe(true);
    expect(steps[2].completed).toBe(false);
  });

  it('should mark patient as complete when patientCount > 0', () => {
    const steps = computeSteps({ caseCount: 0, patientCount: 3, inventoryCount: 0 });
    expect(steps[0].completed).toBe(false);
    expect(steps[1].completed).toBe(false);
    expect(steps[2].completed).toBe(true);
  });

  it('should mark all steps as complete when all counts > 0', () => {
    const steps = computeSteps({ caseCount: 10, patientCount: 5, inventoryCount: 20 });
    steps.forEach(s => expect(s.completed).toBe(true));
  });
});

describe('computeProgress', () => {
  it('should return 0% when no steps completed', () => {
    const steps = computeSteps({ caseCount: 0, patientCount: 0, inventoryCount: 0 });
    const progress = computeProgress(steps);
    expect(progress.completionPercentage).toBe(0);
    expect(progress.allComplete).toBe(false);
    expect(progress.completedCount).toBe(0);
  });

  it('should return 33% when 1 of 3 steps completed', () => {
    const steps = computeSteps({ caseCount: 1, patientCount: 0, inventoryCount: 0 });
    const progress = computeProgress(steps);
    expect(progress.completionPercentage).toBe(33);
    expect(progress.allComplete).toBe(false);
    expect(progress.completedCount).toBe(1);
  });

  it('should return 67% when 2 of 3 steps completed', () => {
    const steps = computeSteps({ caseCount: 1, patientCount: 0, inventoryCount: 3 });
    const progress = computeProgress(steps);
    expect(progress.completionPercentage).toBe(67);
    expect(progress.allComplete).toBe(false);
    expect(progress.completedCount).toBe(2);
  });

  it('should return 100% when all steps completed', () => {
    const steps = computeSteps({ caseCount: 5, patientCount: 3, inventoryCount: 10 });
    const progress = computeProgress(steps);
    expect(progress.completionPercentage).toBe(100);
    expect(progress.allComplete).toBe(true);
    expect(progress.completedCount).toBe(3);
  });
});

describe('nextStep', () => {
  it('should return first step when none completed', () => {
    const steps = computeSteps({ caseCount: 0, patientCount: 0, inventoryCount: 0 });
    const { nextStep } = computeProgress(steps);
    expect(nextStep).not.toBeNull();
    expect(nextStep!.id).toBe('first-case');
  });

  it('should return second step when first completed', () => {
    const steps = computeSteps({ caseCount: 1, patientCount: 0, inventoryCount: 0 });
    const { nextStep } = computeProgress(steps);
    expect(nextStep).not.toBeNull();
    expect(nextStep!.id).toBe('inventory');
  });

  it('should return third step when first two completed', () => {
    const steps = computeSteps({ caseCount: 1, patientCount: 0, inventoryCount: 5 });
    const { nextStep } = computeProgress(steps);
    expect(nextStep).not.toBeNull();
    expect(nextStep!.id).toBe('patient');
  });

  it('should return null when all steps completed', () => {
    const steps = computeSteps({ caseCount: 5, patientCount: 3, inventoryCount: 10 });
    const { nextStep } = computeProgress(steps);
    expect(nextStep).toBeNull();
  });

  it('should skip completed steps to find the first incomplete', () => {
    // Case: user registered inventory and patient but no cases
    const steps = computeSteps({ caseCount: 0, patientCount: 2, inventoryCount: 3 });
    const { nextStep } = computeProgress(steps);
    expect(nextStep!.id).toBe('first-case');
  });
});

// --- Step labels and descriptions (contract tests) ---

describe('step labels', () => {
  const steps = computeSteps(null);

  it('should have Portuguese labels', () => {
    expect(steps[0].label).toBe('Primeira avaliação');
    expect(steps[1].label).toBe('Cadastrar inventário');
    expect(steps[2].label).toBe('Cadastrar paciente');
  });

  it('should have non-empty descriptions', () => {
    steps.forEach(s => {
      expect(s.description.length).toBeGreaterThan(0);
    });
  });
});

// --- Edge cases ---

describe('edge cases', () => {
  it('should handle very large counts', () => {
    const steps = computeSteps({ caseCount: 999999, patientCount: 999999, inventoryCount: 999999 });
    const progress = computeProgress(steps);
    expect(progress.allComplete).toBe(true);
    expect(progress.completionPercentage).toBe(100);
  });

  it('should treat negative counts as not completed (> 0 check)', () => {
    // While unlikely in practice, the > 0 check means negative counts = not completed
    const steps = computeSteps({ caseCount: -1, patientCount: -1, inventoryCount: -1 });
    steps.forEach(s => expect(s.completed).toBe(false));
    const progress = computeProgress(steps);
    expect(progress.completionPercentage).toBe(0);
  });
});
