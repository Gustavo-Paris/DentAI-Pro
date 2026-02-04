import { z } from 'zod';

// Reusable password schema with complexity requirements
const passwordSchema = z.string()
  .min(12, 'Senha deve ter pelo menos 12 caracteres')
  .max(100, 'Senha muito longa')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Senha deve conter pelo menos uma letra maiúscula'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Senha deve conter pelo menos uma letra minúscula'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Senha deve conter pelo menos um número'
  )
  .refine(
    (val) => /[^A-Za-z0-9]/.test(val),
    'Senha deve conter pelo menos um caractere especial (!@#$%^&*)'
  );

// Simpler password schema for login (don't validate complexity on login)
const loginPasswordSchema = z.string()
  .min(1, 'Senha é obrigatória')
  .max(100, 'Senha muito longa');

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: passwordSchema,
  confirmPassword: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
  fullName: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  cro: z.string()
    .trim()
    .max(20, 'CRO muito longo')
    .optional()
    .or(z.literal('')),
  acceptedTerms: z.boolean()
    .refine(val => val === true, 'Você precisa aceitar os Termos de Uso'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// Password requirements for UI display
export const PASSWORD_REQUIREMENTS = [
  { label: 'Mínimo 12 caracteres', test: (val: string) => val.length >= 12 },
  { label: 'Uma letra maiúscula', test: (val: string) => /[A-Z]/.test(val) },
  { label: 'Uma letra minúscula', test: (val: string) => /[a-z]/.test(val) },
  { label: 'Um número', test: (val: string) => /[0-9]/.test(val) },
  { label: 'Um caractere especial (!@#$%^&*)', test: (val: string) => /[^A-Za-z0-9]/.test(val) },
];

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
