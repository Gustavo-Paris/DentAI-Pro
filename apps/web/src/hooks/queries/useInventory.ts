import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CatalogResin {
  id: string;
  brand: string;
  product_line: string;
  shade: string;
  type: string;
  opacity: string;
}

interface InventoryItem {
  id: string;
  resin_id: string;
  resin: CatalogResin;
}

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (page: number) => [...inventoryKeys.lists(), page] as const,
  catalog: () => [...inventoryKeys.all, 'catalog'] as const,
};

export function useInventoryList(page: number = 0, pageSize: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: inventoryKeys.list(page),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error, count } = await supabase
        .from('user_inventory')
        .select(`
          id,
          resin_id,
          resin:resin_catalog(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return {
        items: (data as unknown as InventoryItem[]) || [],
        totalCount: count || 0,
        hasMore: (count || 0) > (page + 1) * pageSize,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000, // Cache inventory for 1 minute
  });
}

export function useResinCatalog() {
  return useQuery({
    queryKey: inventoryKeys.catalog(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resin_catalog')
        .select('*')
        .order('brand', { ascending: true })
        .order('product_line', { ascending: true })
        .order('type', { ascending: true })
        .order('shade', { ascending: true });

      if (error) throw error;
      return (data as CatalogResin[]) || [];
    },
    staleTime: 10 * 60 * 1000, // Cache catalog for 10 minutes (rarely changes)
  });
}

export function useAddToInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resinIds: string[]) => {
      if (!user) throw new Error('User not authenticated');

      const inserts = resinIds.map((resinId) => ({
        user_id: user.id,
        resin_id: resinId,
      }));

      const { error } = await supabase.from('user_inventory').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useRemoveFromInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventoryItemId: string) => {
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', inventoryItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}
