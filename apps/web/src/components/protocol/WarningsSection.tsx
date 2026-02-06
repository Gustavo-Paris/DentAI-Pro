import { memo } from 'react';
import { XCircle } from "lucide-react";

interface WarningsSectionProps {
  warnings: string[];
}

function WarningsSection({ warnings }: WarningsSectionProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="w-5 h-5 text-destructive" />
        <h4 className="font-medium text-destructive">O que NÃO fazer</h4>
      </div>
      <ul className="space-y-2">
        {warnings.map((warning, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <span className="text-destructive/90">{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(WarningsSection);
