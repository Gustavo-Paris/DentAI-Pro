import { describe, it, expect } from 'vitest';

// Test the error classification logic from Login.tsx
// Validates that email-not-confirmed errors are detected correctly

function classifyLoginError(errorMessage: string | undefined): 'email_not_confirmed' | 'generic' {
  if (errorMessage?.toLowerCase().includes('email not confirmed')) {
    return 'email_not_confirmed';
  }
  return 'generic';
}

describe('Login error classification', () => {
  it('should detect "Email not confirmed" error', () => {
    expect(classifyLoginError('Email not confirmed')).toBe('email_not_confirmed');
  });

  it('should detect case-insensitive variation', () => {
    expect(classifyLoginError('email not confirmed')).toBe('email_not_confirmed');
  });

  it('should detect error with surrounding text', () => {
    expect(classifyLoginError('Error: Email not confirmed. Please check inbox.')).toBe('email_not_confirmed');
  });

  it('should return generic for wrong credentials', () => {
    expect(classifyLoginError('Invalid login credentials')).toBe('generic');
  });

  it('should return generic for undefined message', () => {
    expect(classifyLoginError(undefined)).toBe('generic');
  });

  it('should return generic for empty string', () => {
    expect(classifyLoginError('')).toBe('generic');
  });
});
