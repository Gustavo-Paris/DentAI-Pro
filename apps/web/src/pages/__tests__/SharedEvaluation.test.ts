import { describe, it, expect } from 'vitest';

// Unit tests for SharedEvaluation logic

const treatmentLabels: Record<string, { label: string }> = {
  resina: { label: 'Resina Composta' },
  porcelana: { label: 'Faceta de Porcelana' },
  coroa: { label: 'Coroa Total' },
  implante: { label: 'Implante' },
  endodontia: { label: 'Endodontia' },
  encaminhamento: { label: 'Encaminhamento' },
};

describe('SharedEvaluation treatment labels', () => {
  it('resolves all known treatment types', () => {
    const types = ['resina', 'porcelana', 'coroa', 'implante', 'endodontia', 'encaminhamento'];
    types.forEach((type) => {
      const treatment = treatmentLabels[type];
      expect(treatment).toBeDefined();
      expect(treatment.label).toBeTruthy();
    });
  });

  it('falls back for null treatment type', () => {
    const treatmentType: string | null = null;
    const treatment = treatmentLabels[treatmentType || 'resina'];
    expect(treatment.label).toBe('Resina Composta');
  });

  it('returns undefined for unknown treatment type', () => {
    const treatment = treatmentLabels['unknown'];
    expect(treatment).toBeUndefined();
  });
});

describe('SharedEvaluation expiry check', () => {
  it('detects expired links', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    expect(new Date(pastDate) < new Date()).toBe(true);
  });

  it('detects valid links', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    expect(new Date(futureDate) < new Date()).toBe(false);
  });
});

describe('SharedEvaluation statistics', () => {
  interface SharedEval {
    tooth: string;
    treatment_type: string | null;
    status: string | null;
  }

  it('counts completed evaluations', () => {
    const evaluations: SharedEval[] = [
      { tooth: '11', treatment_type: 'resina', status: 'completed' },
      { tooth: '12', treatment_type: 'resina', status: 'pending' },
      { tooth: '21', treatment_type: 'porcelana', status: 'completed' },
    ];

    const completedCount = evaluations.filter((e) => e.status === 'completed').length;
    expect(completedCount).toBe(2);
  });

  it('pluralizes tooth count correctly', () => {
    const count1 = 1;
    const count3 = 3;
    expect(`${count1} dente${count1 > 1 ? 's' : ''} avaliado${count1 > 1 ? 's' : ''}`).toBe(
      '1 dente avaliado'
    );
    expect(`${count3} dente${count3 > 1 ? 's' : ''} avaliado${count3 > 1 ? 's' : ''}`).toBe(
      '3 dentes avaliados'
    );
  });

  it('pluralizes completion count correctly', () => {
    const count1 = 1;
    const count2 = 2;
    expect(`concluído${count1 !== 1 ? 's' : ''}`).toBe('concluído');
    expect(`concluído${count2 !== 1 ? 's' : ''}`).toBe('concluídos');
  });
});
