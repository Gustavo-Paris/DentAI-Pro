import { describe, it, expect } from 'vitest';

/**
 * Tests for the wizard draft expiry logic.
 * The hook itself depends heavily on Supabase, so we test
 * the expiry calculation independently.
 */

const DRAFT_EXPIRY_DAYS = 7;

function isDraftExpired(lastSavedAt: string): boolean {
  const savedDate = new Date(lastSavedAt);
  const now = new Date();
  const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > DRAFT_EXPIRY_DAYS;
}

describe('wizard draft expiry logic', () => {
  it('should not be expired for a draft saved just now', () => {
    expect(isDraftExpired(new Date().toISOString())).toBe(false);
  });

  it('should not be expired for a draft saved 6 days ago', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    expect(isDraftExpired(sixDaysAgo.toISOString())).toBe(false);
  });

  it('should be expired for a draft saved 8 days ago', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(isDraftExpired(eightDaysAgo.toISOString())).toBe(true);
  });

  it('should be expired for a draft saved 30 days ago', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(isDraftExpired(thirtyDaysAgo.toISOString())).toBe(true);
  });

  it('should handle exactly 7 days as not expired', () => {
    // Exactly 7 days is NOT > 7, so it's not expired
    const exactly7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(isDraftExpired(exactly7Days.toISOString())).toBe(false);
  });
});
