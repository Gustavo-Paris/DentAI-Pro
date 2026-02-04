import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  PASSWORD_REQUIREMENTS,
} from '../schemas/auth';

describe('loginSchema', () => {
  it('should accept valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('obrigatório');
    }
  });

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('inválido');
    }
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should trim email whitespace', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should reject email longer than 255 characters', () => {
    const result = loginSchema.safeParse({
      email: 'a'.repeat(250) + '@test.com',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    email: 'user@example.com',
    password: 'Secure@Pass123',
    confirmPassword: 'Secure@Pass123',
    fullName: 'João Silva',
    acceptedTerms: true,
  };

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept optional CRO field', () => {
    const result = registerSchema.safeParse({
      ...validData,
      cro: 'SP-12345',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty CRO field', () => {
    const result = registerSchema.safeParse({
      ...validData,
      cro: '',
    });
    expect(result.success).toBe(true);
  });

  describe('password complexity', () => {
    it('should reject password shorter than 12 characters', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'Short@1',
        confirmPassword: 'Short@1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('12 caracteres'))).toBe(true);
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'secure@pass123',
        confirmPassword: 'secure@pass123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('maiúscula'))).toBe(true);
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'SECURE@PASS123',
        confirmPassword: 'SECURE@PASS123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('minúscula'))).toBe(true);
      }
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'Secure@Password',
        confirmPassword: 'Secure@Password',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('número'))).toBe(true);
      }
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'SecurePass1234',
        confirmPassword: 'SecurePass1234',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('especial'))).toBe(true);
      }
    });
  });

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPass@123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('não coincidem'))).toBe(true);
    }
  });

  it('should reject name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      ...validData,
      fullName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when terms not accepted', () => {
    const result = registerSchema.safeParse({
      ...validData,
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('Termos'))).toBe(true);
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid password reset data', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewSecure@Pass123',
      confirmPassword: 'NewSecure@Pass123',
    });
    expect(result.success).toBe(true);
  });

  it('should enforce password complexity', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('should reject mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewSecure@Pass123',
      confirmPassword: 'Different@Pass123',
    });
    expect(result.success).toBe(false);
  });
});

describe('PASSWORD_REQUIREMENTS', () => {
  it('should have 5 requirements', () => {
    expect(PASSWORD_REQUIREMENTS).toHaveLength(5);
  });

  it('should correctly test minimum length', () => {
    const lengthReq = PASSWORD_REQUIREMENTS[0];
    expect(lengthReq.test('short')).toBe(false);
    expect(lengthReq.test('exactly12char')).toBe(true);
    expect(lengthReq.test('longerthan12chars')).toBe(true);
  });

  it('should correctly test uppercase requirement', () => {
    const uppercaseReq = PASSWORD_REQUIREMENTS[1];
    expect(uppercaseReq.test('lowercase')).toBe(false);
    expect(uppercaseReq.test('Uppercase')).toBe(true);
  });

  it('should correctly test lowercase requirement', () => {
    const lowercaseReq = PASSWORD_REQUIREMENTS[2];
    expect(lowercaseReq.test('UPPERCASE')).toBe(false);
    expect(lowercaseReq.test('lowercase')).toBe(true);
  });

  it('should correctly test number requirement', () => {
    const numberReq = PASSWORD_REQUIREMENTS[3];
    expect(numberReq.test('noNumbers')).toBe(false);
    expect(numberReq.test('has1number')).toBe(true);
  });

  it('should correctly test special character requirement', () => {
    const specialReq = PASSWORD_REQUIREMENTS[4];
    expect(specialReq.test('NoSpecial123')).toBe(false);
    expect(specialReq.test('Has@Special')).toBe(true);
    expect(specialReq.test('Has!Special')).toBe(true);
    expect(specialReq.test('Has#Special')).toBe(true);
  });
});
