import { useQuery } from '@tanstack/react-query';
import { subscriptions } from '@/data';
import { QUERY_STALE_TIMES } from '@/lib/constants';

/**
 * Fetches subscription plans for the public landing page.
 * Does NOT require authentication — uses anon Supabase client.
 * Shares the same query key as useSubscription so results are cached.
 */
export function useLandingPlans() {
  const query = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptions.getPlans(),
    staleTime: QUERY_STALE_TIMES.VERY_LONG,
    retry: 1,
    retryDelay: 1000,
  });

  return {
    plans: query.data ?? null,
    isLoading: query.isLoading,
  };
}
