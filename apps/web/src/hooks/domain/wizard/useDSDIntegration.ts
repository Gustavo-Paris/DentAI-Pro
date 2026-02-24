import { useCallback } from 'react';
import type {
  PhotoAnalysisResult,
  DetectedTooth,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isAnterior } from './helpers';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseDSDIntegrationParams {
  analysisResult: PhotoAnalysisResult | null;
  setAnalysisResult: React.Dispatch<React.SetStateAction<PhotoAnalysisResult | null>>;
  setSelectedTeeth: React.Dispatch<React.SetStateAction<string[]>>;
  setToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setDsdResult: React.Dispatch<React.SetStateAction<DSDResult | null>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDSDIntegration({
  analysisResult,
  setAnalysisResult,
  setSelectedTeeth,
  setToothTreatments,
  setStep,
  setDsdResult,
}: UseDSDIntegrationParams) {
  const { t } = useTranslation();
  const handleDSDComplete = useCallback(
    (result: DSDResult | null) => {
      setDsdResult(result);

      if (result?.analysis?.suggestions?.length && analysisResult) {
        const clinicalTeeth = analysisResult.detected_teeth || [];
        const existingNumbers = new Set(clinicalTeeth.map((t) => String(t.tooth)));

        const dsdAdditions: DetectedTooth[] = [];
        for (const s of result.analysis.suggestions) {
          // Skip gengivoplasty suggestions — these are handled as a separate case, not per-tooth
          const proposedLower = s.proposed_change.toLowerCase();
          if (proposedLower.includes('gengivoplastia') || proposedLower.includes('gengival')) continue;

          const toothId = String(s.tooth);
          if (!existingNumbers.has(toothId)) {
            const toothNum = parseInt(toothId);
            const isUpper = toothNum >= 10 && toothNum <= 28;
            const isAnteriorTooth = isAnterior(toothId);

            dsdAdditions.push({
              tooth: toothId,
              tooth_region: isAnteriorTooth
                ? isUpper
                  ? 'anterior-superior'
                  : 'anterior-inferior'
                : isUpper
                  ? 'posterior-superior'
                  : 'posterior-inferior',
              cavity_class: null,
              restoration_size: null,
              substrate: null,
              substrate_condition: null,
              enamel_condition: null,
              depth: null,
              priority: 'média',
              notes: `DSD: ${s.current_issue} → ${s.proposed_change}`,
              treatment_indication: s.treatment_indication || 'resina',
              indication_reason: s.proposed_change,
            });
            existingNumbers.add(toothId);
          }
        }

        if (dsdAdditions.length > 0) {
          const unified = [...clinicalTeeth, ...dsdAdditions].sort(
            (a, b) => (parseInt(a.tooth) || 0) - (parseInt(b.tooth) || 0),
          );
          setAnalysisResult((prev) => (prev ? { ...prev, detected_teeth: unified } : null));
        }

        setToothTreatments((prev) => {
          const updated = { ...prev };
          for (const s of result.analysis.suggestions) {
            // Skip gengivoplasty — don't override per-tooth treatments
            const proposedLower = s.proposed_change.toLowerCase();
            if (proposedLower.includes('gengivoplastia') || proposedLower.includes('gengival')) continue;

            if (s.treatment_indication && s.treatment_indication !== 'resina') {
              if (!prev[s.tooth] || prev[s.tooth] === 'resina') {
                updated[s.tooth] = s.treatment_indication as TreatmentType;
              }
            }
          }
          return updated;
        });
      }

      // Auto-include gengivoplasty if DSD suggests it, UNLESS user explicitly discarded
      const dsdSuggestsGingivo = result?.analysis?.suggestions?.some(s => {
        const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
        return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
      });
      const hasGengivoplasty = dsdSuggestsGingivo && result?.gingivoplastyApproved !== false;
      if (hasGengivoplasty) {
        // Add a virtual "GENGIVO" tooth entry for gengivoplasty
        setSelectedTeeth((prev) =>
          prev.includes('GENGIVO') ? prev : [...prev, 'GENGIVO'],
        );
        setToothTreatments((prev) => ({
          ...prev,
          GENGIVO: 'gengivoplastia' as TreatmentType,
        }));
        toast.info(t('toasts.wizard.gingivoplastyAdded'));
      }

      setStep(5);
    },
    [analysisResult, setAnalysisResult, setSelectedTeeth, setToothTreatments, setStep, setDsdResult],
  );

  const handleDSDSkip = useCallback(() => {
    setDsdResult(null);
    setStep(5);
  }, [setDsdResult, setStep]);

  // Update dsdResult in parent state as the DSD analysis progresses (for draft auto-save)
  const handleDSDResultChange = useCallback((result: DSDResult | null) => {
    setDsdResult(result);
  }, [setDsdResult]);

  return {
    handleDSDComplete,
    handleDSDSkip,
    handleDSDResultChange,
  };
}
