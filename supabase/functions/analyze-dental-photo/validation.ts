import { ERROR_MESSAGES } from "../_shared/cors.ts";
import type { AnalyzePhotoRequest } from "./types.ts";

// Validate image request data
export function validateImageRequest(data: unknown): { success: boolean; error?: string; data?: AnalyzePhotoRequest } {
  if (!data || typeof data !== "object") {
    return { success: false, error: ERROR_MESSAGES.INVALID_REQUEST };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.imageBase64 || typeof obj.imageBase64 !== "string") {
    return { success: false, error: ERROR_MESSAGES.IMAGE_INVALID };
  }

  // Validate imageType if provided
  if (obj.imageType !== undefined) {
    const validTypes = ["intraoral", "frontal_smile", "45_smile", "face"];
    if (typeof obj.imageType !== "string" || !validTypes.includes(obj.imageType)) {
      obj.imageType = "intraoral"; // Default to intraoral
    }
  }

  // Extract optional additionalPhotos (face, smile45 — base64 data URLs)
  let additionalPhotos: AnalyzePhotoRequest['additionalPhotos'];
  if (obj.additionalPhotos && typeof obj.additionalPhotos === 'object') {
    const ap = obj.additionalPhotos as Record<string, unknown>;
    additionalPhotos = {};
    if (typeof ap.face === 'string' && ap.face.length > 0) {
      additionalPhotos.face = ap.face;
    }
    if (typeof ap.smile45 === 'string' && ap.smile45.length > 0) {
      additionalPhotos.smile45 = ap.smile45;
    }
    // If neither field was populated, discard the object
    if (!additionalPhotos.face && !additionalPhotos.smile45) {
      additionalPhotos = undefined;
    }
  }

  // Extract optional patientPreferences
  let patientPreferences: AnalyzePhotoRequest['patientPreferences'];
  if (obj.patientPreferences && typeof obj.patientPreferences === 'object') {
    const pp = obj.patientPreferences as Record<string, unknown>;
    patientPreferences = {};
    const validWhiteningLevels = ['natural', 'white', 'hollywood'];
    if (typeof pp.whiteningLevel === 'string' && validWhiteningLevels.includes(pp.whiteningLevel)) {
      patientPreferences.whiteningLevel = pp.whiteningLevel as 'natural' | 'white' | 'hollywood';
    }
    // If no valid preferences, discard
    if (!patientPreferences.whiteningLevel) {
      patientPreferences = undefined;
    }
  }

  return {
    success: true,
    data: {
      imageBase64: obj.imageBase64 as string,
      imageType: (obj.imageType as string) || "intraoral",
      additionalPhotos,
      patientPreferences,
    },
  };
}
