import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Package, 
  Trash2, 
  ArrowLeft,
  Filter,
} from 'lucide-react';

// Using resins table until resin_catalog migration is applied
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedResin, setSelectedResin] = useState<string>('');
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    if (user) {
      fetchCatalog();
      setLoading(false);
    }
  }, [user]);

  const fetchCatalog = async () => {
    // Use existing resins table
    const { data, error } = await supabase
      .from('resins')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching catalog:', error);
    } else {
      setCatalog(data || []);
    }
  };

  const addToInventory = async () => {
    if (!selectedResin) return;

    // Check if resin already in inventory
    const existing = inventory.find(item => item.resin_id === selectedResin);
    if (existing) {
      toast.error('Esta resina já está no seu inventário');
      return;
    }

    const resin = catalog.find(r => r.id === selectedResin);
    if (resin) {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        resin_id: selectedResin,
        resin: resin,
      };
      setInventory([...inventory, newItem]);
      toast.success('Resina adicionada ao inventário');
      setAddDialogOpen(false);
      setSelectedResin('');
      setCatalogSearch('');
    }
  };

  const removeFromInventory = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
    toast.success('Resina removida do inventário');
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.resin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.resin.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || item.resin.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const filteredCatalog = catalog.filter(resin => {
    const notInInventory = !inventory.some(item => item.resin_id === resin.id);
    const matchesSearch = 
      resin.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      resin.manufacturer.toLowerCase().includes(catalogSearch.toLowerCase());
    
    return notInInventory && matchesSearch;
  });

  const resinTypes = [...new Set(inventory.map(item => item.resin.type))];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'universal': 'bg-primary/10 text-primary',
      'nanohíbrida': 'bg-chart-1/20 text-chart-3',
      'microhíbrida': 'bg-chart-2/20 text-chart-3',
      'bulk-fill': 'bg-chart-4/20 text-chart-3',
      'flow': 'bg-chart-5/20 text-chart-3',
    };
    return colors[type.toLowerCase()] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-xl font-semibold tracking-tight">Meu Inventário</span>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Resina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Resina ao Inventário</DialogTitle>
                <DialogDescription>
                  Selecione uma resina do catálogo para adicionar ao seu inventário.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar no catálogo..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredCatalog.slice(0, 20).map((resin) => (
                    <div
                      key={resin.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedResin === resin.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-secondary/50'
                      }`}
                      onClick={() => setSelectedResin(resin.id)}
                    >
                      <p className="font-medium">{resin.name}</p>
                      <p className="text-sm text-muted-foreground">{resin.manufacturer}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {resin.type}
                      </Badge>
                    </div>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma resina encontrada
                    </p>
                  )}
                </div>
                <Button 
                  onClick={addToInventory} 
                  disabled={!selectedResin}
                  className="w-full"
                >
                  Adicionar ao Inventário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar resinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {resinTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{inventory.length}</p>
                  <p className="text-sm text-muted-foreground">resinas no inventário</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredInventory.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Nenhuma resina encontrada com esses filtros'
                : 'Seu inventário está vazio'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeira resina
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.resin.name}</h3>
                      <Badge className={getTypeColor(item.resin.type)}>
                        {item.resin.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.resin.manufacturer}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Estética: {item.resin.aesthetics}</span>
                      <span>•</span>
                      <span>Resistência: {item.resin.resistance}</span>
                      <span>•</span>
                      <span>Polimento: {item.resin.polishing}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeFromInventory(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}