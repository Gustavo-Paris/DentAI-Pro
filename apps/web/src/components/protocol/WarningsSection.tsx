import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle } from "lucide-react";

interface WarningsSectionProps {
  warnings: string[];
}

const PLACEHOLDER_PATTERNS = [/^NÃO fazer [A-Z]$/i, /^não fazer [a-z]$/i, /^placeholder/i];

function WarningsSection({ warnings }: WarningsSectionProps) {
  const { t } = useTranslation();
  const filtered = warnings?.filter(w => !PLACEHOLDER_PATTERNS.some(p => p.test(w.trim())));
  if (!filtered || filtered.length === 0) return null;

  return (
    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="w-5 h-5 text-destructive" />
        <h4 className="font-medium text-destructive">{t('components.protocol.warnings.title')}</h4>
      </div>
      <ul className="space-y-2">
        {filtered.map((warning, index) => (
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
