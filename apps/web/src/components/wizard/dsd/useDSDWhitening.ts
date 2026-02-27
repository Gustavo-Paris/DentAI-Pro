/**
 * Sub-hook for DSD whitening comparison (E4).
 *
 * Extracted from useDSDStep to reduce its LOC and isolate
 * the whitening level comparison feature.
 */
import { useState, useCallback } from 'react';
import { getSignedDSDUrl } from '@/data/storage';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import type {
  DSDAnalysis,
  DSDResult,
  SimulationLayer,
  PatientPreferences,
} from '@/types/dsd';

// Tooth shape is now fixed as 'natural'
const TOOTH_SHAPE = 'natural' as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDSDWhiteningParams {
  imageBase64: string | null;
  patientPreferences?: PatientPreferences;
  /** Current DSD result with analysis */
  result: DSDResult | null;
  /** Layer URLs map from layer generation */
  layerUrls: Record<string, string>;
  /** Main simulation image URL */
  simulationImageUrl: string | null;
  invokeFunction: <T = unknown>(
    functionName: string,
    options?: { body?: Record<string, unknown>; headers?: Record<string, string> },
  ) => Promise<{ data: T | null; error: Error | null }>;
  /** Update layer list */
  setLayers: React.Dispatch<React.SetStateAction<SimulationLayer[]>>;
  /** Update layer URL map */
  setLayerUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Set active layer index */
  setActiveLayerIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Set main simulation image URL */
  setSimulationImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  /** Called when user changes whitening level */
  onPreferencesChange?: (prefs: PatientPreferences) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDSDWhitening({
  imageBase64,
  patientPreferences,
  result,
  layerUrls,
  simulationImageUrl,
  invokeFunction,
  setLayers,
  setLayerUrls,
  setActiveLayerIndex,
  setSimulationImageUrl,
  onPreferencesChange,
}: UseDSDWhiteningParams) {
  const { t } = useTranslation();

  const [whiteningComparison, setWhiteningComparison] = useState<Record<string, string>>({});
  const [isComparingWhitening, setIsComparingWhitening] = useState(false);
  const [showWhiteningComparison, setShowWhiteningComparison] = useState(false);

  // Generate whitening comparison (3 levels)
  const generateWhiteningComparison = useCallback(async () => {
    const analysis = result?.analysis;
    if (!imageBase64 || !analysis) return;

    setIsComparingWhitening(true);
    setShowWhiteningComparison(true);

    const allLevels: Array<'natural' | 'hollywood'> = ['natural', 'hollywood'];
    const currentLevel = patientPreferences?.whiteningLevel || 'natural';
    const missingLevels = allLevels.filter(l => l !== currentLevel);

    try {
      const results = await Promise.allSettled(
        missingLevels.map(async (level) => {
          const reqId = crypto.randomUUID();
          const { data } = await withRetry(
            async () => {
              const resp = await invokeFunction<DSDResult>('generate-dsd', {
                body: {
                  reqId,
                  imageBase64,
                  toothShape: TOOTH_SHAPE,
                  regenerateSimulationOnly: true,
                  existingAnalysis: analysis,
                  patientPreferences: { whiteningLevel: level },
                },
              });
              if (resp.error || !resp.data?.simulation_url) {
                throw resp.error || new Error('No URL');
              }
              return resp;
            },
            { maxRetries: 1, baseDelay: 3000 },
          );

          if (data?.simulation_url) {
            const signedUrl = await getSignedDSDUrl(data.simulation_url);
            return { level, url: signedUrl };
          }
          return { level, url: null };
        })
      );

      const urls: Record<string, string> = {};
      const currentLayerUrl = layerUrls['whitening-restorations'] || simulationImageUrl;
      if (currentLayerUrl) {
        urls[currentLevel] = currentLayerUrl;
      }

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.url) {
          urls[r.value.level] = r.value.url;
        }
      }

      setWhiteningComparison(urls);
      toast.success(t('toasts.dsd.whiteningReady'));
    } catch (err) {
      logger.error('Whitening comparison error:', err);
      toast.error(t('toasts.dsd.whiteningError'));
    } finally {
      setIsComparingWhitening(false);
    }
  }, [imageBase64, result?.analysis, invokeFunction, patientPreferences, layerUrls, simulationImageUrl, t]);

  const handleSelectWhiteningLevel = useCallback((level: 'natural' | 'white' | 'hollywood', url: string) => {
    const labels: Record<string, string> = {
      natural: 'Natural (A1/A2)',
      white: 'Branco (BL2/BL3)',
      hollywood: 'Diamond (BL1/BL2/BL3)',
    };
    onPreferencesChange?.({ whiteningLevel: level });
    setLayerUrls(prev => ({ ...prev, 'whitening-restorations': url }));
    setLayers(prev => prev.map(l =>
      l.type === 'whitening-restorations'
        ? { ...l, whitening_level: level, simulation_url: url }
        : l
    ));
    setSimulationImageUrl(url);
    // Find whitening tab index — use functional lookup since layers may have changed
    setLayers(prev => {
      const whiteningIdx = prev.findIndex(l => l.type === 'whitening-restorations');
      if (whiteningIdx >= 0) {
        setActiveLayerIndex(whiteningIdx);
      }
      return prev; // no mutation
    });
    toast.success(t('toasts.dsd.whiteningUpdated', { level: labels[level] }));
  }, [onPreferencesChange, setLayerUrls, setLayers, setActiveLayerIndex, setSimulationImageUrl, t]);

  return {
    whiteningComparison,
    isComparingWhitening,
    showWhiteningComparison,
    setShowWhiteningComparison,
    generateWhiteningComparison,
    handleSelectWhiteningLevel,
  };
}
