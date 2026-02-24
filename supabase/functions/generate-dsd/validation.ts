import { ERROR_MESSAGES } from "../_shared/cors.ts";
import { DSDAnalysisSchema } from "../_shared/aiSchemas.ts";
import type { AdditionalPhotos, ClinicalToothFinding, DSDAnalysis, PatientPreferences, RequestData } from "./types.ts";

// Validate request
export function validateRequest(data: unknown): { success: boolean; error?: string; data?: RequestData } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.imageBase64 || typeof req.imageBase64 !== "string") {
    return { success: false, error: "Imagem não fornecida" };
  }

  // Validate base64 format
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!base64Pattern.test(req.imageBase64)) {
    return { success: false, error: ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED };
  }

  const validShapes = ['natural', 'quadrado', 'triangular', 'oval', 'retangular'];
  const toothShape = validShapes.includes(req.toothShape as string) ? req.toothShape as string : 'natural';

  // Parse additional photos if provided
  let additionalPhotos: AdditionalPhotos | undefined;
  if (req.additionalPhotos && typeof req.additionalPhotos === 'object') {
    const photos = req.additionalPhotos as Record<string, unknown>;
    additionalPhotos = {
      smile45: typeof photos.smile45 === 'string' && photos.smile45 ? photos.smile45 : undefined,
      face: typeof photos.face === 'string' && photos.face ? photos.face : undefined,
    };
    if (!additionalPhotos.smile45 && !additionalPhotos.face) {
      additionalPhotos = undefined;
    }
  }

  // Parse patient preferences if provided
  let patientPreferences: PatientPreferences | undefined;
  if (req.patientPreferences && typeof req.patientPreferences === 'object') {
    const prefs = req.patientPreferences as Record<string, unknown>;
    const whiteningLevelRaw = typeof prefs.whiteningLevel === 'string' ? prefs.whiteningLevel : undefined;
    const whiteningLevel = (whiteningLevelRaw === 'natural' || whiteningLevelRaw === 'white' || whiteningLevelRaw === 'hollywood')
      ? (whiteningLevelRaw as PatientPreferences['whiteningLevel'])
      : undefined;
    patientPreferences = {
      whiteningLevel,
      aestheticGoals: typeof prefs.aestheticGoals === 'string' ? prefs.aestheticGoals : undefined,
      desiredChanges: Array.isArray(prefs.desiredChanges) ? prefs.desiredChanges : undefined,
    };
    if (!patientPreferences.whiteningLevel && !patientPreferences.aestheticGoals && !patientPreferences.desiredChanges?.length) {
      patientPreferences = undefined;
    }
  }

  // Parse clinical observations if provided (from analyze-dental-photo)
  const clinicalObservations = Array.isArray(req.clinicalObservations)
    ? (req.clinicalObservations as string[]).filter(o => typeof o === 'string')
    : undefined;

  // Parse per-tooth clinical findings if provided
  const clinicalTeethFindings = Array.isArray(req.clinicalTeethFindings)
    ? (req.clinicalTeethFindings as ClinicalToothFinding[]).filter(
        (f): f is ClinicalToothFinding => typeof f === 'object' && f !== null && typeof f.tooth === 'string'
      )
    : undefined;

  // Validate layerType if provided
  const validLayerTypes = ['restorations-only', 'whitening-restorations', 'complete-treatment', 'root-coverage'];
  const layerType = validLayerTypes.includes(req.layerType as string)
    ? req.layerType as RequestData['layerType']
    : undefined;

  return {
    success: true,
    data: {
      imageBase64: req.imageBase64,
      evaluationId: typeof req.evaluationId === "string" ? req.evaluationId : undefined,
      regenerateSimulationOnly: req.regenerateSimulationOnly === true,
      existingAnalysis: req.existingAnalysis
        ? (() => {
            const parsed = DSDAnalysisSchema.safeParse(req.existingAnalysis);
            return parsed.success ? (parsed.data as DSDAnalysis) : undefined;
          })()
        : undefined,
      toothShape: toothShape as RequestData['toothShape'],
      additionalPhotos,
      patientPreferences,
      analysisOnly: req.analysisOnly === true,
      clinicalObservations,
      clinicalTeethFindings,
      layerType,
      inputAlreadyProcessed: req.inputAlreadyProcessed === true,
    },
  };
}
