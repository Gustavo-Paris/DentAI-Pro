import type { ReviewFormData } from '@/components/wizard/ReviewAnalysisStep';

export const INITIAL_FORM_DATA: ReviewFormData = {
  patientName: '',
  patientAge: '',
  tooth: '',
  toothRegion: 'anterior',
  cavityClass: 'Classe I',
  restorationSize: 'Média',
  vitaShade: 'A2',
  substrate: 'Esmalte e Dentina',
  substrateCondition: 'Saudável',
  enamelCondition: 'Íntegro',
  depth: 'Média',
  bruxism: false,
  aestheticLevel: 'estético',
  budget: 'padrão',
  longevityExpectation: 'médio',
  clinicalNotes: '',
  treatmentType: 'resina',
};

export const ANTERIOR_TEETH = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
