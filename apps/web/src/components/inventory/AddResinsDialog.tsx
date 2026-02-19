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
import { Plus, Search, Loader2 } from 'lucide-react';
import { ResinBadge } from '@/components/ResinBadge';
import { ResinTypeLegend } from '@/components/ResinTypeLegend';
import type { GroupedResins, CatalogFilters } from '@/hooks/domain/useInventoryManagement';

export interface AddResinsDialogProps {
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  groupedCatalog: GroupedResins;
  catalogBrands: string[];
  catalogTypes: string[];
  catalogFilters: CatalogFilters;
  setCatalogFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>;
  selectedResins: Set<string>;
  toggleResinSelection: (resinId: string) => void;
  addSelectedToInventory: () => Promise<void>;
  isAdding: boolean;
}

export function AddResinsDialog({
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
  isAdding,
}: AddResinsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => (open ? openDialog() : closeDialog())}>
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
              value={catalogFilters.search}
              onChange={(e) => setCatalogFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-10"
              aria-label={t('inventory.searchColorBrand')}
            />
          </div>
          <Select
            value={catalogFilters.brand}
            onValueChange={(v) => setCatalogFilters((f) => ({ ...f, brand: v }))}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t('inventory.brandFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventory.allBrands')}</SelectItem>
              {catalogBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={catalogFilters.type}
            onValueChange={(v) => setCatalogFilters((f) => ({ ...f, type: v }))}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t('inventory.typeFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventory.allTypes')}</SelectItem>
              {catalogTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto flex-1 mt-4 pr-2">
          {Object.keys(groupedCatalog).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {catalogFilters.search ||
              catalogFilters.brand !== 'all' ||
              catalogFilters.type !== 'all'
                ? t('inventory.noResinsFound')
                : t('inventory.allResinsInInventory')}
            </p>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={Object.keys(groupedCatalog)}
              className="space-y-2"
            >
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
              {t('inventory.resinsSelected', { count: selectedResins.size })}
            </span>
            <Button
              onClick={addSelectedToInventory}
              disabled={selectedResins.size === 0 || isAdding}
            >
              {isAdding ? (
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
  );
}
