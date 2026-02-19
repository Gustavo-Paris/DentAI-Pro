import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { memo, useMemo } from 'react';
import { Plus, Search, Loader2, X, FileWarning, Check } from 'lucide-react';
import { ListPage } from '@parisgroup-ai/pageshell/composites';
import { useInventoryManagement } from '@/hooks/domain/useInventoryManagement';
import type { FlatInventoryItem } from '@/hooks/domain/useInventoryManagement';
import { ResinBadge } from '@/components/ResinBadge';
import { ResinTypeLegend } from '@/components/ResinTypeLegend';
import { ErrorState } from '@/components/ui/error-state';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SEARCH_FIELDS: ('shade' | 'brand' | 'product_line')[] = ['shade', 'brand', 'product_line'];

// =============================================================================
// Card component (presentation only)
// =============================================================================

const InventoryResinCard = memo(function InventoryResinCard({
  item,
  onRemove,
}: {
  item: FlatInventoryItem;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group relative p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <ResinBadge shade={item.shade} type={item.type} size="md" showColorSwatch />
      <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.brand}</p>
      <p className="text-[10px] text-muted-foreground truncate">{item.product_line}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
        title={t('common.remove')}
        aria-label={t('inventory.removeResin')}
      >
        <X className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
});

// =============================================================================
// Page Adapter — maps domain hook → ListPage composite
// =============================================================================

