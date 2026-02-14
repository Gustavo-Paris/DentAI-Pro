import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listByUserId } from '../payments';

// ---------------------------------------------------------------------------
// Mock supabase client — uses a builder pattern where every method returns
// the same builder, and the terminal result is controlled by `terminalResult`.
// ---------------------------------------------------------------------------

let terminalResult: unknown = { data: [], error: null };

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

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
  // Terminal: allow builder to be thenable so withQuery can await it
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve, reject);
  };

  return builder;
}

vi.mock('../client', () => ({
  supabase: {
    from: () => createBuilder(),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: [], error: null };
});

describe('payments.listByUserId', () => {
  it('should return payment records for a user', async () => {
    const payments = [
      {
        id: 'pay-1',
        amount: 4990,
        currency: 'brl',
        status: 'succeeded',
        description: 'Pro mensal',
        invoice_url: 'https://invoice.stripe.com/inv-1',
        invoice_pdf: 'https://invoice.stripe.com/inv-1.pdf',
        created_at: '2026-02-14T10:00:00Z',
      },
      {
        id: 'pay-2',
        amount: 990,
        currency: 'brl',
        status: 'succeeded',
        description: '10 créditos avulsos',
        invoice_url: null,
        invoice_pdf: null,
        created_at: '2026-02-10T08:30:00Z',
      },
    ];
    terminalResult = { data: payments, error: null };

    const result = await listByUserId('user-1');

    expect(result).toEqual(payments);
    expect(mockSelect).toHaveBeenCalledWith(
      'id, amount, currency, status, description, invoice_url, invoice_pdf, created_at',
    );
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should return empty array when data is null', async () => {
    terminalResult = { data: null, error: null };

    const result = await listByUserId('user-1');

    expect(result).toEqual([]);
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Payments fetch error') };

    await expect(listByUserId('user-1')).rejects.toThrow('Payments fetch error');
  });

  it('should return records ordered by created_at descending', async () => {
    const payments = [
      {
        id: 'pay-3',
        amount: 9990,
        currency: 'brl',
        status: 'succeeded',
        description: 'Elite mensal',
        invoice_url: 'https://invoice.stripe.com/inv-3',
        invoice_pdf: 'https://invoice.stripe.com/inv-3.pdf',
        created_at: '2026-02-14T12:00:00Z',
      },
    ];
    terminalResult = { data: payments, error: null };

    const result = await listByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pay-3');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should handle payment with pending status', async () => {
    const payments = [
      {
        id: 'pay-4',
        amount: 990,
        currency: 'brl',
        status: 'pending',
        description: 'PIX aguardando',
        invoice_url: null,
        invoice_pdf: null,
        created_at: '2026-02-14T09:00:00Z',
      },
    ];
    terminalResult = { data: payments, error: null };

    const result = await listByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
  });

  it('should return empty array when user has no payments', async () => {
    terminalResult = { data: [], error: null };

    const result = await listByUserId('user-1');

    expect(result).toEqual([]);
  });
});
