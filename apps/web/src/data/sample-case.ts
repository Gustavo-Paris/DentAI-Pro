// TODO: These types should be moved to src/types/ to avoid importing from component files.
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';

/**
 * Pre-computed sample case data for a Class IV resin restoration on tooth 21.
 * Used to demonstrate the wizard review step to new users.
 * No bundled photo — the UI shows a placeholder indicator.
 */

export const SAMPLE_ANALYSIS: PhotoAnalysisResult = {
  detected: true,
  confidence: 0.92,
  detected_teeth: [
    {
      tooth: '21',
      tooth_region: 'anterior-superior',
      cavity_class: 'Classe IV',
      restoration_size: 'Média',
      substrate: 'Esmalte e Dentina',
      substrate_condition: 'Saudável',
      enamel_condition: 'Íntegro',
      depth: 'Média',
      priority: 'alta',
      notes: 'Fratura mesio-incisal com perda de estrutura. Indicação de restauração direta em resina composta com protocolo de estratificação.',
      treatment_indication: 'resina',
      indication_reason:
        'Fratura classe IV com substrato saudável — restauração direta em resina composta é o tratamento de escolha para preservação de estrutura e resultado estético.',
    },
  ],
  primary_tooth: '21',
  vita_shade: 'A2',
  observations: [
    'Fratura mesio-incisal no dente 21 com exposição de dentina.',
    'Esmalte periférico em bom estado, favorecendo adesão.',
    'Cor A2 detectada — substrato uniforme.',
  ],
  warnings: [],
  treatment_indication: 'resina',
  indication_reason:
    'Fratura classe IV com substrato saudável — restauração direta em resina composta.',
};

export const SAMPLE_FORM_DATA: ReviewFormData = {
  patientName: 'Paciente Exemplo',
  patientAge: '32',
  tooth: '21',
  toothRegion: 'anterior-superior',
  cavityClass: 'Classe IV',
  restorationSize: 'Média',
  vitaShade: 'A2',
  substrate: 'Esmalte e Dentina',
  substrateCondition: 'Saudável',
  enamelCondition: 'Íntegro',
  depth: 'Média',
  bruxism: false,
  aestheticLevel: 'estético',
  budget: 'padrão',
  longevityExpectation: 'longo',
  clinicalNotes: '',
  treatmentType: 'resina',
};

export const SAMPLE_SELECTED_TEETH: string[] = ['21'];

export const SAMPLE_TOOTH_TREATMENTS: Record<string, TreatmentType> = {
  '21': 'resina',
};

export const SAMPLE_CASE = {
  analysisResult: SAMPLE_ANALYSIS,
  formData: SAMPLE_FORM_DATA,
  selectedTeeth: SAMPLE_SELECTED_TEETH,
  toothTreatments: SAMPLE_TOOTH_TREATMENTS,
} as const;
