import { describe, it, expect } from 'vitest';
import { reviewFormSchema, patientPreferencesSchema } from '../schemas/evaluation';

describe('reviewFormSchema', () => {
  const validData = {
    patientName: 'Maria Silva',
    patientAge: '35',
    tooth: '11',
    toothRegion: 'anterior' as const,
    cavityClass: 'Classe III',
    restorationSize: 'Média' as const,
    vitaShade: 'A2',
    substrate: 'Esmalte',
    bruxism: false,
    aestheticLevel: 'alto' as const,
    budget: 'moderado' as const,
    longevityExpectation: 'médio' as const,
    treatmentType: 'resina' as const,
  };

  it('should accept valid evaluation data', () => {
    const result = reviewFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept empty patient name', () => {
    const result = reviewFormSchema.safeParse({
      ...validData,
      patientName: '',
    });
    expect(result.success).toBe(true);
  });

  it('should reject patient name longer than 100 characters', () => {
    const result = reviewFormSchema.safeParse({
      ...validData,
      patientName: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  describe('patientAge validation', () => {
    it('should accept valid age as string', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '45',
      });
      expect(result.success).toBe(true);
    });

    it('should accept age 0', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '0',
      });
      expect(result.success).toBe(true);
    });

    it('should accept age 120', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '120',
      });
      expect(result.success).toBe(true);
    });

    it('should reject age over 120', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '121',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative age', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '-5',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric age', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: 'abc',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty age', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        patientAge: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('toothRegion validation', () => {
    it('should accept anterior', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        toothRegion: 'anterior',
      });
      expect(result.success).toBe(true);
    });

    it('should accept posterior', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        toothRegion: 'posterior',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid region', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        toothRegion: 'lateral',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('restorationSize validation', () => {
    it.each(['Pequena', 'Média', 'Grande', 'Extensa'] as const)(
      'should accept %s',
      (size) => {
        const result = reviewFormSchema.safeParse({
          ...validData,
          restorationSize: size,
        });
        expect(result.success).toBe(true);
      }
    );

    it('should reject invalid size', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        restorationSize: 'Enorme',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('depth validation', () => {
    it.each(['Rasa', 'Média', 'Profunda'] as const)(
      'should accept depth %s',
      (depth) => {
        const result = reviewFormSchema.safeParse({
          ...validData,
          depth,
        });
        expect(result.success).toBe(true);
      }
    );

    it('should accept undefined depth', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        depth: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('aestheticLevel validation', () => {
    it.each(['básico', 'alto', 'muito alto'] as const)(
      'should accept %s',
      (level) => {
        const result = reviewFormSchema.safeParse({
          ...validData,
          aestheticLevel: level,
        });
        expect(result.success).toBe(true);
      }
    );
  });

  describe('budget validation', () => {
    it.each(['econômico', 'moderado', 'premium'] as const)(
      'should accept budget %s',
      (budget) => {
        const result = reviewFormSchema.safeParse({
          ...validData,
          budget,
        });
        expect(result.success).toBe(true);
      }
    );
  });

  describe('longevityExpectation validation', () => {
    it.each(['curto', 'médio', 'longo'] as const)(
      'should accept longevity %s',
      (longevity) => {
        const result = reviewFormSchema.safeParse({
          ...validData,
          longevityExpectation: longevity,
        });
        expect(result.success).toBe(true);
      }
    );
  });

  describe('treatmentType validation', () => {
    it.each([
      'resina',
      'porcelana',
      'coroa',
      'implante',
      'endodontia',
      'encaminhamento',
    ] as const)('should accept treatment type %s', (type) => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        treatmentType: type,
      });
      expect(result.success).toBe(true);
    });

    it('should default to resina', () => {
      const dataWithoutType = { ...validData };
      delete (dataWithoutType as Record<string, unknown>).treatmentType;
      
      const result = reviewFormSchema.safeParse(dataWithoutType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.treatmentType).toBe('resina');
      }
    });
  });

  describe('clinicalNotes validation', () => {
    it('should accept valid clinical notes', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        clinicalNotes: 'Paciente apresenta sensibilidade.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty clinical notes', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        clinicalNotes: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject notes longer than 500 characters', () => {
      const result = reviewFormSchema.safeParse({
        ...validData,
        clinicalNotes: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('patientPreferencesSchema', () => {
  it('should accept valid aesthetic goals', () => {
    const result = patientPreferencesSchema.safeParse({
      aestheticGoals: 'Gostaria de dentes mais brancos e naturais',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty preferences', () => {
    const result = patientPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept empty string for aestheticGoals', () => {
    const result = patientPreferencesSchema.safeParse({ aestheticGoals: '' });
    expect(result.success).toBe(true);
  });

  it('should reject aestheticGoals longer than 500 characters', () => {
    const result = patientPreferencesSchema.safeParse({
      aestheticGoals: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
