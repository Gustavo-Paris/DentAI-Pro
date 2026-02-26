/**
 * Image processing utilities for edge functions.
 * Used by analyze-dental-photo to strip EXIF metadata before sending to AI.
 */

/**
 * Strip EXIF (and other APP markers) from a JPEG image encoded as base64.
 * Removes APP1–APP15 markers (0xFFE1–0xFFEF) which contain GPS, device info, etc.
 * Returns a clean base64 string without metadata.
 *
 * Memory-optimized: uses Uint8Array throughout (1 byte/element) instead of
 * number[] (8 bytes/element) to avoid OOM on Supabase edge functions.
 */
export function stripJpegExif(base64: string): string {
  const raw = atob(base64);
  const len = raw.length;
  const src = new Uint8Array(len);
  for (let i = 0; i < len; i++) src[i] = raw.charCodeAt(i);

  // Must start with SOI (0xFFD8)
  if (src[0] !== 0xFF || src[1] !== 0xD8) return base64;

  // Pre-allocate output buffer (same size as input — stripping only removes data)
  const out = new Uint8Array(len);
  let w = 0;
  out[w++] = 0xFF;
  out[w++] = 0xD8;
  let pos = 2;

  while (pos < len - 1) {
    if (src[pos] !== 0xFF) break;

    const marker = src[pos + 1];

    // SOS (0xFFDA) — start of scan, rest is image data
    if (marker === 0xDA) {
      out.set(src.subarray(pos), w);
      w += len - pos;
      break;
    }

    // APP1–APP15 markers (0xE1–0xEF): skip (these contain EXIF, XMP, etc.)
    if (marker >= 0xE1 && marker <= 0xEF) {
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      pos += 2 + segLen;
      continue;
    }

    // Standalone markers (no length field)
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      out[w++] = src[pos];
      out[w++] = src[pos + 1];
      pos += 2;
    } else {
      // Marker with length — bulk copy
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      const chunkLen = 2 + segLen;
      out.set(src.subarray(pos, pos + chunkLen), w);
      w += chunkLen;
      pos += chunkLen;
    }
  }

  // Re-encode only the used portion to base64
  const trimmed = out.subarray(0, w);
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < trimmed.length; i += CHUNK) {
    binary += String.fromCharCode(...trimmed.subarray(i, Math.min(i + CHUNK, trimmed.length)));
  }
  return btoa(binary);
}
