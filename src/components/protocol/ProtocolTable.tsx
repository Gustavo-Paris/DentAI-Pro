import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ProtocolLayer {
  order: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness: string;
  purpose: string;
  technique: string;
}

interface ProtocolTableProps {
  layers: ProtocolLayer[];
}

const getLayerStyles = (layerName: string): string => {
  const name = layerName.toLowerCase();
  if (name.includes("opaco")) {
    return "bg-amber-500/20 border-l-4 border-l-amber-500";
  }
  if (name.includes("dentina") || name.includes("body")) {
    return "bg-orange-500/20 border-l-4 border-l-orange-500";
  }
  if (name.includes("esmalte") || name.includes("enamel")) {
    return "bg-blue-400/20 border-l-4 border-l-blue-400";
  }
  if (name.includes("bulk")) {
    return "bg-purple-500/20 border-l-4 border-l-purple-500";
  }
  return "bg-muted/50";
};

export default function ProtocolTable({ layers }: ProtocolTableProps) {
  if (!layers || layers.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
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
                {layer.thickness}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Layer details on hover/expand */}
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
  );
}
