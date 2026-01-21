import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Package, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Resin {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  opacity: string;
  aesthetics: string;
  resistance: string;
  polishing: string;
  price_range: string;
  indications: string[];
  description: string | null;
}

interface InventoryItem {
  id: string;
  resin_id: string;
  resin: Resin;
}

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<Resin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingResin, setAddingResin] = useState<string | null>(null);
  const [removingResin, setRemovingResin] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
        resin:resins(*)
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
      .from('resins')
      .select('*')
      .order('manufacturer', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching catalog:', error);
    } else {
      setCatalog(data || []);
    }
  };

  const addToInventory = async (resinId: string) => {
    if (!user) return;
    
    setAddingResin(resinId);
    
    const { error } = await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        resin_id: resinId,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Esta resina já está no seu inventário');
      } else {
        console.error('Error adding to inventory:', error);
        toast.error('Erro ao adicionar resina');
      }
    } else {
      toast.success('Resina adicionada ao inventário');
      await fetchInventory();
      setDialogOpen(false);
    }
    
    setAddingResin(null);
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

  const inventoryResinIds = inventory.map((item) => item.resin_id);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.resin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.resin.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.resin.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredCatalog = catalog.filter((resin) => {
    const notInInventory = !inventoryResinIds.includes(resin.id);
    const matchesSearch =
      resin.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      resin.manufacturer.toLowerCase().includes(catalogSearch.toLowerCase());
    return notInInventory && matchesSearch;
  });

  const resinTypes = [...new Set(inventory.map((item) => item.resin.type))];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Nano-híbrida':
        return 'bg-primary/10 text-primary';
      case 'Supra-nano':
        return 'bg-secondary/80 text-secondary-foreground';
      case 'Microhíbrida':
        return 'bg-accent/50 text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Resina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Adicionar Resina ao Inventário</DialogTitle>
              </DialogHeader>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar resina..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {filteredCatalog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {catalogSearch
                      ? 'Nenhuma resina encontrada'
                      : 'Todas as resinas já estão no inventário'}
                  </p>
                ) : (
                  filteredCatalog.map((resin) => (
                    <div
                      key={resin.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{resin.name}</span>
                          <Badge
                            variant="secondary"
                            className={getTypeColor(resin.type)}
                          >
                            {resin.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resin.manufacturer} • {resin.opacity} • {resin.price_range}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToInventory(resin.id)}
                        disabled={addingResin === resin.id}
                      >
                        {addingResin === resin.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no inventário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {resinTypes.map((type) => (
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
                  resinas no inventário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        {filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Inventário vazio</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== 'all'
                  ? 'Nenhuma resina encontrada com esses filtros'
                  : 'Adicione suas primeiras resinas ao inventário'}
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resina
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {item.resin.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {item.resin.manufacturer}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromInventory(item.id)}
                      disabled={removingResin === item.id}
                    >
                      {removingResin === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={getTypeColor(item.resin.type)}
                    >
                      {item.resin.type}
                    </Badge>
                    <Badge variant="outline">{item.resin.opacity}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estética:</span>
                      <span className="ml-1">{item.resin.aesthetics}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resistência:</span>
                      <span className="ml-1">{item.resin.resistance}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Polimento:</span>
                      <span className="ml-1">{item.resin.polishing}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="ml-1">{item.resin.price_range}</span>
                    </div>
                  </div>
                  {item.resin.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {item.resin.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
