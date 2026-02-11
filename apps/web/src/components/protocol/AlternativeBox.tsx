import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocolAlternative } from "@/types/protocol";

export type { ProtocolAlternative };

interface AlternativeBoxProps {
  alternative: ProtocolAlternative;
}

function AlternativeBox({ alternative }: AlternativeBoxProps) {
  const { t } = useTranslation();
  if (!alternative) return null;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          {t('components.protocol.alternative.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">{t('components.protocol.alternative.resin')}</span>
            <p className="font-medium">{alternative.resin}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('components.protocol.alternative.color')}</span>
            <p className="font-mono font-medium">{alternative.shade}</p>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">{t('components.protocol.alternative.technique')}</span>
          <p className="text-sm">{alternative.technique}</p>
        </div>
        <div className="pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">{t('components.protocol.alternative.tradeoff')}</span>
          <span className="text-sm text-amber-600 dark:text-amber-400">{alternative.tradeoff}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(AlternativeBox);
