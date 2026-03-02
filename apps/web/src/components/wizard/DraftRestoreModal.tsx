import { useMemo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/date-utils';
import { useTranslation } from 'react-i18next';
import { Clock, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@parisgroup-ai/pageshell/primitives';

interface DraftRestoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSavedAt: string | null;
  onRestore: () => void | Promise<void>;
  onDiscard: () => void;
}

export function DraftRestoreModal({
  open,
  onOpenChange,
  lastSavedAt,
  onRestore,
  onDiscard,
}: DraftRestoreModalProps) {
  const { t } = useTranslation();
  const [isRestoring, setIsRestoring] = useState(false);
  const timeAgo = useMemo(() => lastSavedAt
    ? formatDistanceToNow(new Date(lastSavedAt), { addSuffix: true, locale: getDateLocale() })
    : t('components.wizard.draftRestore.recently'), [lastSavedAt, t]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      await onRestore();
    } finally {
      setIsRestoring(false);
    }
  }, [onRestore]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            {t('components.wizard.draftRestore.title')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                {t('components.wizard.draftRestore.description')}
              </p>
              <p>
                {t('components.wizard.draftRestore.explanation', {
                  })}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Clock className="w-4 h-4" />
                <span>{t('components.wizard.draftRestore.lastSaved', { time: timeAgo })}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={isRestoring} className="gap-2">
            <Trash2 className="w-4 h-4" />
            {t('components.wizard.draftRestore.startOver')}
          </Button>
          <Button onClick={handleRestore} disabled={isRestoring} className="gap-2">
            {isRestoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isRestoring
              ? t('components.wizard.draftRestore.restoring', 'Restaurando...')
              : t('components.wizard.draftRestore.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
