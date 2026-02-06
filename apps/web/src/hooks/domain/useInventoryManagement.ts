import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { inventory } from '@/data';
import type { CatalogResin } from '@/data/inventory';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupedResins {
  [brand: string]: {
    [productLine: string]: CatalogResin[];
  };
}

export interface FlatInventoryItem {
  id: string;
  resinId: string;
  shade: string;
  brand: string;
  product_line: string;
  type: string;
  opacity: string;
}

export interface CatalogFilters {
  search: string;
  brand: string;
  type: string;
}

export interface CsvPreview {
  matched: CatalogResin[];
  unmatched: string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInventoryManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const csvInputRef = useRef<HTMLInputElement>(null);

  // --- Inventory data ---
  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'all', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { items, count } = await inventory.list({
        userId: user.id,
        page: 0,
        pageSize: 5000,
      });
      return { items, count };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const catalogQuery = useQuery({
    queryKey: ['inventory', 'catalog'],
    queryFn: () => inventory.getCatalog(),
    staleTime: 10 * 60 * 1000,
  });

  const allItems = useMemo(() => inventoryQuery.data?.items ?? [], [inventoryQuery.data?.items]);
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: async (resinIds: string[]) => {
      if (!user) throw new Error('User not authenticated');
      await inventory.addItems(user.id, resinIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (inventoryItemId: string) => inventory.removeItem(inventoryItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // --- Catalog dialog state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResins, setSelectedResins] = useState<Set<string>>(new Set());
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>({
    search: '',
    brand: 'all',
    type: 'all',
  });

  // --- Remove confirmation state ---
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [removingResin, setRemovingResin] = useState<string | null>(null);

  // --- CSV state ---
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [importing, setImporting] = useState(false);

  // --- Derived data ---
  const inventoryResinIds = useMemo(
    () => new Set(allItems.map((item) => item.resin_id)),
    [allItems],
  );

  const flatItems = useMemo<FlatInventoryItem[]>(
    () =>
      allItems.map((item) => ({
        id: item.id,
        resinId: item.resin_id,
        shade: item.resin.shade,
        brand: item.resin.brand,
        product_line: item.resin.product_line,
        type: item.resin.type,
        opacity: item.resin.opacity,
      })),
    [allItems],
  );

  const brandOptions = useMemo(
    () =>
      [...new Set(allItems.map((item) => item.resin.brand))]
        .sort()
        .map((b) => ({ value: b, label: b })),
    [allItems],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(allItems.map((item) => item.resin.type))]
        .sort()
        .map((t) => ({ value: t, label: t })),
    [allItems],
  );

  const catalogBrands = useMemo(
    () => [...new Set(catalog.map((r) => r.brand))].sort(),
    [catalog],
  );

  const catalogTypes = useMemo(
    () => [...new Set(catalog.map((r) => r.type))].sort(),
    [catalog],
  );

  const filteredCatalog = useMemo(() => {
    return catalog.filter((resin) => {
      const notInInventory = !inventoryResinIds.has(resin.id);
      const matchesSearch =
        resin.shade.toLowerCase().includes(catalogFilters.search.toLowerCase()) ||
        resin.brand.toLowerCase().includes(catalogFilters.search.toLowerCase()) ||
        resin.product_line.toLowerCase().includes(catalogFilters.search.toLowerCase());
      const matchesBrand =
        catalogFilters.brand === 'all' || resin.brand === catalogFilters.brand;
      const matchesType =
        catalogFilters.type === 'all' || resin.type === catalogFilters.type;
      return notInInventory && matchesSearch && matchesBrand && matchesType;
    });
  }, [catalog, inventoryResinIds, catalogFilters]);

  const groupedCatalog = useMemo(
    () => {
      const grouped: GroupedResins = {};
      filteredCatalog.forEach((resin) => {
        const { brand, product_line } = resin;
        if (!grouped[brand]) grouped[brand] = {};
        if (!grouped[brand][product_line]) grouped[brand][product_line] = [];
        grouped[brand][product_line].push(resin);
      });
      return grouped;
    },
    [filteredCatalog],
  );

  // --- Actions ---
  const toggleResinSelection = useCallback((resinId: string) => {
    setSelectedResins((prev) => {
      const next = new Set(prev);
      if (next.has(resinId)) next.delete(resinId);
      else next.add(resinId);
      return next;
    });
  }, []);

  const addSelectedToInventory = useCallback(async () => {
    if (selectedResins.size === 0) return;
    try {
      await addMutation.mutateAsync(Array.from(selectedResins));
      toast.success(`${selectedResins.size} resina(s) adicionada(s) ao inventário`);
      setSelectedResins(new Set());
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao adicionar resinas');
    }
  }, [selectedResins, addMutation]);

  const removeFromInventory = useCallback(
    async (inventoryItemId: string) => {
      setRemovingResin(inventoryItemId);
      try {
        await removeMutation.mutateAsync(inventoryItemId);
        toast.success('Resina removida do inventário');
      } catch {
        toast.error('Erro ao remover resina');
      }
      setRemovingResin(null);
    },
    [removeMutation],
  );

  const getInventoryItemId = useCallback(
    (resinId: string) => allItems.find((item) => item.resin_id === resinId)?.id,
    [allItems],
  );

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedResins(new Set());
    setCatalogFilters({ search: '', brand: 'all', type: 'all' });
  }, []);