export default function Inventory() {
  const { t } = useTranslation();
  const inv = useInventoryManagement();

  const searchConfig = useMemo(
    () => ({ fields: SEARCH_FIELDS, placeholder: t('inventory.searchPlaceholder') }),
    [t],
  );

  const filtersConfig = useMemo(
    () => ({
      brand: {
        label: t('inventory.brandFilter'),
        options: [
          { value: 'all', label: t('inventory.allBrands') },
          ...inv.brandOptions,
        ],
        default: 'all',
      },
      type: {
        label: t('inventory.typeFilter'),
        options: [
          { value: 'all', label: t('inventory.allTypes') },
          ...inv.typeOptions,
        ],
        default: 'all',
      },
    }),
    [t, inv.brandOptions, inv.typeOptions],
  );

  const sortConfig = useMemo(
    () => ({
      options: [
        {
          value: 'brand-asc' as const,
          label: t('inventory.sortBrandAsc'),
          compare: (a: FlatInventoryItem, b: FlatInventoryItem) =>
            a.brand.localeCompare(b.brand) ||
            a.product_line.localeCompare(b.product_line) ||
            a.shade.localeCompare(b.shade),
        },
        {
          value: 'shade-asc' as const,
          label: t('inventory.sortShadeAsc'),
          compare: (a: FlatInventoryItem, b: FlatInventoryItem) =>
            a.shade.localeCompare(b.shade),
        },
        {
          value: 'type-asc' as const,
          label: t('inventory.sortType'),
          compare: (a: FlatInventoryItem, b: FlatInventoryItem) =>
            a.type.localeCompare(b.type) || a.shade.localeCompare(b.shade),
        },
      ],
      default: 'brand-asc',
    }),
    [t],
  );

  const headerActions = useMemo(
    () => [
      ...(inv.allItems.length > 0
        ? [{ label: 'CSV', icon: 'download' as const, onClick: inv.exportCSV, variant: 'outline' as const }]
        : []),
      { label: t('inventory.import'), icon: 'upload' as const, onClick: () => inv.csvInputRef.current?.click(), variant: 'outline' as const },
    ],
    [t, inv.allItems.length, inv.exportCSV, inv.csvInputRef],
  );

  const createAction = useMemo(
    () => ({ label: t('inventory.addResins'), onClick: inv.openDialog }),
    [t, inv.openDialog],
  );

  const slotsConfig = useMemo(
    () => ({ beforeTableSlot: <ResinTypeLegend /> }),
    [],
  );

  const emptyState = useMemo(
    () => ({
      title: t('inventory.emptyTitle'),
      description: t('inventory.emptyDescription'),
      action: { label: t('inventory.addResins'), onClick: inv.openDialog },
    }),
    [t, inv.openDialog],
  );

  const labels = useMemo(
    () => ({ search: { placeholder: t('inventory.searchPlaceholder') } }),
    [t],
  );

  if (inv.isError) {
    return (
      <ErrorState
        title={t('inventory.loadError', { defaultValue: 'Erro ao carregar inventário' })}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <ListPage<FlatInventoryItem>
        title={t('inventory.title')}
        description={t('inventory.resinColors', { count: inv.total })}
        viewMode="cards"
        items={inv.flatItems}
        isLoading={inv.isLoading}
        itemKey="id"
        renderCard={(item) => (
          <InventoryResinCard item={item} onRemove={inv.setDeletingItemId} />
        )}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
        searchConfig={searchConfig}
        filters={filtersConfig}
        sort={sortConfig}
        pagination={false}
        headerActions={headerActions}
        createAction={createAction}
        slots={slotsConfig}
        emptyState={emptyState}
        labels={labels}
      />

      {/* Hidden CSV file input */}
      <input
        ref={inv.csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={inv.handleCSVFile}
        className="hidden"
      />

      {/* Add Resins Dialog */}
      <Dialog open={inv.dialogOpen} onOpenChange={(open) => (open ? inv.openDialog() : inv.closeDialog())}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('inventory.addToInventoryTitle')}</DialogTitle>
          </DialogHeader>

          <ResinTypeLegend />

          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('inventory.searchColorBrand')}
                value={inv.catalogFilters.search}
                onChange={(e) => inv.setCatalogFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-10"
                aria-label={t('inventory.searchColorBrand')}
              />
            </div>
            <Select
              value={inv.catalogFilters.brand}
              onValueChange={(v) => inv.setCatalogFilters((f) => ({ ...f, brand: v }))}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t('inventory.brandFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allBrands')}</SelectItem>
                {inv.catalogBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={inv.catalogFilters.type}
              onValueChange={(v) => inv.setCatalogFilters((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('inventory.typeFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allTypes')}</SelectItem>
                {inv.catalogTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-y-auto flex-1 mt-4 pr-2">
            {Object.keys(inv.groupedCatalog).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {inv.catalogFilters.search ||
                inv.catalogFilters.brand !== 'all' ||
                inv.catalogFilters.type !== 'all'
                  ? t('inventory.noResinsFound')
                  : t('inventory.allResinsInInventory')}
              </p>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={Object.keys(inv.groupedCatalog)}
                className="space-y-2"
              >
                {Object.entries(inv.groupedCatalog).map(([brand, productLines]) => (
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
                {t('inventory.resinsSelected', { count: inv.selectedResins.size })}
              </span>
              <Button
                onClick={inv.addSelectedToInventory}
                disabled={inv.selectedResins.size === 0 || inv.isAdding}
              >
                {inv.isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('inventory.addToInventory')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <PageConfirmDialog
        open={!!inv.deletingItemId}
        onOpenChange={(open) => {
          if (!open) inv.setDeletingItemId(null);
        }}
        title={t('inventory.confirmRemoveTitle')}
        description={t('inventory.confirmRemoveDescription')}
        confirmText={t('common.remove')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          if (inv.deletingItemId) {
            inv.removeFromInventory(inv.deletingItemId);
            inv.setDeletingItemId(null);
          }
        }}
        variant="destructive"
      />

      {/* CSV Import Preview */}
      <Dialog
        open={inv.importDialogOpen}
        onOpenChange={(open) => {
          if (!open) inv.closeImportDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('inventory.importCSVTitle')}</DialogTitle>
          </DialogHeader>

          {inv.csvPreview && (
            <div className="space-y-4">
              {inv.csvPreview.matched.length > 0 && (
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-success" />
                    {t('inventory.resinsMatched', { count: inv.csvPreview.matched.length })}
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
                  <p className="text-sm font-medium flex items-center gap-2 mb-2 text-warning">
                    <FileWarning className="w-4 h-4" />
                    {t('inventory.resinsUnmatched', { count: inv.csvPreview.unmatched.length })}
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1 border rounded-lg p-2 border-warning/30">
                    {inv.csvPreview.unmatched.map((line, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {inv.csvPreview.matched.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('inventory.noCSVMatch')}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={inv.closeImportDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={inv.confirmImport}
              disabled={!inv.csvPreview?.matched.length || inv.importing}
            >
              {inv.importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {t('inventory.addResinsCount', { count: inv.csvPreview?.matched.length || 0 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
