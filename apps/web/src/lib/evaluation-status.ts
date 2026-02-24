export const EVALUATION_STATUS = {
  ANALYZING: 'analyzing',
  DRAFT: 'draft',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type EvaluationStatus = typeof EVALUATION_STATUS[keyof typeof EVALUATION_STATUS];
