import { useEffect, useState } from 'react';
import { getSharedEvaluation, getSharedDSD, type SharedEvaluationRow, type SharedDSDData } from '@/data/evaluations';
import { getSignedPhotoUrl, getSignedDSDUrl } from '@/data/storage';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharedEvaluationState {
  loading: boolean;
  expired: boolean;
  evaluations: SharedEvaluationRow[];
  dsdData: SharedDSDData | null;
  beforeImageUrl: string | null;
  simulationUrl: string | null;
  layerUrls: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSharedEvaluation(token: string | undefined): SharedEvaluationState {
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [evaluations, setEvaluations] = useState<SharedEvaluationRow[]>([]);
  const [dsdData, setDsdData] = useState<SharedDSDData | null>(null);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [simulationUrl, setSimulationUrl] = useState<string | null>(null);
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({});

  // Fetch shared evaluation data
  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) return;

      try {
        const [rows, dsd] = await Promise.all([
          getSharedEvaluation(token),
          getSharedDSD(token),
        ]);
        if (rows.length === 0) {
          setExpired(true);
        } else {
          setEvaluations(rows);
          if (dsd) setDsdData(dsd);
        }
      } catch (error) {
        console.error('Error fetching shared evaluation:', error);
        logger.error('Error fetching shared evaluation:', error);
        setExpired(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [token]);

  // Resolve signed URLs for DSD images
  useEffect(() => {
    let mounted = true;
    if (!dsdData) return;
    const resolve = async () => {
      // Before image (clinical photo)
      if (dsdData.photo_frontal) {
        const url = await getSignedPhotoUrl(dsdData.photo_frontal);
        if (mounted && url) setBeforeImageUrl(url);
      }
      // Main simulation URL
      if (dsdData.dsd_simulation_url) {
        const url = await getSignedDSDUrl(dsdData.dsd_simulation_url);
        if (mounted && url) setSimulationUrl(url);
      }
      // Layer URLs
      if (dsdData.dsd_simulation_layers?.length) {
        const urls: Record<string, string> = {};
        await Promise.all(
          dsdData.dsd_simulation_layers.map(async (layer) => {
            if (!layer.simulation_url) return;
            const url = await getSignedDSDUrl(layer.simulation_url);
            if (url) urls[layer.type] = url;
          })
        );
        if (mounted) setLayerUrls(urls);
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [dsdData]);

  return {
    loading,
    expired,
    evaluations,
    dsdData,
    beforeImageUrl,
    simulationUrl,
    layerUrls,
  };
}
