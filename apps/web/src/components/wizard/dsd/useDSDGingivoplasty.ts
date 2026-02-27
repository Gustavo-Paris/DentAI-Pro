/**
 * Sub-hook for DSD gingivoplasty approval/discard flow.
 *
 * Extracted from useDSDStep to reduce its LOC and isolate
 * the gengivoplasty decision-making logic.
 */
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import type {
  DSDAnalysis,
  DSDResult,
  SimulationLayer,
  SimulationLayerType,
} from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDSDGingivoplastyParams {
  imageBase64: string | null;
  /** Current DSD result with analysis */
  result: DSDResult | null;
  /** Shared gingivoplasty approval state from parent */
  gingivoplastyApproved: boolean | null;
  setGingivoplastyApproved: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Layer URLs map from layer generation */
  layerUrls: Record<string, string>;
  /** Generate a single simulation layer */
  generateSingleLayer: (
    analysis: DSDAnalysis,
    layerType: SimulationLayerType,
    baseImageOverride?: string,
    l2SignedUrl?: string,
  ) => Promise<SimulationLayer | null>;
  /** Resolve signed URL for a layer */
  resolveLayerUrl: (layer: SimulationLayer) => Promise<{ layer: SimulationLayer; url: string | null }>;
  /** Update layer list in parent */
  setLayers: React.Dispatch<React.SetStateAction<SimulationLayer[]>>;
  /** Update layer URL map in parent */
  setLayerUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Set active layer index in parent */
  setActiveLayerIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Set failed layers in parent */
  setFailedLayers: React.Dispatch<React.SetStateAction<SimulationLayerType[]>>;
  /** Update DSD result in parent */
  setResult: React.Dispatch<React.SetStateAction<DSDResult | null>>;
  /** Set retrying layer indicator */
  setRetryingLayer: (layer: SimulationLayerType | null) => void;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

async function urlToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(blobUrl); reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Failed to load image')); };
    img.src = blobUrl;
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDSDGingivoplasty({
  imageBase64,
  result,
  gingivoplastyApproved,
  setGingivoplastyApproved,
  layerUrls,
  generateSingleLayer,
  resolveLayerUrl,
  setLayers,
  setLayerUrls,
  setActiveLayerIndex,
  setFailedLayers,
  setResult,
  setRetryingLayer,
}: UseDSDGingivoplastyParams) {
  const { t } = useTranslation();

  // Check if analysis has gengivoplasty suggestions — use structured fields only
  const hasGingivoSuggestion = useCallback((analysis: DSDAnalysis): boolean => {
    const hasExplicit = !!analysis.suggestions?.some(s => {
      const indication = (s.treatment_indication || '').toLowerCase();
      return indication === 'gengivoplastia' || indication === 'gingivoplasty';
    });
    if (hasExplicit) return true;
    if (analysis.smile_line === 'alta') return true;
    if (analysis.smile_line === 'média') {
      const gingivoKeywords = ['gengivoplastia', 'excesso gengival', 'sorriso gengival', 'coroa clínica curta', 'coroa clinica curta'];
      const hasKeywordInSuggestions = !!analysis.suggestions?.some(s => {
        const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
        return gingivoKeywords.some(kw => text.includes(kw));
      });
      if (hasKeywordInSuggestions) return true;
    }
    return false;
  }, []);

  // Determine which layers to generate based on analysis
  const determineLayersNeeded = useCallback((_analysis: DSDAnalysis): SimulationLayerType[] => {
    const needed: SimulationLayerType[] = ['restorations-only', 'whitening-restorations'];
    if (gingivoplastyApproved === true) {
      needed.push('complete-treatment');
    }
    return needed;
  }, [gingivoplastyApproved]);

  // Approve gengivoplasty: generate L3 chained from L2's composited image
  const handleApproveGingivoplasty = useCallback(async () => {
    setGingivoplastyApproved(true);
    const analysis = result?.analysis;
    if (!analysis || !imageBase64) return;

    setRetryingLayer('complete-treatment');
    try {
      let l2Base64: string | undefined;
      const l2CompositedUrl = layerUrls['whitening-restorations'];
      if (l2CompositedUrl) {
        try {
          l2Base64 = await urlToBase64(l2CompositedUrl);
          logger.log('Gengivoplasty approval: using L2 composited image as input');
        } catch (err) {
          logger.warn('Failed to convert L2 composited URL to base64, using original photo:', err);
        }
      }

      const l2SignedUrl = layerUrls['whitening-restorations'];
      const layer = await generateSingleLayer(analysis, 'complete-treatment', l2Base64, l2SignedUrl);
      const gingivoLabel = t('treatments.gengivoplastia.shortLabel');
      if (!layer) {
        toast.error(t('toasts.dsd.layerError', { layer: gingivoLabel }));
        return;
      }
      const { layer: processed, url } = await resolveLayerUrl(layer);
      setLayers(prev => {
        const updated = [...prev, processed];
        setActiveLayerIndex(updated.length - 1);
        return updated;
      });
      if (url) setLayerUrls(prev => ({ ...prev, [processed.type]: url }));
      setResult(prev => prev ? { ...prev, layers: [...(prev.layers || []), processed] } : prev);
      toast.success(t('toasts.dsd.layerReady', { layer: gingivoLabel }));
    } catch (err) {
      logger.error('Gengivoplasty layer error:', err);
      setFailedLayers(prev => [...prev, 'complete-treatment']);
      const gingivoLabel = t('treatments.gengivoplastia.shortLabel');
      toast.error(t('toasts.dsd.layerError', { layer: gingivoLabel }));
    } finally {
      setRetryingLayer(null);
    }
  }, [result?.analysis, imageBase64, layerUrls, generateSingleLayer, resolveLayerUrl, setLayers, setLayerUrls, setActiveLayerIndex, setFailedLayers, setResult, setRetryingLayer, t]);

  const handleDiscardGingivoplasty = useCallback(() => {
    setGingivoplastyApproved(false);
  }, []);

  return {
    gingivoplastyApproved,
    hasGingivoSuggestion,
    determineLayersNeeded,
    handleApproveGingivoplasty,
    handleDiscardGingivoplasty,
  };
}
