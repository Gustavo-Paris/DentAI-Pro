/**
 * Image processing utilities for edge functions.
 * Used by analyze-dental-photo to strip EXIF metadata before sending to AI.
 */

/**
 * Strip EXIF (and other APP markers) from a JPEG image encoded as base64.
 * Removes APP1–APP15 markers (0xFFE1–0xFFEF) which contain GPS, device info, etc.
 * Returns a clean base64 string without metadata.
 */
export function stripJpegExif(base64: string): string {
  const raw = atob(base64);
  const src = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) src[i] = raw.charCodeAt(i);

  // Must start with SOI (0xFFD8)
  if (src[0] !== 0xFF || src[1] !== 0xD8) return base64;

  const out: number[] = [0xFF, 0xD8];
  let pos = 2;

  while (pos < src.length - 1) {
    if (src[pos] !== 0xFF) break;

    const marker = src[pos + 1];

    // SOS (0xFFDA) — start of scan, rest is image data
    if (marker === 0xDA) {
      // Copy everything from SOS to end
      for (let i = pos; i < src.length; i++) out.push(src[i]);
      break;
    }

    // APP1–APP15 markers (0xE1–0xEF): skip (these contain EXIF, XMP, etc.)
    if (marker >= 0xE1 && marker <= 0xEF) {
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      pos += 2 + segLen;
      continue;
    }

    // Any other marker: keep it
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      // Standalone markers (no length field)
      out.push(src[pos], src[pos + 1]);
      pos += 2;
    } else {
      // Marker with length
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      for (let i = 0; i < 2 + segLen; i++) out.push(src[pos + i]);
      pos += 2 + segLen;
    }
  }

  // Re-encode to base64
  const bytes = new Uint8Array(out);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
