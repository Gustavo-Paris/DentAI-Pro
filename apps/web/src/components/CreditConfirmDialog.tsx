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
import { Coins } from 'lucide-react';
import type { CreditConfirmData } from '@/hooks/domain/wizard/types';

interface CreditConfirmDialogProps {
  data: CreditConfirmData | null;
  onConfirm: (confirmed: boolean) => void;
}

export function CreditConfirmDialog({ data, onConfirm }: CreditConfirmDialogProps) {
  if (!data) return null;

  const afterRemaining = data.remaining - data.cost;

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onConfirm(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Confirmar uso de créditos
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong>{data.operationLabel}</strong> custará{' '}
                <strong>{data.cost} {data.cost === 1 ? 'crédito' : 'créditos'}</strong>.
              </p>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Saldo atual</span>
                <span className="font-semibold">{data.remaining} créditos</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Após operação</span>
                <span className={`font-semibold ${afterRemaining <= 1 ? 'text-destructive' : ''}`}>
                  {afterRemaining} créditos
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onConfirm(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(true)}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
