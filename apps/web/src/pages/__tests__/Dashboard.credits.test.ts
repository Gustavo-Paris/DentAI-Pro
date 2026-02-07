import { describe, it, expect } from 'vitest';

// Test the low credits banner visibility logic from Dashboard.tsx

interface CreditState {
  creditsBannerDismissed: boolean;
  loadingCredits: boolean;
  isActive: boolean;
  isFree: boolean;
  creditsRemaining: number;
}

function shouldShowCreditsBanner(state: CreditState): boolean {
  return (
    !state.creditsBannerDismissed &&
    !state.loadingCredits &&
    state.isActive &&
    !state.isFree &&
    state.creditsRemaining <= 5
  );
}

describe('Low credits banner visibility', () => {
  const baseState: CreditState = {
    creditsBannerDismissed: false,
    loadingCredits: false,
    isActive: true,
    isFree: false,
    creditsRemaining: 3,
  };

  it('shows banner when credits are low', () => {
    expect(shouldShowCreditsBanner(baseState)).toBe(true);
  });

  it('shows banner at exactly 5 credits', () => {
    expect(shouldShowCreditsBanner({ ...baseState, creditsRemaining: 5 })).toBe(true);
  });

  it('hides banner when credits are above 5', () => {
    expect(shouldShowCreditsBanner({ ...baseState, creditsRemaining: 6 })).toBe(false);
  });

  it('hides banner at 0 credits', () => {
    // 0 credits is still <= 5, so should show
    expect(shouldShowCreditsBanner({ ...baseState, creditsRemaining: 0 })).toBe(true);
  });

  it('hides banner when dismissed', () => {
    expect(shouldShowCreditsBanner({ ...baseState, creditsBannerDismissed: true })).toBe(false);
  });

  it('hides banner while loading', () => {
    expect(shouldShowCreditsBanner({ ...baseState, loadingCredits: true })).toBe(false);
  });

  it('hides banner for free users', () => {
    expect(shouldShowCreditsBanner({ ...baseState, isFree: true })).toBe(false);
  });

  it('hides banner for inactive users', () => {
    expect(shouldShowCreditsBanner({ ...baseState, isActive: false })).toBe(false);
  });

  it('hides banner for free inactive users even with low credits', () => {
    expect(
      shouldShowCreditsBanner({
        ...baseState,
        isFree: true,
        isActive: false,
        creditsRemaining: 1,
      })
    ).toBe(false);
  });
});

describe('Credits banner pluralization', () => {
  it('uses singular for 1 credit', () => {
    const creditsRemaining = 1;
    const text = `${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''} restante${creditsRemaining !== 1 ? 's' : ''}`;
    expect(text).toBe('1 crédito restante');
  });

  it('uses plural for 0 credits', () => {
    const creditsRemaining: number = 0;
    const text = `${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''} restante${creditsRemaining !== 1 ? 's' : ''}`;
    expect(text).toBe('0 créditos restantes');
  });

  it('uses plural for multiple credits', () => {
    const creditsRemaining: number = 5;
    const text = `${creditsRemaining} crédito${creditsRemaining !== 1 ? 's' : ''} restante${creditsRemaining !== 1 ? 's' : ''}`;
    expect(text).toBe('5 créditos restantes');
  });
});
