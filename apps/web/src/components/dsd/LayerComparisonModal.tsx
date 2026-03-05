import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@parisgroup-ai/pageshell/primitives';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import type { SimulationLayer } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

const ORIGINAL_SMILE = '__original_smile__';
const ORIGINAL_FACE = '__original_face__';

type PhotoContext = 'smile' | 'face';

function getPhotoContext(value: string): PhotoContext {
  if (value === ORIGINAL_FACE) return 'face';
  return value === 'face-mockup' ? 'face' : 'smile';
}

interface LayerComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalImage: string;
  facePhotoBase64?: string | null;
  layers: Array<SimulationLayer & { resolvedUrl: string }>;
}

export function LayerComparisonModal({
  open,
  onOpenChange,
  originalImage,
  facePhotoBase64,
  layers,
}: LayerComparisonModalProps) {
  const { t } = useTranslation();

  const smileLayers = useMemo(() => layers.filter(l => l.type !== 'face-mockup'), [layers]);
  const faceLayers = useMemo(() => layers.filter(l => l.type === 'face-mockup'), [layers]);
  const hasFaceContext = !!facePhotoBase64 && faceLayers.length > 0;

  const [leftValue, setLeftValue] = useState(ORIGINAL_SMILE);
  const [rightValue, setRightValue] = useState(
    smileLayers.length > 0 ? smileLayers[0].type : ORIGINAL_SMILE,
  );

  const leftContext = getPhotoContext(leftValue);

  const resolveImage = (value: string): string => {
    if (value === ORIGINAL_SMILE) return originalImage;
    if (value === ORIGINAL_FACE) return facePhotoBase64 || originalImage;
    const layer = layers.find((l) => l.type === value);
    return layer?.resolvedUrl ?? originalImage;
  };

  const resolveLabel = (value: string): string => {
    if (value === ORIGINAL_SMILE) return t('components.wizard.dsd.simulationViewer.before');
    if (value === ORIGINAL_FACE) return t('components.wizard.dsd.layerComparison.faceOriginal');
    return getLayerLabel(value as SimulationLayer['type'], t);
  };

  const handleLeftChange = (value: string) => {
    setLeftValue(value);
    const newContext = getPhotoContext(value);
    const rightContext = getPhotoContext(rightValue);
    if (newContext !== rightContext) {
      if (newContext === 'face') {
        setRightValue(faceLayers.length > 0 ? faceLayers[0].type : ORIGINAL_FACE);
      } else {
        setRightValue(smileLayers.length > 0 ? smileLayers[0].type : ORIGINAL_SMILE);
      }
    }
  };

  const renderRightOptions = () => {
    if (leftContext === 'face') {
      return (
        <>
          <SelectItem value={ORIGINAL_FACE}>
            {t('components.wizard.dsd.layerComparison.faceOriginal')}
          </SelectItem>
          {faceLayers.map((layer) => (
            <SelectItem key={layer.type} value={layer.type}>
              {getLayerLabel(layer.type, t)}
            </SelectItem>
          ))}
        </>
      );
    }
    return (
      <>
        <SelectItem value={ORIGINAL_SMILE}>
          {t('components.wizard.dsd.simulationViewer.before')}
        </SelectItem>
        {smileLayers.map((layer) => (
          <SelectItem key={layer.type} value={layer.type}>
            {getLayerLabel(layer.type, t)}
          </SelectItem>
        ))}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>
            {t('components.wizard.dsd.layerComparison.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.leftSide')}
              </label>
              <Select value={leftValue} onValueChange={handleLeftChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORIGINAL_SMILE}>
                    {t('components.wizard.dsd.simulationViewer.before')}
                  </SelectItem>
                  {smileLayers.map((layer) => (
                    <SelectItem key={layer.type} value={layer.type}>
                      {getLayerLabel(layer.type, t)}
                    </SelectItem>
                  ))}
                  {hasFaceContext && (
                    <>
                      <SelectItem value={ORIGINAL_FACE}>
                        {t('components.wizard.dsd.layerComparison.faceOriginal')}
                      </SelectItem>
                      {faceLayers.map((layer) => (
                        <SelectItem key={layer.type} value={layer.type}>
                          {getLayerLabel(layer.type, t)}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.rightSide')}
              </label>
              <Select value={rightValue} onValueChange={setRightValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {renderRightOptions()}
                </SelectContent>
              </Select>
            </div>
          </div>

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
