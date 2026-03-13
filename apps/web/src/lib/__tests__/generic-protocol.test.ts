import { describe, it, expect, vi } from 'vitest';
import { getGenericProtocol } from '../generic-protocol';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/lib/i18n', () => ({
  default: {
    t: (key: string, opts?: any) => {
      if (opts?.returnObjects) return [`${key}[0]`, `${key}[1]`, `${key}[2]`, `${key}[3]`];
      return key;
    },
  },
}));

describe('getGenericProtocol', () => {
  // Simple protocol types (non-encaminhamento)
  it('generates resina protocol', () => {
    const result = getGenericProtocol('resina', '11', { indication_reason: 'cárie' });
    expect(result.treatment_type).toBe('resina');
    expect(result.tooth).toBe('11');
    expect(result.ai_reason).toBe('cárie');
    expect(result.summary).toContain('protocols.resina.summary');
    expect(result.checklist).toHaveLength(4);
    expect(result.alerts).toHaveLength(4);
  });

  it('generates gengivoplastia protocol', () => {
    const result = getGenericProtocol('gengivoplastia', 'GENGIVO', undefined);
    expect(result.treatment_type).toBe('gengivoplastia');
    expect(result.ai_reason).toBeNull();
  });

  it('generates coroa protocol', () => {
    const result = getGenericProtocol('coroa', '16', { indication_reason: null });
    expect(result.treatment_type).toBe('coroa');
    expect(result.ai_reason).toBeNull();
  });

  it('generates implante protocol', () => {
    const result = getGenericProtocol('implante', '36', { indication_reason: 'perda dentária' });
    expect(result.treatment_type).toBe('implante');
    expect(result.ai_reason).toBe('perda dentária');
  });

  it('generates endodontia protocol', () => {
    const result = getGenericProtocol('endodontia', '11', { indication_reason: 'necrose pulpar' });
    expect(result.treatment_type).toBe('endodontia');
  });

  it('generates recobrimento_radicular protocol', () => {
    const result = getGenericProtocol('recobrimento_radicular', '31', undefined);
    expect(result.treatment_type).toBe('recobrimento_radicular');
  });

  // Encaminhamento with specialty detection
  it('generates encaminhamento for ortodontia', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Apinhamento severo' });
    expect(result.treatment_type).toBe('encaminhamento');
    expect(result.summary).toContain('protocols.encaminhamento.summary');
  });

  it('detects ortodontia from maloclusão', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Maloclusão classe II' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects ortodontia from alinhamento', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Problema de alinhamento' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects endodontia referral from canal', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Necessita tratamento de canal' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects endodontia referral from pulp', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Exposição pulpar' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects endodontia referral from periapical', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Lesão periapical' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects periodontia from perio keyword', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Doença periodontal' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects periodontia from gengiv keyword', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Sangramento gengival' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects periodontia from bolsa', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Bolsa periodontal profunda' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects periodontia from retração', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Retração gengival' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects cirurgia from implante', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Necessita implante' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects cirurgia from extração', () => {
    const result = getGenericProtocol('encaminhamento', '18', { indication_reason: 'Extração indicada' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects cirurgia from terceiro molar', () => {
    const result = getGenericProtocol('encaminhamento', '18', { indication_reason: 'Terceiro molar incluso' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects DTM from dtm keyword', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Sinais de DTM' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects DTM from atm keyword', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Disfunção ATM' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('detects DTM from articulação', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Dor na articulação' });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('handles encaminhamento with no matching specialty', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: 'Motivo genérico' });
    expect(result.treatment_type).toBe('encaminhamento');
    expect(result.checklist.length).toBeGreaterThan(0);
  });

  it('handles encaminhamento with null indication_reason', () => {
    const result = getGenericProtocol('encaminhamento', '11', { indication_reason: null });
    expect(result.treatment_type).toBe('encaminhamento');
  });

  it('handles encaminhamento with undefined toothData', () => {
    const result = getGenericProtocol('encaminhamento', '11', undefined);
    expect(result.treatment_type).toBe('encaminhamento');
    expect(result.ai_reason).toBeNull();
  });
});
