import { useMemo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Clock, Trash2, RotateCcw, Loader2 } from 'lucide-react';
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
    ? formatDistanceToNow(new Date(lastSavedAt), { addSuffix: true, locale: ptBR })
    : 'recentemente', [lastSavedAt]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      await onRestore();
    } finally {
      setIsRestoring(false);
    }
  }, [onRestore]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            {t('components.wizard.draftRestore.title')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                {t('components.wizard.draftRestore.description')}
              </p>
              <p>
                {t('components.wizard.draftRestore.explanation', {
                  defaultValue: 'Você tem um caso em andamento que não foi concluído. Deseja continuar de onde parou ou iniciar um novo caso?',
                })}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Clock className="w-4 h-4" />
                <span>{t('components.wizard.draftRestore.lastSaved', { time: timeAgo })}</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onDiscard} disabled={isRestoring} className="gap-2">
            <Trash2 className="w-4 h-4" />
            {t('components.wizard.draftRestore.startOver')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isRestoring} className="gap-2">
            {isRestoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isRestoring
              ? t('components.wizard.draftRestore.restoring', 'Restaurando...')
              : t('components.wizard.draftRestore.continue')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
