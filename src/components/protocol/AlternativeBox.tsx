import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProtocolAlternative {
  resin: string;
  shade: string;
  technique: string;
  tradeoff: string;
}

interface AlternativeBoxProps {
  alternative: ProtocolAlternative;
}

export default function AlternativeBox({ alternative }: AlternativeBoxProps) {
  if (!alternative) return null;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Alternativa Simplificada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Resina</span>
            <p className="font-medium">{alternative.resin}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Cor</span>
            <p className="font-mono font-medium">{alternative.shade}</p>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Técnica</span>
          <p className="text-sm">{alternative.technique}</p>
        </div>
        <div className="pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Tradeoff: </span>
          <span className="text-sm text-amber-600 dark:text-amber-400">{alternative.tradeoff}</span>
        </div>
      </CardContent>
    </Card>
  );
}
