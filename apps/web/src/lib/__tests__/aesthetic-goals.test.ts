import { describe, it, expect } from 'vitest';
import { resolveAestheticGoalsForAI } from '../aesthetic-goals';

describe('resolveAestheticGoalsForAI', () => {
  it('returns undefined for null', () => {
    expect(resolveAestheticGoalsForAI(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(resolveAestheticGoalsForAI(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(resolveAestheticGoalsForAI('')).toBeUndefined();
  });

  it('maps whitening_hollywood to prompt text', () => {
    const result = resolveAestheticGoalsForAI('whitening_hollywood');
    expect(result).toContain('Hollywood');
    expect(result).toContain('BL1');
  });

  it('maps whitening_natural to prompt text', () => {
    const result = resolveAestheticGoalsForAI('whitening_natural');
    expect(result).toContain('NATURAL');
    expect(result).toContain('A1/A2');
  });

  it('passes through unknown values as-is (legacy PT text)', () => {
    const legacyText = 'Paciente deseja resultado estético superior';
    expect(resolveAestheticGoalsForAI(legacyText)).toBe(legacyText);
  });

  it('passes through unknown enum values as-is', () => {
    expect(resolveAestheticGoalsForAI('some_unknown_goal')).toBe('some_unknown_goal');
  });
});
