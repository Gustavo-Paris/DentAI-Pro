import { supabase } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogResin {
  id: string;
  brand: string;
  product_line: string;
  shade: string;
  type: string;
  opacity: string;
}

export interface InventoryItem {
  id: string;
  resin_id: string;
  resin: CatalogResin;
}

export interface InventoryListParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function list({ userId, page = 0, pageSize = 30 }: InventoryListParams) {
  const { data, error, count } = await supabase
    .from('user_inventory')
    .select(`
      id,
      resin_id,
      resin:resin_catalog(*)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return {
    items: (data as unknown as InventoryItem[]) || [],
    count: count || 0,
  };
}

export async function getCatalog() {
  const { data, error } = await supabase
    .from('resin_catalog')
    .select('*')
    .order('brand', { ascending: true })
    .order('product_line', { ascending: true })
    .order('type', { ascending: true })
    .order('shade', { ascending: true });

  if (error) throw error;
  return (data as CatalogResin[]) || [];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function addItems(userId: string, resinIds: string[]) {
  const inserts = resinIds.map((resinId) => ({
    user_id: userId,
    resin_id: resinId,
  }));

  const { error } = await supabase.from('user_inventory').insert(inserts);
  if (error) throw error;
}

export async function removeItem(inventoryItemId: string) {
  const { error } = await supabase
    .from('user_inventory')
    .delete()
    .eq('id', inventoryItemId);

  if (error) throw error;
}
