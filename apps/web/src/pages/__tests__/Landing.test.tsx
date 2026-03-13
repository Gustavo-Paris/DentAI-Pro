import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/components/landing/LandingHeader', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
}));

vi.mock('@/components/landing/LandingHero', () => ({
  LandingHero: () => <div data-testid="landing-hero" />,
}));

vi.mock('@/components/landing/LandingStats', () => ({
  LandingStats: () => <div data-testid="landing-stats" />,
}));

vi.mock('@/components/landing/LandingFeatures', () => ({
  LandingFeatures: () => null,
}));

vi.mock('@/components/landing/LandingHowItWorks', () => ({
  LandingHowItWorks: () => null,
}));

vi.mock('@/components/landing/LandingTestimonials', () => ({
  LandingTestimonials: () => null,
}));

vi.mock('@/components/landing/LandingFAQ', () => ({
  LandingFAQ: () => null,
}));

vi.mock('@/components/landing/LandingPricing', () => ({
  LandingPricing: () => null,
}));

vi.mock('@/components/landing/LandingCTA', () => ({
  LandingCTA: () => null,
}));

vi.mock('@/components/landing/LandingFooter', () => ({
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

describe('Landing', () => {
  it('renders without crashing', async () => {
    const Landing = (await import('../Landing')).default;
    const { getByTestId } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(getByTestId('landing-header')).toBeTruthy();
    expect(getByTestId('landing-hero')).toBeTruthy();
    expect(getByTestId('landing-footer')).toBeTruthy();
  });
});
