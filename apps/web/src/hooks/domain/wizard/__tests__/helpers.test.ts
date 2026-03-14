import { describe, it, expect, vi } from 'vitest';
import {
  isAnterior,
  inferCavityClass,
  getFullRegion,
  getToothData,
  getToothTreatment,
  normalizeTreatment,
  normalizeRestorationSize,
  normalizeSubstrate,
} from '../helpers';

vi.mock('@/lib/treatment-config', () => ({
  normalizeTreatmentType: (raw: string) => raw.toLowerCase(),
  treatmentConfig: {},
}));

vi.mock('@/lib/generic-protocol', () => ({
  getGenericProtocol: vi.fn(),
}));

describe('isAnterior', () => {
  it('returns true for upper anterior teeth (11-13, 21-23)', () => {
    expect(isAnterior('11')).toBe(true);
    expect(isAnterior('12')).toBe(true);
    expect(isAnterior('13')).toBe(true);
    expect(isAnterior('21')).toBe(true);
    expect(isAnterior('22')).toBe(true);
    expect(isAnterior('23')).toBe(true);
  });

  it('returns true for lower anterior teeth (31-33, 41-43)', () => {
    expect(isAnterior('31')).toBe(true);
    expect(isAnterior('32')).toBe(true);
    expect(isAnterior('33')).toBe(true);
    expect(isAnterior('41')).toBe(true);
    expect(isAnterior('42')).toBe(true);
    expect(isAnterior('43')).toBe(true);
  });

  it('returns false for posterior teeth', () => {
    expect(isAnterior('14')).toBe(false);
    expect(isAnterior('15')).toBe(false);
    expect(isAnterior('16')).toBe(false);
    expect(isAnterior('17')).toBe(false);
    expect(isAnterior('18')).toBe(false);
    expect(isAnterior('24')).toBe(false);
    expect(isAnterior('36')).toBe(false);
    expect(isAnterior('47')).toBe(false);
  });
});

describe('getFullRegion', () => {
  it('returns anterior-superior for upper anterior teeth', () => {
    expect(getFullRegion('11')).toBe('anterior-superior');
    expect(getFullRegion('13')).toBe('anterior-superior');
    expect(getFullRegion('21')).toBe('anterior-superior');
  });

  it('returns anterior-inferior for lower anterior teeth', () => {
    expect(getFullRegion('31')).toBe('anterior-inferior');
    expect(getFullRegion('33')).toBe('anterior-inferior');
    expect(getFullRegion('41')).toBe('anterior-inferior');
  });

  it('returns posterior-superior for upper posterior teeth', () => {
    expect(getFullRegion('14')).toBe('posterior-superior');
    expect(getFullRegion('16')).toBe('posterior-superior');
    expect(getFullRegion('27')).toBe('posterior-superior');
  });

  it('returns posterior-inferior for lower posterior teeth', () => {
    expect(getFullRegion('34')).toBe('posterior-inferior');
    expect(getFullRegion('36')).toBe('posterior-inferior');
    expect(getFullRegion('47')).toBe('posterior-inferior');
  });
});

