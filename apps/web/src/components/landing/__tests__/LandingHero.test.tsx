import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHero } from '../LandingHero';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { Sparkles: S };
});

vi.mock('@/components/landing/HeroMockup', () => ({
  HeroMockup: () => <div data-testid="hero-mockup" />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...p }: any) => <a href={to} {...p}>{children}</a>,
}));

describe('LandingHero', () => {
  it('renders hero section with title and CTA', () => {
    render(<LandingHero />);
    expect(screen.getByText('landing.heroTagline')).toBeInTheDocument();
    expect(screen.getByText('landing.heroTitleHighlight')).toBeInTheDocument();
    expect(screen.getByText('landing.heroSubtitle')).toBeInTheDocument();
    expect(screen.getByText('landing.heroCTA')).toBeInTheDocument();
    expect(screen.getByText('landing.heroNoCreditCard')).toBeInTheDocument();
  });

  it('renders hero mockup', () => {
    render(<LandingHero />);
    expect(screen.getByTestId('hero-mockup')).toBeInTheDocument();
  });
});
