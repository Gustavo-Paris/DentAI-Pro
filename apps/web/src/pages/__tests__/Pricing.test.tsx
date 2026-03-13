import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    plans: [
      {
        id: 'price_free',
        name: 'Free',
        description: 'Free plan',
        price_monthly: 0,
        price_yearly: 0,
        credits_per_month: 5,
        cases_per_month: 5,
        dsd_simulations_per_month: 2,
        allows_rollover: false,
        rollover_max: null,
        max_users: 1,
        priority_support: false,
        sort_order: 0,
      },
    ],
    subscription: null,
    currentPlan: null,
    isLoading: false,
    checkout: vi.fn(),
    isCheckingOut: false,
    refreshSubscription: vi.fn(),
  })),
}));

vi.mock('@/data/subscriptions', () => ({
  syncSubscription: vi.fn(),
}));

vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  PricingPage: ({ plans }: any) => (
    <div data-testid="pricing-page">{plans?.length ?? 0} plans</div>
  ),
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Pricing', () => {
  it('renders without crashing', async () => {
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });

  it('renders error state when no plans', async () => {
    const mod = await import('@/hooks/useSubscription');
    (mod.useSubscription as any).mockReturnValueOnce({
      plans: [],
      subscription: null,
      currentPlan: null,
      isLoading: false,
      checkout: vi.fn(),
      isCheckingOut: false,
      refreshSubscription: vi.fn(),
    });
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper });
    expect(getByTestId('error-state')).toBeTruthy();
  });

  it('renders plans with subscription and current plan', async () => {
    const mod = await import('@/hooks/useSubscription');
    (mod.useSubscription as any).mockReturnValueOnce({
      plans: [
        {
          id: 'price_pro_monthly_v2',
          name: 'Pro',
          description: 'Pro plan',
          price_monthly: 9900,
          price_yearly: 99000,
          credits_per_month: 50,
          cases_per_month: -1,
          dsd_simulations_per_month: -1,
          allows_rollover: true,
          rollover_max: 100,
          max_users: 3,
          priority_support: true,
          sort_order: 2,
        },
      ],
      subscription: { plan_id: 'price_pro_monthly_v2', status: 'active' },
      currentPlan: { sort_order: 2 },
      isLoading: false,
      checkout: vi.fn(),
      isCheckingOut: false,
      refreshSubscription: vi.fn(),
    });
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });

  it('renders loading state without error', async () => {
    const mod = await import('@/hooks/useSubscription');
    (mod.useSubscription as any).mockReturnValueOnce({
      plans: [],
      subscription: null,
      currentPlan: null,
      isLoading: true,
      checkout: vi.fn(),
      isCheckingOut: false,
      refreshSubscription: vi.fn(),
    });
    const Pricing = (await import('../Pricing')).default;
    // When loading, should NOT show error state
    const { queryByTestId } = render(<Pricing />, { wrapper });
    expect(queryByTestId('error-state')).toBeNull();
  });

  it('handles subscription=success search param', async () => {
    const successQc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const successWrapper = ({ children }: any) => (
      <QueryClientProvider client={successQc}>
        <MemoryRouter initialEntries={['/pricing?subscription=success']}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper: successWrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });

  it('handles subscription=canceled search param', async () => {
    const cancelQc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const cancelWrapper = ({ children }: any) => (
      <QueryClientProvider client={cancelQc}>
        <MemoryRouter initialEntries={['/pricing?subscription=canceled']}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper: cancelWrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });

  it('renders with plan that has no yearly price', async () => {
    const mod = await import('@/hooks/useSubscription');
    (mod.useSubscription as any).mockReturnValueOnce({
      plans: [
        {
          id: 'price_free',
          name: 'Free',
          description: 'Free plan',
          price_monthly: 0,
          price_yearly: null,
          credits_per_month: 5,
          cases_per_month: 5,
          dsd_simulations_per_month: 2,
          allows_rollover: false,
          rollover_max: null,
          max_users: 1,
          priority_support: false,
          sort_order: 0,
        },
      ],
      subscription: null,
      currentPlan: null,
      isLoading: false,
      checkout: vi.fn(),
      isCheckingOut: false,
      refreshSubscription: vi.fn(),
    });
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });

  it('renders with allows_rollover true and rollover_max null (unlimited)', async () => {
    const mod = await import('@/hooks/useSubscription');
    (mod.useSubscription as any).mockReturnValueOnce({
      plans: [
        {
          id: 'price_elite_monthly',
          name: 'Elite',
          description: 'Elite plan',
          price_monthly: 29900,
          price_yearly: 299000,
          credits_per_month: 200,
          cases_per_month: -1,
          dsd_simulations_per_month: -1,
          allows_rollover: true,
          rollover_max: null,
          max_users: 10,
          priority_support: true,
          sort_order: 3,
        },
      ],
      subscription: null,
      currentPlan: null,
      isLoading: false,
      checkout: vi.fn(),
      isCheckingOut: false,
      refreshSubscription: vi.fn(),
    });
    const Pricing = (await import('../Pricing')).default;
    const { getByTestId } = render(<Pricing />, { wrapper });
    expect(getByTestId('pricing-page')).toBeTruthy();
  });
});
