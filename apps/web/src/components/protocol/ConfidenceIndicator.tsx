import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { getConfidenceConfig } from "@/lib/confidence-config";

interface ConfidenceIndicatorProps {
  confidence: "alta" | "média" | "baixa" | string;
}

function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const { t } = useTranslation();
  const current = getConfidenceConfig(confidence);
  const Icon = current.icon;

  return (
    <div className={cn("rounded-lg border p-4 flex items-center gap-4", current.bg, current.border)}>
      <Icon className={cn("w-8 h-8", current.color)} />
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", current.color)}>{t(current.labelKey)}</span>
          {/* Confidence bars */}
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  bar <= current.bars ? current.color.replace("text-", "bg-") : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="sr-only">
            {t(current.labelKey)} ({current.bars}/3)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t(current.descriptionKey)}</p>
      </div>
    </div>
  );
}

export default memo(ConfidenceIndicator);
