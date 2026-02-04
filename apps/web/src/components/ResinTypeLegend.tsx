import { Badge } from '@/components/ui/badge';

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  Esmalte: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Esmalte' },
  Dentina: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Dentina' },
  Body: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', label: 'Body' },
  Opaco: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Opaco' },
  Translúcido: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: 'Translúcido' },
  Universal: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Universal' },
};

export function getTypeColorClasses(type: string): string {
  const colors = typeColors[type];
  if (colors) {
    return `${colors.bg} ${colors.text}`;
  }
  return 'bg-muted text-muted-foreground';
}

export function ResinTypeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
      <span className="text-sm font-medium text-muted-foreground mr-1">Legenda:</span>
      {Object.entries(typeColors).map(([type, colors]) => (
        <Badge
          key={type}
          variant="secondary"
          className={`${colors.bg} ${colors.text} border-0`}
        >
          {colors.label}
        </Badge>
      ))}
    </div>
  );
}
