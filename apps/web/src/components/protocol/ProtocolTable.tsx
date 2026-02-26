import { memo } from 'react';
import { useTranslation } from 'react-i18next';
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
  if (name.includes("aumento incisal") || name.includes("incisal edge")) {
    return "bg-[rgb(var(--layer-incisal-rgb)/0.2)] dark:bg-[rgb(var(--layer-incisal-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-incisal-rgb))]";
  }
  if (name.includes("opaco") || name.includes("mascaramento")) {
    return "bg-[rgb(var(--layer-opaco-rgb)/0.2)] dark:bg-[rgb(var(--layer-opaco-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-opaco-rgb))]";
  }
  if (name.includes("dentina") || name.includes("body") || name.includes("corpo")) {
    return "bg-[rgb(var(--layer-dentina-rgb)/0.2)] dark:bg-[rgb(var(--layer-dentina-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-dentina-rgb))]";
  }
  if (name.includes("efeito") || name.includes("effect") || name.includes("corante") || name.includes("opalescente")) {
    return "bg-[rgb(var(--layer-effect-rgb)/0.2)] dark:bg-[rgb(var(--layer-effect-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-effect-rgb))]";
  }
  if (name.includes("crista") || name.includes("proxima")) {
    return "bg-[rgb(var(--layer-esmalte-rgb)/0.2)] dark:bg-[rgb(var(--layer-esmalte-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-esmalte-rgb))]";
  }
  if (name.includes("esmalte") || name.includes("enamel")) {
    return "bg-[rgb(var(--layer-translucido-rgb)/0.2)] dark:bg-[rgb(var(--layer-translucido-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-translucido-rgb))]";
  }
  if (name.includes("bulk")) {
    return "bg-[rgb(var(--layer-default-rgb)/0.2)] dark:bg-[rgb(var(--layer-default-rgb)/0.1)] border-l-4 border-l-[rgb(var(--layer-default-rgb))]";
  }
  return "bg-muted/50";
};

function ProtocolTable({ layers }: ProtocolTableProps) {
  const { t } = useTranslation();
  if (!layers || layers.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="w-[140px]">{t('components.protocol.table.layer')}</TableHead>
              <TableHead scope="col">{t('components.protocol.table.resin')}</TableHead>
              <TableHead scope="col" className="w-[80px]">{t('components.protocol.table.color')}</TableHead>
              <TableHead scope="col" className="w-[100px]">{t('components.protocol.table.thickness')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers.map((layer) => (
              <TableRow key={layer.order} className={getLayerStyles(layer.name)}>
                <TableCell className="font-medium">
                  {layer.order}. {layer.name}
                  {layer.optional && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t('components.protocol.table.optional')}</span>
                  )}
                </TableCell>
                <TableCell>{layer.resin_brand}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-background font-medium text-sm">
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
                      <p className="text-xs">{t('components.protocol.table.thicknessTooltip')}</p>
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
                  <span className="text-muted-foreground">{t('components.protocol.table.purpose')}</span>
                  <span>{layer.purpose}</span>
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground">{t('components.protocol.table.technique')}</span>
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
                {layer.optional && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{t('components.protocol.table.optional')}</span>
                )}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-background font-medium text-xs">
                {layer.shade}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {layer.resin_brand} • {layer.thickness}
            </p>
            <div className="text-xs space-y-1 mt-2 pt-2 border-t border-border/50">
              <p><span className="text-muted-foreground">{t('components.protocol.table.purpose')}</span>{layer.purpose}</p>
              <p><span className="text-muted-foreground">{t('components.protocol.table.technique')}</span>{layer.technique}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ProtocolTable);
