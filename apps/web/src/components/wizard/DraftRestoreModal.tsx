import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Trash2, RotateCcw } from 'lucide-react';
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
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreModal({
  open,
  onOpenChange,
  lastSavedAt,
  onRestore,
  onDiscard,
}: DraftRestoreModalProps) {
  const timeAgo = lastSavedAt
    ? formatDistanceToNow(new Date(lastSavedAt), { addSuffix: true, locale: ptBR })
    : 'recentemente';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Continuar avaliação anterior?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Você tem uma avaliação não finalizada salva automaticamente.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Clock className="w-4 h-4" />
                <span>Último salvamento: {timeAgo}</span>
              </div>
              <p>
                Deseja continuar de onde parou ou começar uma nova avaliação?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onDiscard} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Começar do zero
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
