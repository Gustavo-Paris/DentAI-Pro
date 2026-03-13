import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingStats } from '../LandingStats';

vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollRevealChildren: () => ({ current: null }),
}));

describe('LandingStats', () => {
  it('renders all stat values', () => {
    render(<LandingStats />);
    expect(screen.getByText('<2min')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('15+')).toBeInTheDocument();
    expect(screen.getByText('250+')).toBeInTheDocument();
  });

  it('renders stat labels', () => {
    render(<LandingStats />);
    expect(screen.getByText('landing.statsFirstResult')).toBeInTheDocument();
    expect(screen.getByText('landing.statsTreatmentTypes')).toBeInTheDocument();
    expect(screen.getByText('landing.statsResinBrands')).toBeInTheDocument();
    expect(screen.getByText('landing.statsVitaColors')).toBeInTheDocument();
  });
});
