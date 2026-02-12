import type { TreatmentType } from '../ReviewAnalysisStep';

export const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

export const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.treatmentRecobrimentoRadicular',
};

export const TREATMENT_DESC_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.descResina',
  porcelana: 'components.wizard.review.descPorcelana',
  coroa: 'components.wizard.review.descCoroa',
  implante: 'components.wizard.review.descImplante',
  endodontia: 'components.wizard.review.descEndodontia',
  encaminhamento: 'components.wizard.review.descEncaminhamento',
  gengivoplastia: 'components.wizard.review.descGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.descRecobrimentoRadicular',
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
