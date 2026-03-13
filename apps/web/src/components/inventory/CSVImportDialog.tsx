import { useTranslation } from 'react-i18next';
import { FormModal } from '@parisgroup-ai/pageshell/composites';
import { FileWarning, Check } from 'lucide-react';
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

  const previewContent = csvPreview ? (
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
              <p key={i} className="text-xs text-muted-foreground truncate" title={line}>
                {line.length > 120 ? `${line.slice(0, 120)}...` : line}
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
  ) : null;

  return (
    <FormModal
      open={importDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeImportDialog();
      }}
      title={t('inventory.importCSVTitle')}
      size="md"
      fields={[]}
      onSubmit={confirmImport}
      isSubmitting={importing}
      isSubmitDisabled={!csvPreview?.matched.length || importing}
      submitText={t('inventory.addResinsCount', { count: csvPreview?.matched.length || 0 })}
      cancelText={t('common.cancel')}
      closeOnSuccess={false}
      slots={{
        beforeFields: previewContent,
      }}
    />
  );
}
