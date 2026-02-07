import type { DetectedTooth } from '@/components/wizard/ReviewAnalysisStep';

export type ComplexityLevel = 'simples' | 'moderado' | 'complexo';

export interface ComplexityResult {
  level: ComplexityLevel;
  score: number;
}

export function calculateComplexity(teeth: DetectedTooth[]): ComplexityResult {
  if (!teeth || teeth.length === 0) {
    return { level: 'simples', score: 0 };
  }

  let score = 0;

  for (const tooth of teeth) {
    // Priority
    if (tooth.priority === 'alta') score += 3;
    else if (tooth.priority === 'média') score += 1;

    // Complex cavity classes
    if (tooth.cavity_class) {
      const cc = tooth.cavity_class.toUpperCase();
      if (cc.includes('IV') || cc.includes('V')) score += 2;
    }

    // Large restorations
    if (tooth.restoration_size) {
      const rs = tooth.restoration_size.toLowerCase();
      if (rs === 'grande' || rs === 'extensa') score += 2;
    }

    // Deep cavities
    if (tooth.depth) {
      const d = tooth.depth.toLowerCase();
      if (d === 'profunda') score += 2;
    }

    // Complex treatments
    if (tooth.treatment_indication) {
      const ti = tooth.treatment_indication.toLowerCase();
      if (ti === 'coroa' || ti === 'implante' || ti === 'endodontia') score += 3;
      if (ti === 'encaminhamento') score += 4;
    }
  }

  // Multiple teeth bonus
  if (teeth.length > 2) score += 2;

  const level: ComplexityLevel =
    score <= 4 ? 'simples' : score <= 10 ? 'moderado' : 'complexo';

  return { level, score };
}
