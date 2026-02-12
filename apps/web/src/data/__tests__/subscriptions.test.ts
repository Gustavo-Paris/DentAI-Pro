import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPlans,
  getCreditCosts,
  getByUserId,
  createCheckoutSession,
  createPortalSession,
  getCreditPacks,
  purchaseCreditPack,
  syncCreditPurchase,
} from '../subscriptions';

// ---------------------------------------------------------------------------
// Mock supabase client — supports both from() chains and functions.invoke()
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: [], error: null };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInvoke = vi.fn();

function createBuilder(): Record<string, (...args: unknown[]) => unknown> {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};

  const chainMethod = (mockFn: ReturnType<typeof vi.fn>) => {
    return (...args: unknown[]) => {
      mockFn(...args);
      return builder;
    };
  };

  builder.select = chainMethod(mockSelect);
  builder.eq = chainMethod(mockEq);
  builder.order = chainMethod(mockOrder);
  builder.maybeSingle = () => {
    mockMaybeSingle();
    return terminalResult;
  };
  // Terminal: allow builder to be thenable so withQuery can await it
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve, reject);
  };

  return builder;
}

vi.mock('../client', () => ({
  supabase: {
    from: () => createBuilder(),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: [], error: null };
});

describe('subscriptions.getPlans', () => {
  it('should return sorted active plans', async () => {
    const plans = [
      { id: 'starter', name: 'Starter', sort_order: 1 },
      { id: 'pro', name: 'Pro', sort_order: 2 },
    ];
    terminalResult = { data: plans, error: null };

    const result = await getPlans();

    expect(result).toEqual(plans);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder).toHaveBeenCalledWith('sort_order');
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getPlans();

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Plans fetch error') };

    await expect(getPlans()).rejects.toThrow('Plans fetch error');
  });
});

describe('subscriptions.getCreditCosts', () => {
  it('should return cost list', async () => {
    const costs = [
      { operation: 'case_analysis', credits: 1, description: 'Análise de caso' },
      { operation: 'dsd_simulation', credits: 2, description: 'Simulação DSD' },
    ];
    terminalResult = { data: costs, error: null };

    const result = await getCreditCosts();

    expect(result).toEqual(costs);
    expect(mockSelect).toHaveBeenCalledWith('*');
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getCreditCosts();

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Credit costs error') };

    await expect(getCreditCosts()).rejects.toThrow('Credit costs error');
  });
});

describe('subscriptions.getByUserId', () => {
  it('should return subscription with plan data', async () => {
    const subscription = {
      id: 'sub-1',
      user_id: 'user-1',
      status: 'active',
      plan: { id: 'pro', name: 'Pro' },
    };
    terminalResult = { data: subscription, error: null };

    const result = await getByUserId('user-1');

    expect(result).toEqual(subscription);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it('should return null when no subscription exists', async () => {
    terminalResult = { data: null, error: null };

    const result = await getByUserId('user-1');

    expect(result).toBeNull();
  });

  it('should select with plan join', async () => {
    terminalResult = { data: null, error: null };

    await getByUserId('user-1');

    expect(mockSelect).toHaveBeenCalled();
    const selectArg = mockSelect.mock.calls[0][0] as string;
    expect(selectArg).toContain('plan:subscription_plans(*)');
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Subscription error') };

    await expect(getByUserId('user-1')).rejects.toThrow('Subscription error');
  });
});

describe('subscriptions.createCheckoutSession', () => {
  it('should call edge function with priceId', async () => {
    const response = { sessionId: 'sess-1', url: 'https://checkout.stripe.com/sess-1' };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await createCheckoutSession('price_pro_monthly');

    expect(result).toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { priceId: 'price_pro_monthly' },
    });
  });

  it('should return updated flag for inline upgrades', async () => {
    const response = { updated: true };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await createCheckoutSession('price_elite_monthly');

    expect(result).toEqual(response);
    expect(result.updated).toBe(true);
  });

  it('should throw on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Checkout failed') });

    await expect(createCheckoutSession('price_pro')).rejects.toThrow('Checkout failed');
  });
});

describe('subscriptions.createPortalSession', () => {
  it('should generate portal URL', async () => {
    const response = { url: 'https://billing.stripe.com/portal/sess-1' };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await createPortalSession();

    expect(result).toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith('create-portal-session', {
      body: {},
    });
  });

  it('should throw on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Portal error') });

    await expect(createPortalSession()).rejects.toThrow('Portal error');
  });
});

describe('subscriptions.getCreditPacks', () => {
  it('should return active credit packs', async () => {
    const packs = [
      { id: 'pack-10', name: '10 créditos', credits: 10, price: 990, is_active: true, sort_order: 1 },
      { id: 'pack-50', name: '50 créditos', credits: 50, price: 3990, is_active: true, sort_order: 2 },
    ];
    terminalResult = { data: packs, error: null };

    const result = await getCreditPacks();

    expect(result).toEqual(packs);
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder).toHaveBeenCalledWith('sort_order');
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await getCreditPacks();

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Packs error') };

    await expect(getCreditPacks()).rejects.toThrow('Packs error');
  });
});

describe('subscriptions.purchaseCreditPack', () => {
  it('should call edge function with packId', async () => {
    const response = { url: 'https://checkout.stripe.com/pack-sess' };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await purchaseCreditPack('pack-10');

    expect(result).toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { packId: 'pack-10' },
    });
  });

  it('should pass payment_method when provided', async () => {
    const response = { url: 'https://checkout.stripe.com/pix-sess' };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await purchaseCreditPack('pack-10', 'pix');

    expect(result).toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { packId: 'pack-10', payment_method: 'pix' },
    });
  });

  it('should pass card payment_method', async () => {
    const response = { url: 'https://checkout.stripe.com/card-sess' };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    await purchaseCreditPack('pack-50', 'card');

    expect(mockInvoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { packId: 'pack-50', payment_method: 'card' },
    });
  });

  it('should throw on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Purchase failed') });

    await expect(purchaseCreditPack('pack-10')).rejects.toThrow('Purchase failed');
  });
});

describe('subscriptions.syncCreditPurchase', () => {
  it('should sync credit purchase', async () => {
    const response = { synced: true, credits_added: 10, sessions_processed: 1 };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await syncCreditPurchase();

    expect(result).toEqual(response);
    expect(mockInvoke).toHaveBeenCalledWith('sync-credit-purchase', {
      body: {},
    });
  });

  it('should return result when nothing to sync', async () => {
    const response = { synced: false, credits_added: 0, sessions_processed: 0 };
    mockInvoke.mockResolvedValue({ data: response, error: null });

    const result = await syncCreditPurchase();

    expect(result.synced).toBe(false);
    expect(result.credits_added).toBe(0);
  });

  it('should throw on error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Sync failed') });

    await expect(syncCreditPurchase()).rejects.toThrow('Sync failed');
  });
});
