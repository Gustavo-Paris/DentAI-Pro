import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingCTA } from '../LandingCTA';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { Sparkles: S, Check: S };
});

vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => ({ current: null }),
  useScrollRevealChildren: () => ({ current: null }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...p }: any) => <a href={to} {...p}>{children}</a>,
}));

describe('LandingCTA', () => {
  it('renders CTA section with title, features, and button', () => {
    render(<LandingCTA />);
    expect(screen.getByText('landing.ctaTitle')).toBeInTheDocument();
    expect(screen.getByText('landing.ctaSubtitle')).toBeInTheDocument();
    expect(screen.getByText('landing.ctaFeature1')).toBeInTheDocument();
    expect(screen.getByText('landing.ctaFeature2')).toBeInTheDocument();
    expect(screen.getByText('landing.ctaFeature3')).toBeInTheDocument();
    expect(screen.getByText('landing.ctaCTA')).toBeInTheDocument();
  });
});
