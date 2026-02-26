import { z } from 'zod';
import i18n from '@/lib/i18n';

// Reusable password schema with complexity requirements — getter so i18n.t() evaluates at validation time
function getPasswordSchema() {
  return z.string()
    .min(12, i18n.t('auth.validation.passwordMinChars'))
    .max(100, i18n.t('auth.validation.passwordTooLong'))
    .refine(
      (val) => /[A-Z]/.test(val),
      i18n.t('auth.validation.passwordUppercase'),
    )
    .refine(
      (val) => /[a-z]/.test(val),
      i18n.t('auth.validation.passwordLowercase'),
    )
    .refine(
      (val) => /[0-9]/.test(val),
      i18n.t('auth.validation.passwordNumber'),
    )
    .refine(
      (val) => /[^A-Za-z0-9]/.test(val),
      i18n.t('auth.validation.passwordSpecial'),
    );
}

// Simpler password schema for login (don't validate complexity on login)
function getLoginPasswordSchema() {
  return z.string()
    .min(1, i18n.t('auth.validation.passwordRequired'))
    .max(100, i18n.t('auth.validation.passwordTooLong'));
}

function getEmailSchema() {
  return z.string()
    .trim()
    .min(1, i18n.t('auth.validation.emailRequired'))
    .email(i18n.t('auth.validation.emailInvalid'))
    .max(255, i18n.t('auth.validation.emailTooLong'));
}

export function getLoginSchema() {
  return z.object({
    email: getEmailSchema(),
    password: getLoginPasswordSchema(),
  });
}

export function getRegisterSchema() {
  return z.object({
    email: getEmailSchema(),
    password: getPasswordSchema(),
    confirmPassword: z.string()
      .min(1, i18n.t('auth.validation.confirmPasswordRequired')),
    fullName: z.string()
      .trim()
      .min(2, i18n.t('auth.validation.nameMinChars'))
      .max(100, i18n.t('auth.validation.nameTooLong')),
    cro: z.string()
      .trim()
      .max(20, i18n.t('auth.validation.croTooLong'))
      .optional()
      .or(z.literal('')),
    acceptedTerms: z.boolean()
      .refine(val => val === true, i18n.t('auth.validation.acceptTerms')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: i18n.t('auth.validation.passwordsMismatch'),
    path: ['confirmPassword'],
  });
}

export function getForgotPasswordSchema() {
  return z.object({
    email: getEmailSchema(),
  });
}

export function getResetPasswordSchema() {
  return z.object({
    password: getPasswordSchema(),
    confirmPassword: z.string()
      .min(1, i18n.t('auth.validation.confirmPasswordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: i18n.t('auth.validation.passwordsMismatch'),
    path: ['confirmPassword'],
  });
}

// Password requirements for UI display — getter function so i18n.t() evaluates at call time
export function getPasswordRequirements(): Array<{ label: string; test: (val: string) => boolean }> {
  return [
    { label: i18n.t('auth.validation.minChars'), test: (val: string) => val.length >= 12 },
    { label: i18n.t('auth.validation.uppercase'), test: (val: string) => /[A-Z]/.test(val) },
    { label: i18n.t('auth.validation.lowercase'), test: (val: string) => /[a-z]/.test(val) },
    { label: i18n.t('auth.validation.number'), test: (val: string) => /[0-9]/.test(val) },
    { label: i18n.t('auth.validation.special'), test: (val: string) => /[^A-Za-z0-9]/.test(val) },
  ];
}

export type LoginFormData = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof getRegisterSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof getResetPasswordSchema>>;
