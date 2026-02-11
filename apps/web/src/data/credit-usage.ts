import { supabase } from './client';
import { withQuery } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreditUsageRecord {
  id: string;
  operation: string;
  credits_used: number;
  reference_id: string | null;
  created_at: string;
}

export interface MonthlyStats {
  operation: string;
  total_credits: number;
  count: number;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List credit usage records for a user with optional pagination and date range.
 */
export async function listByUserId(
  userId: string,
  opts?: ListOptions,
): Promise<CreditUsageRecord[]> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from('credit_usage')
    .select('id, operation, credits_used, reference_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.dateFrom) {
    query = query.gte('created_at', opts.dateFrom);
  }
  if (opts?.dateTo) {
    query = query.lte('created_at', opts.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as CreditUsageRecord[]) || [];
}

/**
 * Aggregate credit usage by operation for the current calendar month.
 */
export async function getMonthlyStats(userId: string): Promise<MonthlyStats[]> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const data = await withQuery(() =>
    supabase
      .from('credit_usage')
      .select('operation, credits_used')
      .eq('user_id', userId)
      .gte('created_at', firstOfMonth),
  );

  // Aggregate client-side (Supabase JS doesn't support GROUP BY natively)
  const statsMap = new Map<string, { total_credits: number; count: number }>();

  for (const row of (data || []) as { operation: string; credits_used: number }[]) {
    const existing = statsMap.get(row.operation);
    if (existing) {
      existing.total_credits += row.credits_used;
      existing.count += 1;
    } else {
      statsMap.set(row.operation, { total_credits: row.credits_used, count: 1 });
    }
  }

  return Array.from(statsMap.entries()).map(([operation, stats]) => ({
    operation,
    ...stats,
  }));
}
