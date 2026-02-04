import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export function usePaymentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async (): Promise<PaymentRecord[]> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payment_history')
        .select('id, amount, currency, status, description, invoice_url, invoice_pdf, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}
