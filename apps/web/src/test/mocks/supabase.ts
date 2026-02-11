import { vi } from 'vitest';

/**
 * Creates a Supabase query builder mock with chainable methods.
 *
 * Every chaining method returns the builder itself. Terminal methods
 * (.range(), .maybeSingle(), .single()) resolve with `terminalResult`.
 *
 * Usage:
 *   let terminalResult: unknown = { data: [], error: null, count: 0 };
 *   const { builder, mocks } = createSupabaseBuilder(() => terminalResult);
 *
 *   vi.mock('@/integrations/supabase/client', () => ({
 *     supabase: { from: () => builder },
 *   }));
 */
export function createSupabaseBuilder(getResult: () => unknown) {
  const mocks = {
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
  };

  const builder: Record<string, (...args: unknown[]) => unknown> = {};

  const chain = (mockFn: ReturnType<typeof vi.fn>) => {
    return (...args: unknown[]) => {
      mockFn(...args);
      return builder;
    };
  };

  // Chaining methods
  builder.select = chain(mocks.select);
  builder.eq = chain(mocks.eq);
  builder.neq = chain(mocks.neq);
  builder.in = chain(mocks.in);
  builder.order = chain(mocks.order);
  builder.limit = chain(mocks.limit);
  builder.insert = chain(mocks.insert);
  builder.update = chain(mocks.update);
  builder.delete = chain(mocks.delete);
  builder.upsert = chain(mocks.upsert);
  builder.gte = chain(mocks.gte);
  builder.lte = chain(mocks.lte);
  builder.ilike = chain(mocks.ilike);
  builder.is = chain(mocks.is);

  // Terminal methods
  builder.range = (...args: unknown[]) => {
    mocks.range(...args);
    return getResult();
  };
  builder.maybeSingle = () => {
    mocks.maybeSingle();
    return getResult();
  };
  builder.single = () => {
    mocks.single();
    return getResult();
  };

  // Thenable for chains that end without an explicit terminal
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(getResult()).then(resolve, reject);
  };

  return { builder, mocks };
}
