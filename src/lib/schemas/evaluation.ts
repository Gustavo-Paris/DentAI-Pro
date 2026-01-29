import { z } from 'zod';

export const reviewFormSchema = z.object({
  patientName: z.string()
    .trim()
    .max(100, 'Nome muito longo')
    .optional()
    .or(z.literal('')),
  patientAge: z.string()
    .min(1, 'Idade é obrigatória')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 && num <= 120;
    }, 'Idade inválida (0-120)'),
  tooth: z.string()
    .min(1, 'Selecione um dente'),
  toothRegion: z.enum(['anterior', 'posterior']),
  cavityClass: z.string().min(1, 'Classe é obrigatória'),
  restorationSize: z.enum(['Pequena', 'Média', 'Grande', 'Extensa']),
  vitaShade: z.string().min(1, 'Cor é obrigatória'),
  substrate: z.string().min(1, 'Substrato é obrigatório'),
  substrateCondition: z.string().optional(),
  enamelCondition: z.string().optional(),
  depth: z.enum(['Rasa', 'Média', 'Profunda']).optional(),
  bruxism: z.boolean().default(false),
  aestheticLevel: z.enum(['básico', 'alto', 'muito alto']),
  budget: z.enum(['econômico', 'moderado', 'premium']),
  longevityExpectation: z.enum(['curto', 'médio', 'longo']),
  clinicalNotes: z.string()
    .max(500, 'Notas muito longas')
    .optional()
    .or(z.literal('')),
  treatmentType: z.enum([
    'resina',
    'porcelana',
    'coroa',
    'implante',
    'endodontia',
    'encaminhamento',
  ]).default('resina'),
});

export const patientPreferencesSchema = z.object({
  desiredChanges: z.array(z.string()).default([]),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
export type PatientPreferencesData = z.infer<typeof patientPreferencesSchema>;
