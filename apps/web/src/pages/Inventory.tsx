import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { memo, useCallback, useMemo } from 'react';
import { Lightbulb, Plus, X } from 'lucide-react';
import { ListPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { TipBanner } from '@/components/TipBanner';
import { useInventoryManagement } from '@/hooks/domain/useInventoryManagement';
import type { FlatInventoryItem } from '@/hooks/domain/useInventoryManagement';
import { ResinBadge } from '@/components/ResinBadge';
import { ResinTypeLegend } from '@/components/ResinTypeLegend';
import { AddResinsDialog } from '@/components/inventory/AddResinsDialog';
import { CSVImportDialog } from '@/components/inventory/CSVImportDialog';

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
    <div className="group relative p-2 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200">
      <ResinBadge shade={item.shade} type={item.type} size="md" showColorSwatch />
      <p className="text-xs text-muted-foreground mt-1 truncate">{item.brand}</p>
      <p className="text-xs text-muted-foreground truncate">{item.product_line}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="absolute -top-2 -right-2 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
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
  useDocumentTitle(t('pageTitle.inventory', { defaultValue: 'Inventário' }));
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

  const renderCard = useCallback(
    (item: FlatInventoryItem) => (
      <InventoryResinCard item={item} onRemove={inv.setDeletingItemId} />
    ),
    [inv.setDeletingItemId],
  );

  if (inv.isError) {
    return (
      <GenericErrorState
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
        renderCard={renderCard}
        gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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

      {/* Tip for sparse inventory */}
      {!inv.isLoading && inv.flatItems.length > 0 && inv.flatItems.length <= 10 && (
        <TipBanner
          className="mt-4"
          icon={Lightbulb}
          title={t('inventory.tipTitle', { defaultValue: 'Dica: Adicione mais resinas' })}
          description={t('inventory.tipDescription', { defaultValue: 'Com mais cores no inventário, as recomendações de IA ficam mais precisas e personalizadas para o seu consultório.' })}
          action={{
            label: t('inventory.addResins'),
            icon: Plus,
            onClick: inv.openDialog,
          }}
        />
      )}

      {/* Hidden CSV file input */}
      <input
        ref={inv.csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={inv.handleCSVFile}
        className="hidden"
      />

      {/* Add Resins Dialog */}
      <AddResinsDialog
        dialogOpen={inv.dialogOpen}
        openDialog={inv.openDialog}
        closeDialog={inv.closeDialog}
        groupedCatalog={inv.groupedCatalog}
        catalogBrands={inv.catalogBrands}
        catalogTypes={inv.catalogTypes}
        catalogFilters={inv.catalogFilters}
        setCatalogFilters={inv.setCatalogFilters}
        selectedResins={inv.selectedResins}
        toggleResinSelection={inv.toggleResinSelection}
        addSelectedToInventory={inv.addSelectedToInventory}
        isAdding={inv.isAdding}
      />

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
      <CSVImportDialog
        importDialogOpen={inv.importDialogOpen}
        closeImportDialog={inv.closeImportDialog}
        csvPreview={inv.csvPreview}
        confirmImport={inv.confirmImport}
        importing={inv.importing}
      />
    </div>
  );
}
