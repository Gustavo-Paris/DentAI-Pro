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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Package, Loader2, X, Download, Upload, FileWarning, Check } from 'lucide-react';
import { useInventoryManagement } from '@/hooks/domain/useInventoryManagement';
import { ResinBadge } from '@/components/ResinBadge';
import { ResinTypeLegend } from '@/components/ResinTypeLegend';

// =============================================================================
// Page Adapter — maps domain hook → custom UI
// =============================================================================

export default function Inventory() {
  const inv = useInventoryManagement();

  if (inv.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        {/* Summary card */}
        <Skeleton className="h-[72px] w-full rounded-lg" />
        {/* Accordion items */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold font-display tracking-tight">Meu Inventário</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas resinas disponíveis
            </p>
          </div>

          <div className="flex items-center gap-2">
            {inv.allItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={inv.exportCSV}>
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => inv.csvInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <input
              ref={inv.csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={inv.handleCSVFile}
              className="hidden"
            />
            <Dialog open={inv.dialogOpen} onOpenChange={(open) => open ? inv.openDialog() : inv.closeDialog()}>
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

                <ResinTypeLegend />

                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cor, marca..."
                      value={inv.catalogFilters.search}
                      onChange={(e) => inv.setCatalogFilters((f) => ({ ...f, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={inv.catalogFilters.brand}
                    onValueChange={(v) => inv.setCatalogFilters((f) => ({ ...f, brand: v }))}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as marcas</SelectItem>
                      {inv.catalogBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={inv.catalogFilters.type}
                    onValueChange={(v) => inv.setCatalogFilters((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {inv.catalogTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-y-auto flex-1 mt-4 pr-2">
                  {Object.keys(inv.groupedCatalog).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {inv.catalogFilters.search || inv.catalogFilters.brand !== 'all' || inv.catalogFilters.type !== 'all'
                        ? 'Nenhuma resina encontrada'
                        : 'Todas as resinas já estão no inventário'}
                    </p>
                  ) : (
                    <Accordion type="multiple" defaultValue={Object.keys(inv.groupedCatalog)} className="space-y-2">
                      {Object.entries(inv.groupedCatalog).map(([brand, productLines]) => (
                        <AccordionItem key={brand} value={brand} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="font-semibold">{brand}</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pb-2">
                              {Object.entries(productLines).map(([productLine, resins]) => (
                                <div key={productLine}>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">{productLine}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {resins.map((resin) => (
                                      <ResinBadge
                                        key={resin.id}
                                        shade={resin.shade}
                                        type={resin.type}
                                        selected={inv.selectedResins.has(resin.id)}
                                        onClick={() => inv.toggleResinSelection(resin.id)}
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
                      {inv.selectedResins.size} resina(s) selecionada(s)
                    </span>
                    <Button onClick={inv.addSelectedToInventory} disabled={inv.selectedResins.size === 0 || inv.isAdding}>
                      {inv.isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Adicionar ao Inventário
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ResinTypeLegend />

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no inventário..."
              value={inv.inventoryFilters.search}
              onChange={(e) => inv.setInventoryFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Select
            value={inv.inventoryFilters.brand}
            onValueChange={(v) => inv.setInventoryFilters((f) => ({ ...f, brand: v }))}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {inv.inventoryBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={inv.inventoryFilters.type}
            onValueChange={(v) => inv.setInventoryFilters((f) => ({ ...f, type: v }))}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {inv.inventoryTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
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
                <p className="text-2xl font-semibold">{inv.allItems.length}</p>
                <p className="text-sm text-muted-foreground">cores de resina no inventário</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List - Grouped */}
        {Object.keys(inv.groupedInventory).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold font-display mb-2">Inventário vazio</h3>
              <p className="text-muted-foreground mb-4">
                {inv.inventoryFilters.search || inv.inventoryFilters.type !== 'all' || inv.inventoryFilters.brand !== 'all'
                  ? 'Nenhuma resina encontrada com esses filtros'
                  : 'Adicione suas primeiras resinas ao inventário'}
              </p>
              {!inv.inventoryFilters.search && inv.inventoryFilters.type === 'all' && inv.inventoryFilters.brand === 'all' && (
                <Button onClick={inv.openDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resinas
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(inv.groupedInventory)} className="space-y-3">
            {Object.entries(inv.groupedInventory).map(([brand, productLines]) => (
              <AccordionItem key={brand} value={brand} className="border rounded-lg bg-card px-4">
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
                        <p className="text-sm font-medium text-muted-foreground mb-3">{productLine}</p>
                        <div className="flex flex-wrap gap-2">
                          {resins.map((resin) => {
                            const inventoryItemId = inv.getInventoryItemId(resin.id);
                            const isRemoving = inv.removingResin === inventoryItemId;
                            return (
                              <div key={resin.id} className="group relative">
                                <ResinBadge shade={resin.shade} type={resin.type} size="md" showColorSwatch />
                                <button
                                  onClick={() => inventoryItemId && inv.setDeletingItemId(inventoryItemId)}
                                  disabled={isRemoving}
                                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remover"
                                >
                                  {isRemoving ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                                  ) : (
                                    <X className="h-3 w-3 text-destructive" />
                                  )}
                                </button>
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

      {/* Remove Confirmation */}
      <AlertDialog open={!!inv.deletingItemId} onOpenChange={(open) => { if (!open) inv.setDeletingItemId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta resina do inventário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inv.deletingItemId) {
                  inv.removeFromInventory(inv.deletingItemId);
                  inv.setDeletingItemId(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Preview */}
      <Dialog open={inv.importDialogOpen} onOpenChange={(open) => { if (!open) inv.closeImportDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Inventário via CSV</DialogTitle>
          </DialogHeader>

          {inv.csvPreview && (
            <div className="space-y-4">
              {inv.csvPreview.matched.length > 0 && (
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {inv.csvPreview.matched.length} resina(s) encontrada(s)
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {inv.csvPreview.matched.map((r) => (
                      <p key={r.id} className="text-xs text-muted-foreground">
                        {r.brand} &middot; {r.product_line} &middot; {r.shade}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {inv.csvPreview.unmatched.length > 0 && (
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                    <FileWarning className="w-4 h-4" />
                    {inv.csvPreview.unmatched.length} não encontrada(s) no catálogo
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1 border rounded-lg p-2 border-amber-200 dark:border-amber-800">
                    {inv.csvPreview.unmatched.map((line, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              )}
              {inv.csvPreview.matched.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma resina do CSV foi encontrada no catálogo.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={inv.closeImportDialog}>
              Cancelar
            </Button>
            <Button onClick={inv.confirmImport} disabled={!inv.csvPreview?.matched.length || inv.importing}>
              {inv.importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar {inv.csvPreview?.matched.length || 0} resina(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
