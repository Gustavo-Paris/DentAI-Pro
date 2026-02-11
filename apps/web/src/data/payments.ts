import { supabase } from './client';
import { withQuery } from './utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listByUserId(userId: string) {
  const data = await withQuery(() =>
    supabase
      .from('payment_history')
      .select('id, amount, currency, status, description, invoice_url, invoice_pdf, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  );
  return (data as PaymentRecord[]) || [];
}
