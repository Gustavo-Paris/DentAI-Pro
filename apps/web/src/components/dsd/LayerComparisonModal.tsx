import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import type { SimulationLayer } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

const ORIGINAL_VALUE = '__original__';

interface LayerComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Original (before) image base64 or signed URL */
  originalImage: string;
  /** Available layers with resolved image URLs */
  layers: Array<SimulationLayer & { resolvedUrl: string }>;
}

export function LayerComparisonModal({
  open,
  onOpenChange,
  originalImage,
  layers,
}: LayerComparisonModalProps) {
  const { t } = useTranslation();

  const [leftValue, setLeftValue] = useState(ORIGINAL_VALUE);
  const [rightValue, setRightValue] = useState(
    layers.length > 0 ? layers[0].type : ORIGINAL_VALUE,
  );

  const resolveImage = (value: string): string => {
    if (value === ORIGINAL_VALUE) return originalImage;
    const layer = layers.find((l) => l.type === value);
    return layer?.resolvedUrl ?? originalImage;
  };

  const resolveLabel = (value: string): string => {
    if (value === ORIGINAL_VALUE) return t('components.wizard.dsd.simulationViewer.before');
    return getLayerLabel(value as SimulationLayer['type'], t);
  };

  const originalLabel = t('components.wizard.dsd.simulationViewer.before');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>
            {t('components.wizard.dsd.layerComparison.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Layer selectors */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left side */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.leftSide')}
              </label>
              <Select value={leftValue} onValueChange={setLeftValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORIGINAL_VALUE}>
                    {originalLabel}
                  </SelectItem>
                  {layers.map((layer) => (
                    <SelectItem key={layer.type} value={layer.type}>
                      {getLayerLabel(layer.type, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right side */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.rightSide')}
              </label>
              <Select value={rightValue} onValueChange={setRightValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORIGINAL_VALUE}>
                    {originalLabel}
                  </SelectItem>
                  {layers.map((layer) => (
                    <SelectItem key={layer.type} value={layer.type}>
                      {getLayerLabel(layer.type, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison slider */}
          <ComparisonSlider
            beforeImage={resolveImage(leftValue)}
            afterImage={resolveImage(rightValue)}
            beforeLabel={resolveLabel(leftValue)}
            afterLabel={resolveLabel(rightValue)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LayerComparisonModal;
