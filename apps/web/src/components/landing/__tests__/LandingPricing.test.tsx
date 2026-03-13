import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPricing } from '../LandingPricing';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { Check: S, Zap: S, Users: S, RefreshCw: S };
});

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...p }: any) => <a href={to} {...p}>{children}</a>,
}));

vi.mock('@/hooks/useLandingPlans', () => ({
  useLandingPlans: () => ({ plans: null }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  formatPrice: (v: number) => `R$${(v / 100).toFixed(2)}`,
}));

describe('LandingPricing', () => {
  it('renders fallback plans when no Supabase plans', () => {
    render(<LandingPricing />);
    expect(screen.getByText('pricing.plansAndPricing')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Essencial')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
    expect(screen.getByText('pricing.guarantee')).toBeInTheDocument();
  });

  it('renders most popular badge on Pro plan', () => {
    render(<LandingPricing />);
    expect(screen.getByText('pricing.mostPopular')).toBeInTheDocument();
  });

  it('renders start free and start buttons', () => {
    render(<LandingPricing />);
    const startFreeButtons = screen.getAllByText('pricing.startFree');
    expect(startFreeButtons.length).toBeGreaterThan(0);
    const startButtons = screen.getAllByText('pricing.start');
    expect(startButtons.length).toBeGreaterThan(0);
  });
});
