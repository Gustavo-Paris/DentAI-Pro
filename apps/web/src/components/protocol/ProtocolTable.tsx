import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProtocolLayer } from "@/types/protocol";

export type { ProtocolLayer };

interface ProtocolTableProps {
  layers: ProtocolLayer[];
}

const getLayerStyles = (layerName: string): string => {
  const name = layerName.toLowerCase();
  if (name.includes("opaco")) {
    return "bg-amber-500/20 dark:bg-amber-500/10 border-l-4 border-l-amber-500";
  }
  if (name.includes("dentina") || name.includes("body")) {
    return "bg-orange-500/20 dark:bg-orange-500/10 border-l-4 border-l-orange-500";
  }
  if (name.includes("esmalte") || name.includes("enamel")) {
    return "bg-blue-400/20 dark:bg-blue-400/10 border-l-4 border-l-blue-400";
  }
  if (name.includes("bulk")) {
    return "bg-purple-500/20 dark:bg-purple-500/10 border-l-4 border-l-purple-500";
  }
  return "bg-muted/50";
};

export default function ProtocolTable({ layers }: ProtocolTableProps) {
  if (!layers || layers.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[140px]">Camada</TableHead>
              <TableHead>Resina</TableHead>
              <TableHead className="w-[80px]">Cor</TableHead>
              <TableHead className="w-[100px]">Espessura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers.map((layer) => (
              <TableRow key={layer.order} className={getLayerStyles(layer.name)}>
                <TableCell className="font-medium">
                  {layer.order}. {layer.name}
                </TableCell>
                <TableCell>{layer.resin_brand}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-background font-mono text-sm">
                    {layer.shade}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                        {layer.thickness}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Ajustar conforme profundidade e mascaramento necessário</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Layer details */}
        <div className="divide-y divide-border">
          {layers.map((layer) => (
            <div key={`detail-${layer.order}`} className="px-4 py-3 bg-muted/30">
              <div className="flex items-start gap-4 text-sm">
                <div className="flex-1">
                  <span className="text-muted-foreground">Objetivo: </span>
                  <span>{layer.purpose}</span>
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground">Técnica: </span>
                  <span>{layer.technique}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden divide-y divide-border">
        {layers.map((layer) => (
          <div key={layer.order} className={`p-3 ${getLayerStyles(layer.name)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {layer.order}. {layer.name}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-background font-mono text-xs">
                {layer.shade}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {layer.resin_brand} • {layer.thickness}
            </p>
            <div className="text-xs space-y-1 mt-2 pt-2 border-t border-border/50">
              <p><span className="text-muted-foreground">Objetivo:</span> {layer.purpose}</p>
              <p><span className="text-muted-foreground">Técnica:</span> {layer.technique}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
