import type { TreatmentType } from '../ReviewAnalysisStep';

export const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

export const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'treatments.resina.label',
  porcelana: 'treatments.porcelana.label',
  coroa: 'treatments.coroa.label',
  implante: 'treatments.implante.label',
  endodontia: 'treatments.endodontia.label',
  encaminhamento: 'treatments.encaminhamento.label',
  gengivoplastia: 'treatments.gengivoplastia.label',
  recobrimento_radicular: 'treatments.recobrimento_radicular.label',
};

export const TREATMENT_DESC_KEYS: Record<TreatmentType, string> = {
  resina: 'treatments.resina.desc',
  porcelana: 'treatments.porcelana.desc',
  coroa: 'treatments.coroa.desc',
  implante: 'treatments.implante.desc',
  endodontia: 'treatments.endodontia.desc',
  encaminhamento: 'treatments.encaminhamento.desc',
  gengivoplastia: 'treatments.gengivoplastia.desc',
  recobrimento_radicular: 'treatments.recobrimento_radicular.desc',
};

export const TREATMENT_BORDER_COLORS: Record<TreatmentType, string> = {
  resina: 'border-l-primary',
  porcelana: 'border-l-amber-500',
  coroa: 'border-l-blue-500',
  implante: 'border-l-emerald-500',
  endodontia: 'border-l-red-500',
  encaminhamento: 'border-l-purple-500',
  gengivoplastia: 'border-l-pink-500',
  recobrimento_radicular: 'border-l-teal-500',
};
