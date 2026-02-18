/**
 * Tests for edge function validation logic.
 * Imports the validation functions from supabase/functions/_shared/validation.ts
 * to test them in the vitest environment (pure functions, no Deno deps).
 */
import { describe, it, expect } from 'vitest';
import {
  validateEvaluationData,
  validateAnalyzePhotosData,
} from '../../../../../supabase/functions/_shared/validation';

// Helper: valid UUID
const UUID = '550e8400-e29b-41d4-a716-446655440000';

// Helper: minimal valid evaluation data
function validEvaluation() {
  return {
    evaluationId: UUID,
    userId: UUID,
    patientAge: '35',
    tooth: '11',
    region: 'anterior-superior',
    cavityClass: 'Classe IV',
    restorationSize: 'Média',
    substrate: 'Esmalte',
    aestheticLevel: 'estético',
    toothColor: 'A2',
    stratificationNeeded: true,
    bruxism: false,
    longevityExpectation: 'longo',
    budget: 'padrão',
  };
}


describe('validateEvaluationData', () => {
  it('should accept valid complete data', () => {
    const result = validateEvaluationData(validEvaluation());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.evaluationId).toBe(UUID);
  });

  it('should reject null input', () => {
    expect(validateEvaluationData(null).success).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(validateEvaluationData('string').success).toBe(false);
  });

  it('should reject invalid evaluationId', () => {
    const data = { ...validEvaluation(), evaluationId: 'not-uuid' };
    const result = validateEvaluationData(data);
    expect(result.success).toBe(false);
    expect(result.error).toContain('avaliação');
  });

  it('should reject invalid userId', () => {
    const data = { ...validEvaluation(), userId: 'bad' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should reject non-numeric patient age', () => {
    const data = { ...validEvaluation(), patientAge: 'abc' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should reject invalid tooth number', () => {
    const data = { ...validEvaluation(), tooth: '99' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should accept valid tooth numbers (FDI notation)', () => {
    for (const tooth of ['11', '18', '21', '28', '31', '38', '41', '48']) {
      const data = { ...validEvaluation(), tooth };
      expect(validateEvaluationData(data).success).toBe(true);
    }
  });

  it('should reject invalid region', () => {
    const data = { ...validEvaluation(), region: 'somewhere' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should reject invalid cavity class', () => {
    const data = { ...validEvaluation(), cavityClass: 'Classe X' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should accept aesthetic procedures as cavity class', () => {
    const data = { ...validEvaluation(), cavityClass: 'Faceta Direta' };
    expect(validateEvaluationData(data).success).toBe(true);
  });

  it('should reject invalid VITA shade', () => {
    const data = { ...validEvaluation(), toothColor: 'Z99' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should accept bleach shades', () => {
    const data = { ...validEvaluation(), toothColor: 'BL2' };
    expect(validateEvaluationData(data).success).toBe(true);
  });

  it('should reject non-boolean stratification', () => {
    const data = { ...validEvaluation(), stratificationNeeded: 'yes' };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should accept optional fields', () => {
    const data = {
      ...validEvaluation(),
      depth: 'rasa',
      substrateCondition: 'saudável',
      enamelCondition: 'íntegro',
      clinicalNotes: 'Paciente cooperativo',
      aestheticGoals: 'Natural',
    };
    const result = validateEvaluationData(data);
    expect(result.success).toBe(true);
  });

  it('should reject clinicalNotes over 2000 chars', () => {
    const data = { ...validEvaluation(), clinicalNotes: 'a'.repeat(2001) };
    expect(validateEvaluationData(data).success).toBe(false);
  });

  it('should reject aestheticGoals over 1000 chars', () => {
    const data = { ...validEvaluation(), aestheticGoals: 'a'.repeat(1001) };
    expect(validateEvaluationData(data).success).toBe(false);
  });
});


describe('validateAnalyzePhotosData', () => {
  it('should accept valid data with only evaluationId', () => {
    const result = validateAnalyzePhotosData({ evaluationId: UUID });
    expect(result.success).toBe(true);
    expect(result.data!.evaluationId).toBe(UUID);
  });

  it('should reject invalid evaluationId', () => {
    expect(validateAnalyzePhotosData({ evaluationId: 'bad' }).success).toBe(false);
  });

  it('should reject null', () => {
    expect(validateAnalyzePhotosData(null).success).toBe(false);
  });

  it('should accept optional photo paths', () => {
    const result = validateAnalyzePhotosData({
      evaluationId: UUID,
      photoFrontal: 'photos/front.jpg',
      photo45: 'photos/45.jpg',
      photoFace: 'photos/face.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('should reject photo path over 500 chars', () => {
    const result = validateAnalyzePhotosData({
      evaluationId: UUID,
      photoFrontal: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
