import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProtocolLayer } from "@/types/protocol";

export type { ProtocolLayer };

interface ProtocolTableProps {
  layers: ProtocolLayer[];
}

interface LayerColors {
  border: string;
  bg: string;
  numberBg: string;
}

const LAYER_COLOR_MAP: Array<{ keywords: string[]; rgb: string }> = [
  { keywords: ["opaco", "mascaramento"], rgb: "249 115 22" },
  { keywords: ["dentina", "corpo", "body"], rgb: "245 158 11" },
  { keywords: ["efeito", "incisai", "corante", "opalescente"], rgb: "139 92 246" },
  { keywords: ["aumento incisal", "incisal edge"], rgb: "20 184 166" },
  { keywords: ["crista", "proxima"], rgb: "16 185 129" },
  { keywords: ["esmalte", "enamel"], rgb: "16 185 129" },
  { keywords: ["translucido"], rgb: "96 165 250" },
  { keywords: ["bulk"], rgb: "168 85 247" },
];

const getLayerColors = (layerName: string): LayerColors => {
  const name = layerName.toLowerCase();

  for (const entry of LAYER_COLOR_MAP) {
    if (entry.keywords.some((kw) => name.includes(kw))) {
      const rgb = entry.rgb;
      return {
        border: `rgb(${rgb})`,
        bg: `color-mix(in srgb, rgb(${rgb}) 8%, transparent)`,
        numberBg: `color-mix(in srgb, rgb(${rgb}) 15%, transparent)`,
      };
    }
  }

  return {
    border: 'var(--color-border)',
    bg: 'transparent',
    numberBg: 'var(--color-muted)',
  };
};

function ProtocolTable({ layers }: ProtocolTableProps) {
  const { t } = useTranslation();
  if (!layers || layers.length === 0) return null;

  return (
    <div className="space-y-3">
      {layers.map((layer, i) => {
        const colors = getLayerColors(layer.name);
        return (
          <div
            key={layer.order}
            className="glass-panel rounded-xl p-4 border-l-[3px]"
            style={{
              borderLeftColor: colors.border,
              background: colors.bg,
              animation: `fade-in-up 0.6s ease-out ${0.3 + i * 0.06}s both`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full font-semibold flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: colors.numberBg }}
              >
                {layer.order}
              </div>
              <span className="font-medium text-foreground">{layer.name}</span>
              {layer.optional && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t('components.protocol.table.optional')}
                </span>
              )}
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('components.protocol.table.resin')}
                </dt>
                <dd className="text-sm font-medium">{layer.resin_brand}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('components.protocol.table.color')}
                </dt>
                <dd className="text-sm font-medium">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium"
                    style={{ backgroundColor: colors.numberBg }}
                  >
                    {layer.shade}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('components.protocol.table.thickness')}
                </dt>
                <dd className="text-sm font-medium">{layer.thickness}</dd>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('components.protocol.table.technique')}
                </dt>
                <dd className="text-sm font-medium">{layer.technique}</dd>
              </div>
              {layer.purpose && (
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t('components.protocol.table.purpose')}
                  </dt>
                  <dd className="text-sm text-muted-foreground">{layer.purpose}</dd>
                </div>
              )}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

export default memo(ProtocolTable);