  // --- CSV operations ---
  const exportCSV = useCallback(() => {
    const header = 'Marca,Linha,Cor,Tipo,Opacidade';
    const rows = allItems.map((item) =>
      [item.resin.brand, item.resin.product_line, item.resin.shade, item.resin.type, item.resin.opacity]
        .map((v) => `"${(v || '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario-resinas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso');
  }, [allItems]);

  const handleCSVFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        const dataLines = lines[0]?.toLowerCase().includes('marca') ? lines.slice(1) : lines;

        const matched: CatalogResin[] = [];
        const unmatched: string[] = [];

        for (const line of dataLines) {
          const cols =
            line
              .match(/("([^"]*("")?)*"|[^,]*)(,|$)/g)
              ?.map((v) =>
                v
                  .replace(/,$/, '')
                  .replace(/^"|"$/g, '')
                  .replace(/""/g, '"')
                  .trim(),
              ) || [];

          const [brand, productLine, shade] = cols;
          if (!brand || !shade) {
            unmatched.push(line);
            continue;
          }

          const match = catalog.find(
            (r) =>
              r.brand.toLowerCase() === brand.toLowerCase() &&
              r.shade.toLowerCase() === shade.toLowerCase() &&
              (!productLine || r.product_line.toLowerCase() === productLine.toLowerCase()),
          );

          if (match && !inventoryResinIds.has(match.id) && !matched.some((m) => m.id === match.id)) {
            matched.push(match);
          } else if (!match) {
            unmatched.push(`${brand} - ${productLine || '?'} - ${shade}`);
          }
        }

        setCsvPreview({ matched, unmatched });
        setImportDialogOpen(true);
      };
      reader.readAsText(file);
      if (csvInputRef.current) csvInputRef.current.value = '';
    },
    [catalog, inventoryResinIds],
  );

  const confirmImport = useCallback(async () => {
    if (!csvPreview?.matched.length) return;
    setImporting(true);
    try {
      await addMutation.mutateAsync(csvPreview.matched.map((r) => r.id));
      toast.success(`${csvPreview.matched.length} resina(s) importada(s)`);
      setCsvPreview(null);
      setImportDialogOpen(false);
    } catch {
      toast.error('Erro ao importar resinas');
    }
    setImporting(false);
  }, [csvPreview, addMutation]);

  const closeImportDialog = useCallback(() => {
    setImportDialogOpen(false);
    setCsvPreview(null);
  }, []);

  return {
    // Data
    allItems,
    flatItems,
    total: inventoryQuery.data?.count ?? 0,
    isLoading: inventoryQuery.isLoading,
    catalog,

    // ListPage filter options
    brandOptions,
    typeOptions,

    // Catalog dialog
    dialogOpen,
    openDialog,
    closeDialog,
    groupedCatalog,
    catalogBrands,
    catalogTypes,
    catalogFilters,
    setCatalogFilters,
    selectedResins,
    toggleResinSelection,
    addSelectedToInventory,
    isAdding: addMutation.isPending,

    // Remove
    deletingItemId,
    setDeletingItemId,
    removingResin,
    removeFromInventory,
    getInventoryItemId,

    // CSV
    csvInputRef,
    exportCSV,
    handleCSVFile,
    importDialogOpen,
    closeImportDialog,
    csvPreview,
    confirmImport,
    importing,
  };
}
