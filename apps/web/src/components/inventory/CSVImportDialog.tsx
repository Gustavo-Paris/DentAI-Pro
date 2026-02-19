import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@parisgroup-ai/pageshell/primitives';
import { Plus, Loader2, FileWarning, Check } from 'lucide-react';
import type { CsvPreview } from '@/hooks/domain/useInventoryManagement';

export interface CSVImportDialogProps {
  importDialogOpen: boolean;
  closeImportDialog: () => void;
  csvPreview: CsvPreview | null;
  confirmImport: () => Promise<void>;
  importing: boolean;
}

export function CSVImportDialog({
  importDialogOpen,
  closeImportDialog,
  csvPreview,
  confirmImport,
  importing,
}: CSVImportDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={importDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeImportDialog();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inventory.importCSVTitle')}</DialogTitle>
        </DialogHeader>

        {csvPreview && (
          <div className="space-y-4">
            {csvPreview.matched.length > 0 && (
              <div>
                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-success" />
                  {t('inventory.resinsMatched', { count: csvPreview.matched.length })}
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {csvPreview.matched.map((r) => (
                    <p key={r.id} className="text-xs text-muted-foreground">
                      {r.brand} &middot; {r.product_line} &middot; {r.shade}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {csvPreview.unmatched.length > 0 && (
              <div>
                <p className="text-sm font-medium flex items-center gap-2 mb-2 text-warning">
                  <FileWarning className="w-4 h-4" />
                  {t('inventory.resinsUnmatched', { count: csvPreview.unmatched.length })}
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1 border rounded-lg p-2 border-warning/30">
                  {csvPreview.unmatched.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {csvPreview.matched.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('inventory.noCSVMatch')}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeImportDialog}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={confirmImport}
            disabled={!csvPreview?.matched.length || importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {t('inventory.addResinsCount', { count: csvPreview?.matched.length || 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
