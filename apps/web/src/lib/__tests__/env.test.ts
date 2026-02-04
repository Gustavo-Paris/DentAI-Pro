import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the schema here to test independently of import.meta.env
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL deve ser uma URL válida'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY é obrigatória'),
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().default(''),
});

describe('env validation schema', () => {
  it('should accept valid required variables', () => {
    const result = envSchema.safeParse({
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.VITE_SENTRY_DSN).toBe('');
      expect(result.data.VITE_STRIPE_PUBLISHABLE_KEY).toBe('');
    }
  });

  it('should reject missing VITE_SUPABASE_URL', () => {
    const result = envSchema.safeParse({
      VITE_SUPABASE_PUBLISHABLE_KEY: 'some-key',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid VITE_SUPABASE_URL (not a URL)', () => {
    const result = envSchema.safeParse({
      VITE_SUPABASE_URL: 'not-a-url',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'some-key',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('URL');
    }
  });

  it('should reject empty VITE_SUPABASE_PUBLISHABLE_KEY', () => {
    const result = envSchema.safeParse({
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional variables when provided', () => {
    const result = envSchema.safeParse({
      VITE_SUPABASE_URL: 'https://abc.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'key',
      VITE_SENTRY_DSN: 'https://sentry.io/123',
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.VITE_SENTRY_DSN).toBe('https://sentry.io/123');
      expect(result.data.VITE_STRIPE_PUBLISHABLE_KEY).toBe('pk_test_abc');
    }
  });

  it('should reject when all required vars are missing', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});