describe('inferCavityClass', () => {
  it('returns toothData.cavity_class when present', () => {
    const result = inferCavityClass(
      { cavity_class: 'Classe II', indication_reason: 'cárie' } as any,
      'Classe I',
    );
    expect(result).toBe('Classe II');
  });

  it('infers Lente de Contato from indication_reason', () => {
    expect(inferCavityClass({ indication_reason: 'lente de contato' } as any, 'Classe I')).toBe('Lente de Contato');
    expect(inferCavityClass({ indication_reason: 'falta de contato' } as any, 'Classe I')).toBe('Lente de Contato');
  });

  it('infers Recontorno Estético from reanatomização', () => {
    expect(inferCavityClass({ indication_reason: 'reanatomização dental' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Recontorno Estético from microdontia', () => {
    expect(inferCavityClass({ indication_reason: 'microdontia' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Recontorno Estético from volume', () => {
    expect(inferCavityClass({ indication_reason: 'falta de volume' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Recontorno Estético from conoide', () => {
    expect(inferCavityClass({ indication_reason: 'dente conoide' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Fechamento de Diastema from diastema', () => {
    expect(inferCavityClass({ indication_reason: 'diastema' } as any, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('infers Fechamento de Diastema from espaçamento', () => {
    expect(inferCavityClass({ indication_reason: 'espaçamento entre dentes' } as any, 'Classe I')).toBe('Fechamento de Diastema');
  });

  it('infers Faceta Direta from faceta', () => {
    expect(inferCavityClass({ indication_reason: 'faceta direta' } as any, 'Classe I')).toBe('Faceta Direta');
  });

  it('infers Reparo de Restauração from reparo', () => {
    expect(inferCavityClass({ indication_reason: 'reparo necessário' } as any, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('infers Reparo de Restauração from substituição', () => {
    expect(inferCavityClass({ indication_reason: 'substituição de restauração' } as any, 'Classe I')).toBe('Reparo de Restauração');
  });

  it('infers Recontorno Estético from desgaste', () => {
    expect(inferCavityClass({ indication_reason: 'desgaste incisal' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Recontorno Estético from incisal keyword', () => {
    expect(inferCavityClass({ indication_reason: 'bordo incisal' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('infers Recontorno Estético from recontorno keyword', () => {
    expect(inferCavityClass({ indication_reason: 'recontorno dental' } as any, 'Classe I')).toBe('Recontorno Estético');
  });

  it('returns Faceta Direta for porcelana with Class fallback', () => {
    expect(inferCavityClass({ indication_reason: '' } as any, 'Classe I', 'porcelana')).toBe('Faceta Direta');
    expect(inferCavityClass({ indication_reason: '' } as any, 'Classe II', 'porcelana')).toBe('Faceta Direta');
  });

  it('returns fallback for porcelana with non-Class fallback', () => {
    expect(inferCavityClass({ indication_reason: '' } as any, 'Faceta Direta', 'porcelana')).toBe('Faceta Direta');
  });

  it('returns fallback when no match', () => {
    expect(inferCavityClass({ indication_reason: 'cárie simples' } as any, 'Classe I')).toBe('Classe I');
  });

  it('handles undefined toothData', () => {
    expect(inferCavityClass(undefined, 'Classe I')).toBe('Classe I');
  });

  it('handles toothData with null indication_reason', () => {
    expect(inferCavityClass({ indication_reason: null } as any, 'Classe I')).toBe('Classe I');
  });
});

describe('getToothData', () => {
  it('returns matching tooth data', () => {
    const analysis = {
      detected_teeth: [
        { tooth: '11', treatment_indication: 'resina' },
        { tooth: '21', treatment_indication: 'porcelana' },
      ],
    } as any;
    expect(getToothData(analysis, '11')?.treatment_indication).toBe('resina');
    expect(getToothData(analysis, '21')?.treatment_indication).toBe('porcelana');
  });

  it('returns undefined when tooth not found', () => {
    const analysis = {
      detected_teeth: [{ tooth: '11', treatment_indication: 'resina' }],
    } as any;
    expect(getToothData(analysis, '99')).toBeUndefined();
  });

  it('returns undefined when analysisResult is null', () => {
    expect(getToothData(null, '11')).toBeUndefined();
  });

  it('returns undefined when detected_teeth is undefined', () => {
    expect(getToothData({} as any, '11')).toBeUndefined();
  });
});

describe('getToothTreatment', () => {
  const formData = { treatmentType: 'resina' } as any;

  it('returns explicit override from toothTreatments', () => {
    expect(getToothTreatment('11', { '11': 'porcelana' }, null, formData)).toBe('porcelana');
  });

  it('falls back to AI detected treatment', () => {
    const analysis = {
      detected_teeth: [{ tooth: '11', treatment_indication: 'endodontia' }],
    } as any;
    expect(getToothTreatment('11', {}, analysis, formData)).toBe('endodontia');
  });

  it('falls back to formData.treatmentType', () => {
    expect(getToothTreatment('11', {}, null, formData)).toBe('resina');
  });

  it('falls back to resina when all are empty', () => {
    expect(getToothTreatment('11', {}, null, {} as any)).toBe('resina');
  });
});

describe('normalizeTreatment', () => {
  it('delegates to normalizeTreatmentType', () => {
    expect(normalizeTreatment('RESINA')).toBe('resina');
  });
});

describe('normalizeRestorationSize', () => {
  it('passes valid Portuguese values through', () => {
    expect(normalizeRestorationSize('Média')).toBe('Média');
    expect(normalizeRestorationSize('Pequena')).toBe('Pequena');
    expect(normalizeRestorationSize('Grande')).toBe('Grande');
    expect(normalizeRestorationSize('Extensa')).toBe('Extensa');
  });

  it('normalizes English values to Portuguese', () => {
    expect(normalizeRestorationSize('Medium')).toBe('Média');
    expect(normalizeRestorationSize('Small')).toBe('Pequena');
    expect(normalizeRestorationSize('Large')).toBe('Grande');
    expect(normalizeRestorationSize('Extensive')).toBe('Extensa');
  });

  it('handles case-insensitive input', () => {
    expect(normalizeRestorationSize('medium')).toBe('Média');
    expect(normalizeRestorationSize('LARGE')).toBe('Grande');
  });

  it('returns default Média for unknown values', () => {
    expect(normalizeRestorationSize('unknown')).toBe('Média');
    expect(normalizeRestorationSize('')).toBe('Média');
    expect(normalizeRestorationSize(undefined as any)).toBe('Média');
  });
});

describe('normalizeSubstrate', () => {
  it('passes valid Portuguese values through', () => {
    expect(normalizeSubstrate('Esmalte')).toBe('Esmalte');
    expect(normalizeSubstrate('Dentina')).toBe('Dentina');
    expect(normalizeSubstrate('Esmalte e Dentina')).toBe('Esmalte e Dentina');
    expect(normalizeSubstrate('Dentina profunda')).toBe('Dentina profunda');
  });

  it('normalizes English values', () => {
    expect(normalizeSubstrate('Enamel')).toBe('Esmalte');
    expect(normalizeSubstrate('Dentin')).toBe('Dentina');
    expect(normalizeSubstrate('Enamel and Dentin')).toBe('Esmalte e Dentina');
    expect(normalizeSubstrate('Deep Dentin')).toBe('Dentina profunda');
  });

  it('returns default for unknown values', () => {
    expect(normalizeSubstrate('unknown')).toBe('Esmalte e Dentina');
  });
});
