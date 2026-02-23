import { z } from 'zod';
import i18n from '@/lib/i18n';

export const reviewFormSchema = z.object({
  patientName: z.string()
    .trim()
    .max(100, i18n.t('validation.nameTooLong'))
    .optional()
    .or(z.literal('')),
  patientAge: z.string()
    .min(1, i18n.t('validation.ageRequired'))
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 120;
    }, i18n.t('validation.ageInvalid')),
  tooth: z.string()
    .min(1, i18n.t('validation.selectTooth')),
  toothRegion: z.enum(['anterior', 'posterior']),
  cavityClass: z.string().min(1, i18n.t('validation.procedureTypeRequired'))
    .refine((val) => [
      // Restaurador tradicional
      'Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V', 'Classe VI',
      // Procedimentos estéticos
      'Faceta Direta', 'Recontorno Estético', 'Fechamento de Diastema', 'Reparo de Restauração', 'Lente de Contato'
    ].includes(val), i18n.t('validation.procedureTypeInvalid')),
  restorationSize: z.enum(['Pequena', 'Média', 'Grande', 'Extensa']),
  vitaShade: z.string().min(1, i18n.t('validation.shadeRequired')),
  substrate: z.string().min(1, i18n.t('validation.substrateRequired')),
  substrateCondition: z.string().optional(),
  enamelCondition: z.string().optional(),
  depth: z.enum(['Rasa', 'Média', 'Profunda']).optional(),
  bruxism: z.boolean().default(false),
  aestheticLevel: z.enum(['funcional', 'estético']),
  budget: z.enum(['padrão', 'premium']),
  longevityExpectation: z.enum(['curto', 'médio', 'longo']).default('médio'),
  clinicalNotes: z.string()
    .max(500, i18n.t('validation.notesTooLong'))
    .optional()
    .or(z.literal('')),
  treatmentType: z.enum([
    'resina',
    'porcelana',
    'coroa',
    'implante',
    'endodontia',
    'encaminhamento',
    'gengivoplastia',
    'recobrimento_radicular',
  ]).default('resina'),
});

export const patientPreferencesSchema = z.object({
  aestheticGoals: z.string().max(500, i18n.t('validation.textTooLong')).optional().or(z.literal('')),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
export type PatientPreferencesData = z.infer<typeof patientPreferencesSchema>;
