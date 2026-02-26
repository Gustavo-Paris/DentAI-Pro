import { z } from 'zod';
import i18n from '@/lib/i18n';

export function getProfileSchema() {
  return z.object({
    full_name: z.string()
      .trim()
      .min(2, i18n.t('profile.validation.nameMinChars'))
      .max(100, i18n.t('profile.validation.nameTooLong')),
    cro: z.string()
      .trim()
      .regex(/^[A-Za-z0-9\-/]*$/, i18n.t('profile.validation.croFormat'))
      .max(10, i18n.t('profile.validation.croTooLong'))
      .optional()
      .or(z.literal('')),
    clinic_name: z.string()
      .trim()
      .max(100, i18n.t('profile.validation.clinicNameTooLong'))
      .optional()
      .or(z.literal('')),
    phone: z.string()
      .trim()
      .refine(
        (val) => !val || val.length >= 8,
        i18n.t('profile.validation.phoneMinChars'),
      )
      .optional()
      .or(z.literal('')),
  });
}

export type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;
