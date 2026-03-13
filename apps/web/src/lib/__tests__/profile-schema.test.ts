import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  default: {
    t: (key: string) => key,
  },
}));

import { getProfileSchema } from '../schemas/profile';

describe('getProfileSchema', () => {
  const schema = getProfileSchema();

  describe('full_name', () => {
    it('should accept valid names', () => {
      expect(schema.parse({ full_name: 'John Doe' })).toMatchObject({ full_name: 'John Doe' });
    });

    it('should trim whitespace', () => {
      const result = schema.parse({ full_name: '  Maria Silva  ' });
      expect(result.full_name).toBe('Maria Silva');
    });

    it('should reject names shorter than 2 characters', () => {
      const result = schema.safeParse({ full_name: 'J' });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = schema.safeParse({ full_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 100 characters', () => {
      const result = schema.safeParse({ full_name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should accept name of exactly 2 characters', () => {
      const result = schema.safeParse({ full_name: 'Jo' });
      expect(result.success).toBe(true);
    });

    it('should accept name of exactly 100 characters', () => {
      const result = schema.safeParse({ full_name: 'A'.repeat(100) });
      expect(result.success).toBe(true);
    });
  });

  describe('cro', () => {
    it('should accept valid CRO', () => {
      const result = schema.parse({ full_name: 'Test', cro: 'SP-12345' });
      expect(result.cro).toBe('SP-12345');
    });

    it('should accept empty string', () => {
      const result = schema.parse({ full_name: 'Test', cro: '' });
      expect(result.cro).toBe('');
    });

    it('should accept undefined (optional)', () => {
      const result = schema.parse({ full_name: 'Test' });
      expect(result.cro).toBeUndefined();
    });

    it('should reject special characters', () => {
      const result = schema.safeParse({ full_name: 'Test', cro: 'SP@123' });
      expect(result.success).toBe(false);
    });

    it('should reject CRO longer than 10 characters', () => {
      const result = schema.safeParse({ full_name: 'Test', cro: '12345678901' });
      expect(result.success).toBe(false);
    });

    it('should accept CRO with slash', () => {
      const result = schema.parse({ full_name: 'Test', cro: 'CRO/12345' });
      expect(result.cro).toBe('CRO/12345');
    });

    it('should trim CRO', () => {
      const result = schema.parse({ full_name: 'Test', cro: '  SP123  ' });
      expect(result.cro).toBe('SP123');
    });
  });

  describe('clinic_name', () => {
    it('should accept valid clinic name', () => {
      const result = schema.parse({ full_name: 'Test', clinic_name: 'My Clinic' });
      expect(result.clinic_name).toBe('My Clinic');
    });

    it('should accept empty string', () => {
      const result = schema.parse({ full_name: 'Test', clinic_name: '' });
      expect(result.clinic_name).toBe('');
    });

    it('should accept undefined (optional)', () => {
      const result = schema.parse({ full_name: 'Test' });
      expect(result.clinic_name).toBeUndefined();
    });

    it('should reject clinic name longer than 100 characters', () => {
      const result = schema.safeParse({ full_name: 'Test', clinic_name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should trim clinic name', () => {
      const result = schema.parse({ full_name: 'Test', clinic_name: '  Clinic X  ' });
      expect(result.clinic_name).toBe('Clinic X');
    });
  });

  describe('phone', () => {
    it('should accept valid phone numbers', () => {
      const result = schema.parse({ full_name: 'Test', phone: '11987654321' });
      expect(result.phone).toBe('11987654321');
    });

    it('should accept empty string', () => {
      const result = schema.parse({ full_name: 'Test', phone: '' });
      expect(result.phone).toBe('');
    });

    it('should accept undefined (optional)', () => {
      const result = schema.parse({ full_name: 'Test' });
      expect(result.phone).toBeUndefined();
    });

    it('should reject phone shorter than 8 characters', () => {
      const result = schema.safeParse({ full_name: 'Test', phone: '1234567' });
      expect(result.success).toBe(false);
    });

    it('should accept phone of exactly 8 characters', () => {
      const result = schema.safeParse({ full_name: 'Test', phone: '12345678' });
      expect(result.success).toBe(true);
    });

    it('should trim phone', () => {
      const result = schema.parse({ full_name: 'Test', phone: '  12345678  ' });
      expect(result.phone).toBe('12345678');
    });
  });

  describe('combined validation', () => {
    it('should parse complete valid form data', () => {
      const result = schema.parse({
        full_name: 'Dr. Maria Silva',
        cro: 'SP-1234',
        clinic_name: 'Dental Care',
        phone: '11987654321',
      });
      expect(result).toEqual({
        full_name: 'Dr. Maria Silva',
        cro: 'SP-1234',
        clinic_name: 'Dental Care',
        phone: '11987654321',
      });
    });

    it('should parse minimal valid form data (only full_name)', () => {
      const result = schema.parse({ full_name: 'Jo' });
      expect(result.full_name).toBe('Jo');
    });
  });
});
