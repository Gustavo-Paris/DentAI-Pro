import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

export function CreditsBanner({
  creditsRemaining,
  onDismiss,
}: {
  creditsRemaining: number;
  onDismiss: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 dark:border-primary/15 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 dark:from-primary/8 dark:via-primary/4 dark:to-primary/8" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />

      <div className="relative flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
          <AlertTriangle className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {creditsRemaining} crédito{creditsRemaining !== 1 ? 's' : ''} restante{creditsRemaining !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Faça upgrade para continuar sem interrupção
          </p>
        </div>
        <Link to="/pricing">
          <Button size="sm" className="btn-glow-gold shrink-0">
            Ver planos
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
