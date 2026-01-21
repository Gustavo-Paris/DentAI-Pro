import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Plus, Search, Package, Trash2, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ResinBadge } from '@/components/ResinBadge';
import { ResinTypeLegend, getTypeColorClasses } from '@/components/ResinTypeLegend';

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

// Group resins by brand and product_line
interface GroupedResins {
  [brand: string]: {
    [productLine: string]: CatalogResin[];
  };
}

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogResin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingResins, setAddingResins] = useState(false);
  const [removingResin, setRemovingResin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterBrand, setCatalogFilterBrand] = useState('all');
  const [catalogFilterType, setCatalogFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResins, setSelectedResins] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchCatalog();
    }
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_inventory')
      .select(`
        id,
        resin_id,
        resin:resin_catalog(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Erro ao carregar inventário');
    } else {
      setInventory((data as unknown as InventoryItem[]) || []);
    }
    setLoading(false);
  };

  const fetchCatalog = async () => {
    const { data, error } = await supabase
      .from('resin_catalog')
      .select('*')
      .order('brand', { ascending: true })
      .order('product_line', { ascending: true })
      .order('type', { ascending: true })
      .order('shade', { ascending: true });

    if (error) {
      console.error('Error fetching catalog:', error);
    } else {
      setCatalog(data || []);
    }
  };

  const addSelectedToInventory = async () => {
    if (!user || selectedResins.size === 0) return;

    setAddingResins(true);

    const inserts = Array.from(selectedResins).map((resinId) => ({
      user_id: user.id,
      resin_id: resinId,
    }));

    const { error } = await supabase.from('user_inventory').insert(inserts);

    if (error) {
      console.error('Error adding to inventory:', error);
      toast.error('Erro ao adicionar resinas');
    } else {
      toast.success(`${selectedResins.size} resina(s) adicionada(s) ao inventário`);
      setSelectedResins(new Set());
      await fetchInventory();
      setDialogOpen(false);
    }

    setAddingResins(false);
  };

  const removeFromInventory = async (inventoryItemId: string) => {
    setRemovingResin(inventoryItemId);

    const { error } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', inventoryItemId);

    if (error) {
      console.error('Error removing from inventory:', error);
      toast.error('Erro ao remover resina');
    } else {
      toast.success('Resina removida do inventário');
      setInventory(inventory.filter((item) => item.id !== inventoryItemId));
    }

    setRemovingResin(null);
  };

  const toggleResinSelection = (resinId: string) => {
    const newSelection = new Set(selectedResins);
    if (newSelection.has(resinId)) {
      newSelection.delete(resinId);
    } else {
      newSelection.add(resinId);
    }
    setSelectedResins(newSelection);
  };

  const inventoryResinIds = useMemo(
    () => new Set(inventory.map((item) => item.resin_id)),
    [inventory]
  );

  // Get unique brands and types from inventory
  const inventoryBrands = useMemo(
    () => [...new Set(inventory.map((item) => item.resin.brand))].sort(),
    [inventory]
  );

  const inventoryTypes = useMemo(
    () => [...new Set(inventory.map((item) => item.resin.type))].sort(),
    [inventory]
  );

  // Get unique brands and types from catalog
  const catalogBrands = useMemo(
    () => [...new Set(catalog.map((r) => r.brand))].sort(),
    [catalog]
  );

  const catalogTypes = useMemo(
    () => [...new Set(catalog.map((r) => r.type))].sort(),
    [catalog]
  );

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.resin.shade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resin.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resin.product_line.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.resin.type === filterType;
      const matchesBrand = filterBrand === 'all' || item.resin.brand === filterBrand;
      return matchesSearch && matchesType && matchesBrand;
    });
  }, [inventory, searchTerm, filterType, filterBrand]);

  // Group filtered inventory by brand and product_line
  const groupedInventory = useMemo(() => {
    const grouped: GroupedResins = {};
    filteredInventory.forEach((item) => {
      const { brand, product_line } = item.resin;
      if (!grouped[brand]) {
        grouped[brand] = {};
      }
      if (!grouped[brand][product_line]) {
        grouped[brand][product_line] = [];
      }
      grouped[brand][product_line].push(item.resin);
    });
    return grouped;
  }, [filteredInventory]);

  // Get inventory item by resin_id for removal
  const getInventoryItemId = (resinId: string) => {
    return inventory.find((item) => item.resin_id === resinId)?.id;
  };

  // Filter catalog for dialog (exclude already in inventory)
  const filteredCatalog = useMemo(() => {
    return catalog.filter((resin) => {
      const notInInventory = !inventoryResinIds.has(resin.id);
      const matchesSearch =
        resin.shade.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        resin.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        resin.product_line.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesBrand = catalogFilterBrand === 'all' || resin.brand === catalogFilterBrand;
      const matchesType = catalogFilterType === 'all' || resin.type === catalogFilterType;
      return notInInventory && matchesSearch && matchesBrand && matchesType;
    });
  }, [catalog, inventoryResinIds, catalogSearch, catalogFilterBrand, catalogFilterType]);

  // Group filtered catalog by brand and product_line
  const groupedCatalog = useMemo(() => {
    const grouped: GroupedResins = {};
    filteredCatalog.forEach((resin) => {
      const { brand, product_line } = resin;
      if (!grouped[brand]) {
        grouped[brand] = {};
      }
      if (!grouped[brand][product_line]) {
        grouped[brand][product_line] = [];
      }
      grouped[brand][product_line].push(resin);
    });
    return grouped;
  }, [filteredCatalog]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Meu Inventário</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas resinas disponíveis
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedResins(new Set());
              setCatalogSearch('');
              setCatalogFilterBrand('all');
              setCatalogFilterType('all');
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Resinas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Adicionar Resinas ao Inventário</DialogTitle>
              </DialogHeader>

              {/* Legend */}
              <ResinTypeLegend />

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cor, marca..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={catalogFilterBrand} onValueChange={setCatalogFilterBrand}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {catalogBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={catalogFilterType} onValueChange={setCatalogFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {catalogTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Catalog Grid */}
              <div className="overflow-y-auto flex-1 mt-4 pr-2">
                {Object.keys(groupedCatalog).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {catalogSearch || catalogFilterBrand !== 'all' || catalogFilterType !== 'all'
                      ? 'Nenhuma resina encontrada'
                      : 'Todas as resinas já estão no inventário'}
                  </p>
                ) : (
                  <Accordion type="multiple" defaultValue={Object.keys(groupedCatalog)} className="space-y-2">
                    {Object.entries(groupedCatalog).map(([brand, productLines]) => (
                      <AccordionItem key={brand} value={brand} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <span className="font-semibold">{brand}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pb-2">
                            {Object.entries(productLines).map(([productLine, resins]) => (
                              <div key={productLine}>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                  {productLine}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {resins.map((resin) => (
                                    <ResinBadge
                                      key={resin.id}
                                      shade={resin.shade}
                                      type={resin.type}
                                      selected={selectedResins.has(resin.id)}
                                      onClick={() => toggleResinSelection(resin.id)}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              <DialogFooter className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-muted-foreground">
                    {selectedResins.size} resina(s) selecionada(s)
                  </span>
                  <Button
                    onClick={addSelectedToInventory}
                    disabled={selectedResins.size === 0 || addingResins}
                  >
                    {addingResins ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar ao Inventário
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Legend */}
        <ResinTypeLegend />

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no inventário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {inventoryBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {inventoryTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{inventory.length}</p>
                <p className="text-sm text-muted-foreground">
                  cores de resina no inventário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List - Grouped */}
        {Object.keys(groupedInventory).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Inventário vazio</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== 'all' || filterBrand !== 'all'
                  ? 'Nenhuma resina encontrada com esses filtros'
                  : 'Adicione suas primeiras resinas ao inventário'}
              </p>
              {!searchTerm && filterType === 'all' && filterBrand === 'all' && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resinas
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(groupedInventory)} className="space-y-3">
            {Object.entries(groupedInventory).map(([brand, productLines]) => (
              <AccordionItem
                key={brand}
                value={brand}
                className="border rounded-lg bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{brand}</span>
                    <Badge variant="secondary" className="font-normal">
                      {Object.values(productLines).flat().length} cores
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pb-4">
                    {Object.entries(productLines).map(([productLine, resins]) => (
                      <div key={productLine}>
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          {productLine}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {resins.map((resin) => {
                            const inventoryItemId = getInventoryItemId(resin.id);
                            const isRemoving = removingResin === inventoryItemId;
                            return (
                              <div
                                key={resin.id}
                                className="group relative"
                              >
                                <Badge
                                  variant="secondary"
                                  className={`${getTypeColorClasses(resin.type)} pr-7 py-1.5 text-sm`}
                                >
                                  {resin.shade}
                                  <button
                                    onClick={() => inventoryItemId && removeFromInventory(inventoryItemId)}
                                    disabled={isRemoving}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                                    title="Remover"
                                  >
                                    {isRemoving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                                    )}
                                  </button>
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
