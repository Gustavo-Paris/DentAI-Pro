import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { Skeleton } from '@/components/ui/skeleton';
import { Smile } from 'lucide-react';
import { getSignedUrl } from '@/hooks/useSignedUrl';

interface DSDPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Storage path for the clinical photo (before image) */
  photoPath: string | null;
  /** Storage path for the DSD simulation (after image) */
  simulationPath: string | null;
  /** Multi-layer simulation data */
  layers?: Array<{
    type: string;
    simulation_url: string | null;
    includes_gengivoplasty?: boolean;
  }> | null;
}

export function DSDPreviewModal({
  open,
  onOpenChange,
  photoPath,
  simulationPath,
  layers,
}: DSDPreviewModalProps) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  // Load signed URLs on-demand when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    async function loadUrls() {
      const [photoUrl, simUrl] = await Promise.all([
        photoPath ? getSignedUrl('clinical-photos', photoPath) : null,
        simulationPath ? getSignedUrl('dsd-simulations', simulationPath) : null,
      ]);

      if (cancelled) return;
      setBeforeUrl(photoUrl);
      setAfterUrl(simUrl);

      // Load layer URLs if available
      if (layers && layers.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(
          layers.map(async (layer) => {
            if (layer.simulation_url) {
              const url = await getSignedUrl('dsd-simulations', layer.simulation_url);
              if (url && !cancelled) {
                urls[layer.type] = url;
              }
            }
          }),
        );
        if (!cancelled) setLayerUrls(urls);
      }

      if (!cancelled) setIsLoading(false);
    }

    loadUrls();
    return () => { cancelled = true; };
  }, [open, photoPath, simulationPath, layers]);

  const hasLayers = layers && layers.length > 0;
  const activeLayer = hasLayers ? layers[activeLayerIndex] : null;
  const activeAfterUrl = activeLayer
    ? layerUrls[activeLayer.type] || afterUrl
    : afterUrl;

  const LAYER_LABELS: Record<string, string> = {
    'restorations-only': 'Restaurações',
    'whitening-restorations': 'Clareamento + Restaurações',
    'complete-treatment': 'Tratamento Completo',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-primary" />
            Simulação DSD
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="w-full aspect-[4/3] rounded-xl" />
        ) : beforeUrl && activeAfterUrl ? (
          <div className="space-y-3">
            {/* Layer tabs */}
            {hasLayers && layers.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {layers.map((layer, idx) => (
                  <button
                    key={layer.type}
                    onClick={() => setActiveLayerIndex(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      activeLayerIndex === idx
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {LAYER_LABELS[layer.type] || layer.type}
                    {layer.includes_gengivoplasty && (
                      <span className="text-[10px] px-1 py-0 bg-secondary rounded">Gengiva</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <ComparisonSlider
              beforeImage={beforeUrl}
              afterImage={activeAfterUrl}
              afterLabel={activeLayer ? (LAYER_LABELS[activeLayer.type] || 'Simulação DSD') : 'Simulação DSD'}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Smile className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Simulação DSD não disponível</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
